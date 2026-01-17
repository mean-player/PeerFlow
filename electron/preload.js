const { contextBridge, shell, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mime = require('mime-types');

// preload.js 在 app.electron 文件夹下
const basePath = path.join(process.resourcesPath, '..');  // 打包后 → 安装目录根
//const basePath =path.resolve(__dirname, '..');          // 开发环境 → app 根



// 配置文件
const configPath = path.join(basePath, 'config', 'config.json');
const configPath_java = path.join(basePath, 'config', 'application.properties');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// JRE 和 Jar
const jreBin = path.join(basePath,'java', 'jre', 'bin', 'java.exe');
const jarPath = path.join(basePath,'java', 'Muvex.jar');

// 数据库和日志

const logPath = path.join(basePath,'java', 'logs');
const helperPath = path.join(basePath,'README','README.txt');


contextBridge.exposeInMainWorld('appConfig', {
  myPublicIP: config.myPublicIP,
  serverPort: config.serverPort,

});

contextBridge.exposeInMainWorld('myAPI', {
  openFile: async (filePath) => {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    try {
      const result = await shell.openPath(filePath);
      // openPath 返回空字符串表示成功，非空字符串是错误信息
      return result === '';
    } catch (e) {
      console.error('Failed to open file:', e);
      return false;
    }
  },

  selectFileAndInfo: async () => {
    // 通过 ipc 调用主进程弹窗
    const fileInfo = await ipcRenderer.invoke('dialog:openFile');
    return fileInfo; // 可能是null或文件信息对象
  }
});




const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');  // 注意从这里导入 Client

let stompClient = null;

contextBridge.exposeInMainWorld('myWebSocketAPI', {
  connect: (wsUrl) => {
    return new Promise((resolve, reject) => {
      if (stompClient && stompClient.connected) {
        resolve('already connected');
        return;
      }

      stompClient = new Client({
        // 使用 SockJS 作为 WebSocket 工厂
        webSocketFactory: () => new SockJS(wsUrl),

        // 连接头，可加token或其他信息
        connectHeaders: {},

        // 连接成功回调
        onConnect: (frame) => {
          // 订阅消息
          stompClient.subscribe('/user/queue/info', message => {
            const data = JSON.parse(message.body);
            ipcRenderer.send('ws-info', data);
          });
          stompClient.subscribe('/user/queue/file', message => {
            const data = JSON.parse(message.body);
            ipcRenderer.send('ws-file', data);
          });
          stompClient.subscribe('/user/queue/progress', message => {
            const data = JSON.parse(message.body);
            ipcRenderer.send('ws-progress', data);
          });
          resolve(frame);
        },

        // 连接错误回调
        onStompError: (frame) => {
          reject(new Error(frame.headers.message || 'STOMP error'));
        },

        // 调试输出
        debug: (str) => {
          console.log('[STOMP DEBUG]', str);
        }
      });

      stompClient.activate();
    });
  },

  disconnect: () => {
    if (stompClient) {
      stompClient.deactivate();  // 新版用 deactivate 而不是 disconnect
      stompClient = null;
    }
  },

  isConnected: () => {
    return stompClient ? stompClient.connected : false;
  },

  sendMessage: (destination, payload) => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({destination, body: JSON.stringify(payload)});
      return true;
    }
    return false;
  }
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  onInfo: (callback) => ipcRenderer.on('ws-info', (event, data) => callback(data)),
  onFile: (callback) => ipcRenderer.on('ws-file', (event, data) => callback(data)),
  onProgress: (callback) => ipcRenderer.on('ws-progress', (event, data) => callback(data)),
});




//log operate
function getLogSizeSync() {
    let totalSize = 0;

    function getSizeRecursively(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                getSizeRecursively(fullPath);
            } else {
                totalSize += stats.size;
            }
        }
    }

    if (fs.existsSync(logPath)) {
        getSizeRecursively(logPath);
    }

    return totalSize;
}




contextBridge.exposeInMainWorld('logUtils', {
    getLogSize: () => {
        return getLogSizeSync();
    },

    openLogFolder: () => {
        shell.openPath(logPath);
    }
});

contextBridge.exposeInMainWorld('helpUtils',{
  openHelpFolder: () => {
    shell.openPath(helperPath);
  }
});



//port change


contextBridge.exposeInMainWorld('configUpdater', {
    updateServerPort: (newPort) => {
        if (!Number.isInteger(newPort) || newPort <= 0 || newPort > 65535) {
            throw new Error('The port number is invalid. It must be an integer between 1 and 65535.');
        }


        //  更新前端配置 JSON
        let frontendConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        frontendConfig.serverPort = newPort;
        fs.writeFileSync(configPath, JSON.stringify(frontendConfig, null, 2), 'utf-8');

        return {
            backendPort: newPort,
            frontendPort: newPort
        };
    }
});




//show page2
// 读取 application.properties 并解析成对象
function readProperties(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`The configuration file does not exist.: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const props = {};

    content.split(/\r?\n/).forEach(line => {
        // 去掉注释和空行
        if (!line.trim() || line.trim().startsWith('#')) return;
        const [key, ...valueParts] = line.split('=');
        props[key.trim()] = valueParts.join('=').trim();
    });

    return props;
}

// 获取 file.upload.path 的绝对路径
function getUploadPath() {
    const props = readProperties(configPath_java);
    let uploadPath = props['file.final'];

    if (!uploadPath) {
        throw new Error('file.final is not configured.');
    }

    // 如果是相对路径，转成绝对路径
    if (!path.isAbsolute(uploadPath)) {
        uploadPath = path.resolve(path.dirname(configPath_java), uploadPath);
    }

    return uploadPath;
}

// 暴露给渲染进程
contextBridge.exposeInMainWorld('configUtils', {
    getUploadPath: () => {
        try {
            return getUploadPath();
        } catch (err) {
            console.error('Failed to read file.upload.path,', err);
            return null;
        }
    }
});



// checkResult暴露给渲染进程
contextBridge.exposeInMainWorld('startupData', {
    onCheckResult:(callback)=>ipcRenderer.on('checkResult',(event,data)=>callback(data))
});















