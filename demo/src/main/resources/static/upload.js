function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return value.toFixed(2) + ' ' + sizes[i];
}

function showToast(message, duration = 1500) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

function formatToSimpleDateTime(input) {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }

    const pad = (n) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());

    return `${year}-${month}-${day} ${hour}:${minute}`;
}
const serverIp = getQueryParam("server").replace(/^"|"$/g, ''); // 去掉开头和结尾的双引号
const token = getQueryParam("token");
const serverPort = getQueryParam("port");
console.log("token= "+token);
console.log(serverIp);
// 页面加载时执行
window.addEventListener("load", () => {
    if (!token) {
        document.getElementById("desc").textContent = "缺少 token 参数，无法加载数据。";
        return;
    }
    loadLinkInfo(token);
});

function getUsername() {
  const input = document.getElementById("usernameInput");
  const val = input.value.trim();
  return val !== "" ? val : input.placeholder;
}

/**
 * 请求后端接口获取 ViewLink 信息
 * @param {string} token
 */
function loadLinkInfo(token) {
    fetch(`http://${serverIp}:${serverPort}/share/LinkInfo?token=${encodeURIComponent(token)}`)
        .then(res => res.json())
        .then(data => {
            if (data) {

                renderPage(data);
                console.log("Retrieval of linkPart completed.");
            } else {
                document.getElementById("desc").textContent = "获取链接信息失败：" + data.message;
            }
        })
        .catch(err => {
            console.error("Request error.:", err);
            document.getElementById("desc").textContent = "请求出错，请检查网络或后端服务。";
        });
}

/**
 * 渲染 ViewLink 信息
 * @param {Object} viewLink
 */
function renderPage(LinkPart) {
    console.log("Starting to render information.");
    const link_desc = LinkPart.link_desc;
    const expire_time = LinkPart.expire_time;

    // 设置提示信息
    console.log("The description of the link is ："+link_desc);
    document.getElementById("desc").textContent = link_desc;

    // 设置过期时间
    const expireEl = document.getElementById("expire_time").textContent = formatToSimpleDateTime(expire_time);
    if (LinkPart && expire_time) {
        expireEl.textContent = expire_time;
    } else {
        expireEl.textContent = "无";
    }
}

function setStatusText(text) {
    const el = document.getElementById('statusText');
    console.log("The found statusText element(s)：", el);
    if (el) {
        el.textContent = text;
    } else {
        console.error("The #statusText element was not found. This may be because the HTML has not been loaded or there is a spelling error in the ID.");
    }
}


function createFileUploadEntry(file, permitCode) {
    const container = document.getElementById('statusContainer');

    const entry = document.createElement('div');
    entry.className = 'file-upload-entry';
    entry.style.marginBottom = '10px';

    const label = document.createElement('p');
    label.textContent = file.name;

    const progress = document.createElement('progress');
    progress.max = file.size;
    progress.value = 0;
    progress.style.width = '300px';
    progress.style.marginRight = '10px';



    entry.appendChild(label);
    entry.appendChild(progress);
    container.appendChild(entry);

    return progress;  // 返回 progress，供 uploadFile 更新进度
}

// 获取 IP

async function getMyIp() {
    try {
        const response = await fetch(`http://${serverIp}:${serverPort}/share/getIp`);
        if (!response.ok) throw new Error("Network error: " + response.status);
        const ip = await response.text(); // 后端返回的是字符串
        return ip;
    } catch (error) {
        console.error("Failed to obtain the IP:", error);
        return null;
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = (c === 'x') ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}

// 使用uuid

const userToken = generateUUID();
console.log("userToken="+userToken);

const WS_URL = location.origin + "/ws?token="+userToken;
const STOMP_DEST = '/app/sendToAdmin';
const TOKEN = token;

let stompClient = null;
let selectFiles =[];
// 分片大小 (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024;


window.addEventListener('load', async () => {
    try {
        await connectWebSocket();
        console.log("Initial connection completed.");
    } catch (e) {
        console.warn("Initial connection failed. Retrying in 5 seconds...");
        showToast("初始连接失败，将在 5 秒后重试...");
        setTimeout(() => connectWebSocket(), 5000);
    }
});

setInterval(() => {
    if (!stompClient || !stompClient.connected) {
        console.warn("Disconnection detected, attempting to reconnect...");
        showToast("检测到断开，尝试重连...");
        connectWebSocket();
    }
}, 10000); // 每 10 秒检查一次

// ======= 工具函数 =======
// 计算 hash (文件名 + 时间)
async function generateHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const spark = new SparkMD5.ArrayBuffer();
        const chunkSize = 1024 * 1024; // 1MB
        const startBlob = file.slice(0, chunkSize);
        const endBlob = file.size > chunkSize ? file.slice(file.size - chunkSize, file.size) : null;

        let buffers = [];

        reader.onload = e => {
            buffers.push(e.target.result);

            if (endBlob && buffers.length === 1) {
                // 读取结尾
                reader.readAsArrayBuffer(endBlob);
            } else {
                // 计算 hash
                buffers.forEach(buf => spark.append(buf));

                const quickHash = spark.end();
                resolve(quickHash);
            }
        };

        reader.onerror = () => reject('读取文件失败');
        reader.readAsArrayBuffer(startBlob);
    });
}


// 封装 WebSocket 连接，返回 Promise
function connectWebSocket() {
    return new Promise((resolve, reject) => {
        const socket = new SockJS(WS_URL);
        stompClient = Stomp.over(socket);

        stompClient.connect({}, frame => {
            console.log('WebSocket connection successful:', frame);
            resolve(stompClient);  // 连接成功返回 stompClient
        }, error => {
            console.error('WebSocket connection failed :', error);
            reject(error); // 连接失败
        });
    });
}


async function ensureWebSocketConnected() {
    if (!stompClient || !stompClient.connected) {
        console.warn("WebSocket is not connected, reconnecting...");
        await connectWebSocket();
    }
}

// 发送消息
function sendMessage(destination, payload) {
    if (!stompClient || !stompClient.connected) {
        console.error("WebSocket is not yet connected.");
        return;
    }
    stompClient.send(destination, {}, JSON.stringify(payload));
}

// 订阅消息

function subscribeOnce(destination) {
    return new Promise((resolve, reject) => {
        if (!stompClient || !stompClient.connected) {
            reject("WebSocket is not yet connected.");
            return;
        }

        const subscription = stompClient.subscribe(destination, message => {
            subscription.unsubscribe();  // 只监听一次
            try {
                resolve(JSON.parse(message.body));
            } catch (e) {
                resolve(message.body);  // 直接返回字符串
            }
        });
    });
}

// ======= 上传  ==================================================================

//上传前检查
async function getMissingChunks(file,hash, maxChunk) {


     const formData = new FormData();
        formData.append('hash', hash);
        formData.append('max_chunk', maxChunk);
        formData.append('final_name', file.name);
        formData.append('type', file.type);
        formData.append('size', file.size);
        formData.append('username', getUsername());
        formData.append('token', TOKEN);


        try {
            const res = await fetch(`http://${serverIp}:${serverPort}/share/upload/checkHash`, {
                method: 'POST',
                body: formData
            });
    const result = await res.json();

    if (!result.missing  || result.missing.length === 0) return null;

    return result.missing;

}catch (e){
console.error(e);
}

}

//上传单个分块
async function uploadChunk(file, hash, chunkIndex, maxChunk, permitCode, progressElement) {

    console.log("Attempting to upload the chunk."+chunkIndex);
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const blob = file.slice(start, end);

    const formData = new FormData();
    formData.append('hash', hash);
    formData.append('max_chunk', maxChunk);
    formData.append('chunk_num', chunkIndex);
    formData.append('permitCode', permitCode);
    formData.append('file', blob);

    try {
        const res = await fetch(`http://${serverIp}:${serverPort}/share/upload`, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        console.log(result.status);

        // 更新进度条
        if(result.status === 'Uploaded'){
        console.log("This chunk has been uploaded successfully.");
        progressElement.value = Math.min(progressElement.value + (end - start), file.size);
        }
        if(result.status === 'denied'){
        showToast("此文件上传已被中断");
        console.error("This file upload has been interrupted.");
        return;
        }


    } catch (err) {
        console.error(` Chunk ${chunkIndex} Upload failed.:`, err);

    }
}


//调用确认端口
async function checkAfterUpload(hash, maxChunk, finalName, type, size, permitCode) {



    const params = new URLSearchParams({
        hash,
        max_chunk: maxChunk,
        final_name: finalName,
        permitCode,
        token: TOKEN
    });

    const res = await fetch(`http://${serverIp}:${serverPort}/share/upload/checkChunk?${params.toString()}`);
    const result = await res.json();

    if (result.missing === null || result.missing.length === 0) {
        return [];
    } else {
        console.warn('checkChunk found missing chunks:', result.missing);
        return result.missing;
    }
}


//UPLOAD

const CONCURRENCY = 4;

async function uploadFile(file, permitCode, progressElement) {
    const hash = await generateHash(file); // 自定义 hash 函数
    const maxChunk = Math.ceil(file.size / CHUNK_SIZE);

    progressElement.max = file.size;
    progressElement.value = 0;

    let missingChunks = await getMissingChunks(file, hash, maxChunk); // 首次检查



    if (missingChunks === null || missingChunks.length === 0) {
            // 表示从未上传过，上传所有分块
            missingChunks = Array.from({ length: maxChunk }, (_, i) => i);
        }else{
                     progressElement.value=file.size-missingChunks.length*CHUNK_SIZE;
                 }

    // 循环上传 + 检查
    while (missingChunks.length > 0) {


        // 分批并发上传
        while (missingChunks.length > 0) {
            const batch = missingChunks.splice(0, CONCURRENCY);
            await Promise.all(batch.map(chunkIndex => uploadChunk(file, hash, chunkIndex, maxChunk, permitCode, progressElement)));
        }

        // 上传后再次确认
        missingChunks = await checkAfterUpload(hash, maxChunk, file.name, file.type, file.size, permitCode);
    }
    document.getElementById("upload").dataset.mode='uploaded';
    document.getElementById("upload").textContent='再次上传';

    console.log('File uploaded and verified successfully:', file.name);
}



function resetUploadUI() {
    const container = document.getElementById('statusContainer');
    container.innerHTML = "<p id='statusText'>上传完成</p >";



    // 清空文件选择
    selectFiles = [];
    console.log("The file list has been cleared.");
}

async function uploadAllFiles(hashPermit) {
    setStatusText("上传中...");
    //document.getElementById('statusText').remove();  // 删除原有状态文本

    // 创建进度条并开始上传
    for (let i = 0; i < selectFiles.length; i++) {
        const file = selectFiles[i];
        const hash = await generateHash(file);
        const permitCode=hashPermit[hash];
        if(!permitCode){
            console.error("permitCode not found");
            continue;
        }
        const progress = createFileUploadEntry(file, permitCode);

        await uploadFile(file, permitCode, progress);
    }

    // 全部文件上传完成
    resetUploadUI();
}


// ====== 更新表格函数 ======
const filesTableBody = document.getElementById("fileInfo");
function renderFileTable() {
    // 清空 tbody（不影响 thead）
    while (filesTableBody.firstChild) {
        filesTableBody.removeChild(filesTableBody.firstChild);
    }

    // 遍历文件数组，逐行插入
    selectFiles.forEach((file, index) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = file.name;

        const typeCell = document.createElement("td");
        typeCell.textContent = file.type || "未知类型";

        const sizeCell = document.createElement("td");
        sizeCell.textContent = formatBytes(file.size);

        const actionCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "删除";
        deleteBtn.addEventListener("click", () => {
            selectFiles.splice(index, 1);
            renderFileTable();
        });
        actionCell.appendChild(deleteBtn);

        row.appendChild(nameCell);
        row.appendChild(typeCell);
        row.appendChild(sizeCell);
        row.appendChild(actionCell);

        filesTableBody.appendChild(row);
    });
}
// ====== 更新表格函数 ======

const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", () => {
    // 把新选择的文件添加到数组
    for (const file of fileInput.files) {
        selectFiles.push(file);
        console.log(file.name);
    }

    // 清空 input（允许再次选择相同文件）
    fileInput.value = "";

    // 更新文件列表显示
    renderFileTable();
    console.log("update");
});



// ======= button主逻辑 =======
document.getElementById("upload").addEventListener('click', async () => {

    const mode=document.getElementById("upload").dataset.mode;
    if(mode==='upload'){
    if (selectFiles.length === 0) {
        showToast("请先选择文件！");
        return;
    }
    console.log("Files to be uploaded:", selectFiles);
    setStatusText("申请中...");
    document.getElementById("upload").dataset.mode='application';
    document.getElementById("upload").textContent='申请中';



    const ip = await getMyIp();
    const webFileMetas = await Promise.all(
    Array.from(selectFiles).map(async (file) => ({
        name: file.name,
        hash: await generateHash(file),
        type: file.type,
        size: file.size
    }))
);

    const webRequest = {
        ip: ip,
        sender:"",
        user:getUsername(),
        num: selectFiles.length,
        time: new Date().toLocaleString(),
        token: token,
        link_desc:  "",
        webFileMetas: webFileMetas
    };
    await ensureWebSocketConnected();  // 等待连接成功


    //send webRequest
     try {
        console.log("Starting to send WebSocket upload request.",webRequest);
        sendMessage(STOMP_DEST, webRequest);

    } catch (error) {
        console.error("failed to send", error);
    }

    // 3. 等待服务器返回消息

    console.log("Waiting to receive the response:");
    const hashPermit = await subscribeOnce("/user/queue/ack");
    console.log("Response received:", hashPermit);

    if (!hashPermit || Object.keys(hashPermit).length === 0) {
        showToast("对方已拒绝: " + JSON.stringify(hashPermit));
        setStatusText("对方已拒绝");
        clearPage();
        document.getElementById("upload").dataset.mode='uploaded';
        document.getElementById("upload").textContent='再次上传';
        return;
    }

    setStatusText("上传中");
    document.getElementById("statusText").remove();
    document.getElementById("upload").dataset.mode='uploading';
    document.getElementById("upload").textContent='上传中';



    await uploadAllFiles(hashPermit);

    }
    if(mode === 'uploaded'){
    clearPage();
    document.getElementById("upload").dataset.mode='upload';
    document.getElementById("upload").textContent='确认上传';

    }
  });

function clearPage() {
    // 清空提示信息
    document.getElementById("desc").textContent = "";

    // 清空用户名输入框
    //document.getElementById("usernameInput").value = "";

    // 清空过期时间显示
    document.getElementById("expire_time").textContent = "";

    // 状态文本设为默认
    document.getElementById("statusText").textContent = "无操作";

    // 清空文件输入框
    document.getElementById("fileInput").value = "";

    // 清空文件表格内容
    const fileInfo = document.getElementById("fileInfo");
    while (fileInfo.firstChild) {
        fileInfo.removeChild(fileInfo.firstChild);
    }
    selectFiles =[];
}