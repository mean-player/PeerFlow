const uploadingList = document.getElementById("uploadingList");

const uploadMap = new Map(); // hash -> { progressEl, statusEl, interruptBtn, fileDiv }

// WebSocket: 监听新增文件
function FileMonitor(file) {
  const hash = file.filehash;
  if (uploadMap.has(hash)) return; // 已存在则跳过

  // 创建 DOM 结构
  const fileDiv = document.createElement("div");
  fileDiv.className = "file-item";
  fileDiv.innerHTML = `
    <div class="title">${file.filename}</div>
    <div class="progress-bar"><div class="progress"></div></div>
    <div class="status">等待上传...</div>
    <button class="interrupt-btn">终止</button>
  `;

  const progressEl   = fileDiv.querySelector(".progress");
  const statusEl     = fileDiv.querySelector(".status");
  const interruptBtn = fileDiv.querySelector(".interrupt-btn");

  // 终止按钮事件：禁用按钮 & 改状态
  interruptBtn.addEventListener("click", async () => {
    // 1. 立即禁用按钮并更新状态
    interruptBtn.disabled = true;
    interruptBtn.textContent = "已终止";
    statusEl.textContent = "已终止";
    

    // 2. 告知后端终止
    await fetch(`http://localhost:${port}/admin/Link/interrupt?filehash=${encodeURIComponent(hash)}`);
    fileDiv.remove();
    uploadMap.delete(hash);
  });

  // 插入到列表并缓存引用
  uploadingList.insertBefore(fileDiv,uploadingList.firstChild);
  uploadMap.set(hash, { progressEl, statusEl, interruptBtn, fileDiv });
}

// WebSocket: 监听进度更新
function ProgressMonitor(progress) {
  const { hash, uploaded_num, total_num } = progress;
  const item = uploadMap.get(hash);
  if (!item) return;

  const percent = Math.floor((uploaded_num / total_num) * 100);
  item.progressEl.style.width = percent + "%";

  // 如果已经被用户终止，就不再更新进度
  if (item.interruptBtn.disabled && item.statusEl.textContent === "已终止") {
    return;
  }

  // 更新状态文字
  if (uploaded_num >= total_num) {
    item.statusEl.textContent = "上传完成";

    // 上传完成后移除“终止”按钮
    item.interruptBtn.remove();
  } else {
    item.statusEl.textContent = `上传中：${percent} %`;
  }
}