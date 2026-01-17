// Copyright (c) 2025 Alex Cash
// Licensed under MIT License. See LICENSE file for details.

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const mime = require('mime-types');

const { getPath } = require('./path-helper');
const {checkBeforeStart} = require('./checkbeforestart');

const configPath = getPath('config', 'config.json');
const configPath_java = getPath('config', 'application.properties');


const jreBin = getPath('java', 'jre', 'bin', 'java.exe');
const jarPath = getPath('java', 'Muvex.jar');
const javaCwd = getPath('java');

const dbPath = getPath('java', 'database', 'muvex.db');





//ipc
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  try {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath);
    const type = mime.lookup(ext) || '';

    return {
      path: filePath.replace(/\\/g, '/'),
      name: path.basename(filePath),
      size: stats.size,
      type
    };
  } catch (err) {
    return null;
  }
});


function spawnBackend(serverPort) {
  return new Promise((resolve, reject) => {

    const args = [
      '-jar', jarPath,
      `--server.port=${serverPort}`,
      `--spring.config.location=file:${configPath_java}`,
      `--spring.datasource.url=jdbc:sqlite:${dbPath.replace(/\\/g,'/')}?journal_mode=WAL`
    ];
    const child = spawn(jreBin, args, {
      cwd: javaCwd
    });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');




    child.stdout.on('data', (data) => {
      const msg = data.toString();
      process.stdout.write(msg);
      if (msg.includes("Started") ) {
        resolve(child);
      }
    });


    child.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    child.on('error', (err) => {
      console.error('Error occurred while starting the JAR:', err);
      reject(err);
    });

    child.on('exit', (code) => {
      console.log(`JAR had exit，exit code: ${code}`);
      if (code !== 0) reject(new Error(`The JAR process exited abnormally.: ${code}`));
    });
  });
}



ipcMain.on('ws-info', (event, data) => {

  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('ws-info', data);
  });
});

ipcMain.on('ws-file', (event, data) => {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('ws-file', data);
  });
});

ipcMain.on('ws-progress', (event, data) => {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('ws-progress', data);
  });
});

ipcMain.handle('selectUploadFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});



function createWindow() {
  const win = new BrowserWindow({
    width: 1430,
    height: 850,
    autoHideMenuBar:true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      //preload: path.join(app.getAppPath(),'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox:false,
    },
  });
  win.loadFile(path.join(__dirname, 'public', 'Admin.html'));

  win.on('closed',() =>{
  mainWindow = null;
  });
  //win.webContents.openDevTools();
  return win;
}

let backendProcess = null;
app.whenReady().then(async () => {
  let result = null;
  try{
    result = await checkBeforeStart();
    const serverPort = result.port;
    backendProcess = await spawnBackend(serverPort);
    result.backendStarted=true;
  }catch(error){
    console.error('Backend failed to start:',error);
  }
  mainWindow = createWindow();
  mainWindow.webContents.once('did-finish-load',()=>{
    mainWindow.webContents.send('checkResult',result);
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit' ,()=>{

  if(backendProcess){
    backendProcess.kill();
    backendProcess=null;
  }
});












