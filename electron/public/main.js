
const IP = window.appConfig.myPublicIP;
const port = window.appConfig.serverPort;
  

let PageId="";
function showPage(id) {
  
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(div => div.classList.remove('active'));
   //隐藏所有card
    hidAllCard();
   //初始化page5 6 的侧按钮
  
    document.getElementById('slideBtn').textContent="打开侧栏";
    document.getElementById('slideBtn').dataset.mode = 'view';
    document.getElementById('slideBtn_2').textContent="打开侧栏";
    document.getElementById('slideBtn_2').dataset.mode = 'view_2';
  
  
    // 显示指定页面
    document.getElementById(id).classList.add('active');
    //隐藏勋章
    if(id === 'page5'){
      
      clearUploadRequestBadge();
    }
    if(id === 'page6'){
     
      clearUploadingBadge();
    }
    
    PageId=id;
  
    
    
    
  }

    



function hidAllCard(){
  const cards = document.querySelectorAll('.card');
    cards.forEach(card =>{
    card.classList.add('hidden');
    });
  document.getElementById("page1").classList.remove('shifted');
  document.getElementById("page5").classList.remove('shifted');
  document.getElementById("page6").classList.remove('shifted');
  document.getElementById("slideBtn").classList.remove('shifted');
  document.getElementById("slideBtn_2").classList.remove('shifted');
}

  
  
function showQdCard(){
  hidAllCard();
  document.getElementById("page1").classList.add('shifted');
  document.getElementById('quickDownloadPanel').classList.remove('hidden');
  

}

function hidQdCard(){
  document.getElementById("page1").classList.remove('shifted');
  hidAllCard();
  
}
  
function showQuCard(){
  hidAllCard();
  document.getElementById("page1").classList.add('shifted');
  document.getElementById('quickUploadDiv').classList.remove('hidden');
}

function hidQuCard(){
  document.getElementById("page1").classList.remove('shifted');
  hidAllCard();
  
}

function showAuditCard(){
  hidAllCard();
  document.getElementById("page5").classList.add('shifted');
   document.getElementById("slideBtn").classList.add('shifted');
  document.getElementById('auditPanel').classList.remove('hidden');
  
}

function hidAuditCard(){
  hidAllCard();
  document.getElementById("page5").classList.remove('shifted');
   document.getElementById("slideBtn").classList.remove('shifted');
  
  
}

function showProgressCard(){
  hidAllCard();
  document.getElementById("page6").classList.add('shifted');
  document.getElementById("slideBtn_2").classList.add('shifted');
  document.getElementById('progressPanel').classList.remove('hidden');
  
}

function hidProgressCard(){
  hidAllCard();
  document.getElementById("page6").classList.remove('shifted');
  document.getElementById("slideBtn_2").classList.remove('shifted');
  
  
}

function simplifyDate(dateStr) {
  // 1. 标准化 ISO 格式（兼容各种日期格式）
  let parsedDate = new Date(dateStr);

  // 2. 判断是否为合法日期
  if (isNaN(parsedDate.getTime())) {
    console.warn("无法解析时间：", dateStr);
    return dateStr; // 解析失败，原样返回
  }

  const now = new Date();
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const hour = String(parsedDate.getHours()).padStart(2, '0');
  const minute = String(parsedDate.getMinutes()).padStart(2, '0');

  // 3. 构造简化显示
  if (year === now.getFullYear()) {
    return `${month}/${day} ${hour}:${minute}`;
  } else {
    return `${year}/${month}/${day} ${hour}:${minute}`;
  }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return value.toFixed(2) + ' ' + sizes[i];
}


function addUploadRequestBadge() {
  const button = document.querySelector("#sidebar button:nth-child(2) .badge");
  let count = parseInt(button.textContent) || 0;
  button.textContent = count + 1;
  button.parentElement.classList.add("has-notify");
}

function clearUploadRequestBadge() {
  const button = document.querySelector("#sidebar button:nth-child(2) .badge");
  button.textContent = "0";
  button.parentElement.classList.remove("has-notify");
}

function addUploadingBadge() {
  const button = document.querySelector("#sidebar button:nth-child(3) .badge");
  let count = parseInt(button.textContent) || 0;
  button.textContent = count + 1;
  button.parentElement.classList.add("has-notify");
}

function clearUploadingBadge() {
  const button = document.querySelector("#sidebar button:nth-child(3) .badge");
  button.textContent = "0";
  button.parentElement.classList.remove("has-notify");
}




  
const buttons = document.querySelectorAll('#sidebar button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active')); // 移除全部
      btn.classList.add('active'); // 当前按钮高亮
    });
  });

// 获取当前时间并格式化为 yyyy-MM-ddTHH:mm
  function getCurrentDateTimeLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000); // 转为本地时间
    return localDate.toISOString().slice(0, 16); // 截取为 yyyy-MM-ddTHH:mm
  }
  
document.getElementById('expire_time').min=getCurrentDateTimeLocal();
document.getElementById('expire').min=getCurrentDateTimeLocal();
document.getElementById('expireInput').min=getCurrentDateTimeLocal();


//Toast

const toastQueue = [];
let isShowing = false;

function showToast(message, duration = 1500) {
    toastQueue.push({ message, duration });
    if (!isShowing) {
        displayNextToast();
    }
}

function displayNextToast() {
    if (toastQueue.length === 0) {
        isShowing = false;
        return;
    }

    isShowing = true;
    const { message, duration } = toastQueue.shift();
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(displayNextToast, 200); // 等动画结束后显示下一个
    }, duration);
}


// 使用 SHA-256 生成文件哈希（加上时间）
  async function generateFileHashWithTime(fileInfo) {
  // fileInfo 结构: { name, type, size, path }
  const now = new Date().toISOString(); // 当前时间（保证唯一性）

  // 拼接一个唯一字符串
  const dataString = `${fileInfo.name}|${fileInfo.type}|${fileInfo.size}|${fileInfo.path}|${now}`;

  // 转成字节
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(dataString);

  // 生成 SHA-256 哈希
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join('');

  return hashHex;
}


function hasIllegalChars(str) {

    const illegalChars = /[<>:"/\\|?*]/;
    return illegalChars.test(str);
}


  

document.addEventListener('DOMContentLoaded', () => {
  window.startupData.onCheckResult((startupResult) => {
    if(startupResult === null){
      showToast('启动异常，请查看日志和用户手册');
    }
    if (!startupResult.result_1) {
      showToast('更新ip失败');
    }
    if (!startupResult.result_2) {
      showToast('更新ip失败');
    }
    if (!startupResult.result_3) {
      showToast('上传文件目录缺失，请完善！');
    }if(startupResult.portChange){
      showToast('当前使用的端口号为：'+startupResult.port);
    }if(!startupResult.backendStarted){
      showToast('后端程序启动失败，请查看日志和用户手册');
    }
  });
});
  





















  
