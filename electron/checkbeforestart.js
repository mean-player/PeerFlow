const path = require('path');
const fs = require('fs');
const os = require('os');

const net = require('net');
const { execSync } = require('child_process');

const { getPath } = require('./path-helper');

// 配置文件
const configPath = getPath('config', 'config.json');
const configPath_java = getPath('config', 'application.properties');

//
let portChange = false;
let backendStarted = false;

function getLocalIP() {
  const nets = os.networkInterfaces();
  let fallback = null;

  // 先尝试优先找名称里包含 wlan 或 wifi 的接口的 IPv4
  for (const name of Object.keys(nets)) {
    if (name.toLowerCase().includes('wlan') || name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wifi')) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }

  // 没找到优先网卡，再遍历所有，返回第一个非内网IPv4作为备用
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        fallback = net.address;
        break;
      }
    }
    if (fallback) break;
  }

  return fallback || '127.0.0.1';
}

function updateConfigIP() {
  let config = {};
  if (!fs.existsSync(configPath)) {
    return false;
  }
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  config.myPublicIP = getLocalIP();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return true;
}

function updateIPInJavaConfig() {
  const newIP = getLocalIP();
  if (!fs.existsSync(configPath_java)) {
    console.error('config file not found', configPath_java);
    return false;
  }
  let content = fs.readFileSync(configPath_java, 'utf-8');
  const ipPattern = /^my\.public\.ip\s*=.*$/m;

  if (ipPattern.test(content)) {
    content = content.replace(ipPattern, `my.public.ip=${newIP}`);
  } else {
    content += `\nmy.public.ip=${newIP}\n`;
  }

  fs.writeFileSync(configPath_java, content, 'utf-8');
  console.log(`new IP: ${newIP}`);
  return true;
}




/**
 * 读取 application.properties 并返回 key-value 对象
 */
function readJavaConfig(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = {};
    content.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...rest] = line.split('=');
            config[key.trim()] = rest.join('=').trim();
        }
    });
    return config;
}
/**
 * 把相对路径转换
 */
function writeJavaConfig(filePath, config) {
    // 重新拼接内容，保持原顺序不一定能保证，简单写法
    const lines = [];
    for (const key in config) {
        lines.push(`${key}=${config[key]}`);
    }
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}
/**
 * 检查目录是否存在
 */
function directoryExists(dirPath) {
    return fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
}
 // 创建目录（如果不存在）
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory created: ${dirPath}`);
    }
    return fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
}

/**
 * 检查 file.upload.path / file.temp / file.final 是否都存在
 */
function checkUploadDirs() {
    if (!fs.existsSync(configPath_java)) {
        console.error('The configuration file of java does not exist.:', configPath_java);
        return false;
    }

    const config = readJavaConfig(configPath_java);
    const baseDir = path.dirname(configPath_java);

    // 转成绝对路径
    function toAbsolute(p) {
        if (!p) return p;
        if (path.isAbsolute(p)) {
            return p;
        } else {
            return path.resolve(baseDir, p);
        }
    }

    const uploadPath = toAbsolute(config['file.upload.path']);
    const tempPath = toAbsolute(config['file.temp']);
    const finalPath = toAbsolute(config['file.final']);

    // 回写成绝对路径（只有相对路径才改）
    let updated = false;
    if (config['file.upload.path'] !== uploadPath) {
        config['file.upload.path'] = uploadPath.replace(/\\/g, '/');
        updated = true;
    }
    if (config['file.temp'] !== tempPath) {
        config['file.temp'] = tempPath.replace(/\\/g, '/');
        updated = true;
    }
    if (config['file.final'] !== finalPath) {
        config['file.final'] = finalPath.replace(/\\/g, '/');
        updated = true;
    }

    if (updated) {
        writeJavaConfig(configPath_java, config);
        console.log('The relative path has been converted to an absolute path and written back to the application.properties.');
    }

    // 检查是否存在
    const allExist =
        ensureDir(uploadPath) &&
        ensureDir(tempPath) &&
        ensureDir(finalPath);
    console.log("The result of the upload directory check is: "+allExist);

    return allExist;
}

//生成passwordkey
function generateRandomKey(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for(let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}



function checkPasswordKey(){
    if (!fs.existsSync(configPath_java)) {
        console.error('The configuration file of java does not exist.:', configPath_java);
        return false;
    }
    const config = readJavaConfig(configPath_java);
    const passwordKey = config.PasswordKEY;
    if(passwordKey === 'none'){
        config.PasswordKEY = generateRandomKey(16);
        writeJavaConfig(configPath_java, config);
        console.log('The passwordkey in application.properties has been initialized, which suggests that this is likely the first launch.');
    }  
}


async function findFreePort(start = 8000, end = 9000) {
    const ports = [];
    for (let port = start; port <= end; port++) {
        ports.push(port);
    }

    // 打乱端口顺序（Fisher–Yates shuffle）
    for (let i = ports.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ports[i], ports[j]] = [ports[j], ports[i]];
    }

    // 挨个测试
    for (const port of ports) {
        if (await isPortFree(port)) {
            return port;
        }
    }

    throw new Error(`No free port found in range ${start}-${end}`);
}

function isPortFree(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

function openFirewallPort(port) {
  try {
    const cmd = `netsh advfirewall firewall add rule name="Muvex Port ${port}" dir=in action=allow protocol=TCP localport=${port}`;
    execSync(`powershell -Command "Start-Process cmd -ArgumentList '/c ${cmd}' -Verb runAs"`);
    console.log(`Firewall port ${port} opened ! `);
  } catch (e) {
    console.error('Failed to open firewall port.');
    // 这里不要直接退出，给用户提示
  }
}

function updateConfig(port) {
  
    //  更新前端配置 JSON
    let frontendConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    frontendConfig.serverPort = port;
    fs.writeFileSync(configPath, JSON.stringify(frontendConfig, null, 2), 'utf-8');
}



async function checkPortOpen(){
    let frontendConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if(frontendConfig.serverPort === 'none'){
        const port = await findFreePort();
        openFirewallPort(port);
        console.log(`port :${port} has opened and updated to config.json`);
        updateConfig(port);
        portChange = true;
        return port;
    }else{
      const port = frontendConfig.serverPort;
      if(await isPortFree(port)){
        console.log(`port :${port} is free`);
        return port;
      }else{
        const new_port = await findFreePort();
        openFirewallPort(new_port);
        console.log(`port :${new_port} has opened and updated to config.json`);
        updateConfig(new_port);
        portChange=true;
        return new_port;
      }
    }
}






async function checkBeforeStart(){
    const result_1 = updateConfigIP();
    const result_2 = updateIPInJavaConfig();
    const result_3 = checkUploadDirs();
    checkPasswordKey();
    const port = await checkPortOpen();
    const result = {
        port,
        result_1,
        result_2,
        result_3,
        portChange,
        backendStarted
    };
    if(result_1&&result_2&&result_3){
        console.log('The IP and upload path have been checked and updated.');
    }
    return result;
}

module.exports = {checkBeforeStart};

