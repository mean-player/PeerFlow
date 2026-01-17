const WS_URL = `http://localhost:${port}/ws?token=admin`;

async function initWebSocket() {
  try {
    await window.myWebSocketAPI.connect(WS_URL);
    console.log('WebSocket connection successful');
  } catch (e) {
    console.error('WebSocket connection failed', e);
  }
}

// 监听消息
window.ipcRenderer.onInfo((data) => {
  console.log('Received from info', data);
  if(PageId  != "page5"){
        addUploadRequestBadge();
    }
  // 处理渲染，比如：
  renderWebRequestCard(data);
});

window.ipcRenderer.onFile((data) => {
  console.log('Received from file ', data);
  if(PageId  != "page6"){
        addUploadingBadge();
        }
  FileMonitor(data);
});

window.ipcRenderer.onProgress((data) => {
  console.log('Received from progress', data);
  ProgressMonitor(data);
});

// 页面加载时初始化连接
window.addEventListener('load', () => {
  initWebSocket();
});







 // 渲染单个 webRequest 卡片
    function renderWebRequestCard(webRequest) {
        const container = document.getElementById('requestContainer');

        const card = document.createElement('div');
        card.className = 'request-card';
        card.style.border = '1px solid #ccc';
        card.style.padding = '10px';
        card.style.marginBottom = '10px';
        card.style.borderRadius = '6px';

        // 基本信息
        card.innerHTML = `
            <p><strong>IP：</strong>${webRequest.ip}</p >
            <p><strong>申请者：</strong>${webRequest.user}</p >
            <p><strong>文件数：</strong>${webRequest.num}</p >
            <p><strong>时间：</strong>${simplifyDate(webRequest.time)}</p >
            <p><strong>所使用链接：</strong>${webRequest.link_desc}</p >
            <h4>文件列表：</h4>
            <ul class="file-list"></ul>
            <div class="buttons">
                <button class="agreeBtn">同意</button>
                <button class="rejectBtn">拒绝</button>
            </div>
            <div class="result"></div>
        `;

        // 文件列表
        const fileListEl = card.querySelector('.file-list');
        webRequest.webFileMetas.forEach(file => {
            const li = document.createElement('li');
            li.textContent = `${file.name} ( type: ${file.type}, size: ${formatBytes(file.size)})`;
            fileListEl.appendChild(li);
        });

        // 按钮事件
        const agreeBtn = card.querySelector('.agreeBtn');
        const rejectBtn = card.querySelector('.rejectBtn');
        const resultEl = card.querySelector('.result');
        const buttonDiv = card.querySelector('.buttons');

        agreeBtn.addEventListener('click', () => {
            sendAck(webRequest, true);
            buttonDiv.style.display = 'none';
            resultEl.textContent = "已同意";
        });

        rejectBtn.addEventListener('click', () => {
            sendAck(webRequest, false);
            buttonDiv.style.display = 'none';
            resultEl.textContent = "已拒绝";
        });

        container.insertBefore(card,container.firstChild);
        //container.appendChild(card);
}

    // 发送 AckInfo
    function sendAck(webRequest, agree) {
      //await ensureWebSocketConnected();
        
        const ackInfo = {
            target: webRequest.sender,
            ack: agree,
            webRequest: webRequest
        };
        window.myWebSocketAPI.sendMessage("/app/sendAck", ackInfo);
    }

