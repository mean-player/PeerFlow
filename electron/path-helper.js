// path-helper.js
const path = require('path');
const { app } = require('electron');

function getBasePath() {
  if (app.isPackaged) {
    // 打包后，基准是安装目录根（resources 的上一级）
    return path.join(process.resourcesPath, '..');
  } else {
    // 开发环境，基准是 electron 目录的上一级（app/）
    return path.resolve(__dirname, '..');
  }
}

function getPath(...subPaths) {
  return path.join(getBasePath(), ...subPaths);
}

module.exports = { getBasePath, getPath };