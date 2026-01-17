// 解析 URL 参数
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}


const serverIp = getQueryParam("server").replace(/^"|"$/g, ''); // 去掉开头和结尾的双引号
const token = getQueryParam("token");
const serverPort = getQueryParam("port");


let currentFiles = [];  // 保存当前文件列表


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
// 页面加载时执行
window.addEventListener("load", () => {
    if (!token) {
        document.getElementById("desc").textContent = "缺少 token 参数，无法加载数据。";
        return;
    }
    loadViewLink(token);

    // 绑定“全部下载”按钮
    const allBtn = document.getElementById("download-all-btn");
    allBtn.addEventListener("click", downloadAllFiles);
});

/**
 * 请求后端接口获取 ViewLink 信息
 * @param {string} token
 */
function loadViewLink(token) {
    fetch(`http://${serverIp}:${serverPort}/share/LinkAndFiles?token=${encodeURIComponent(token)}`)
        .then(res => res.json())
        .then(data => {
            if (data) {
                renderPage(data);
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
function renderPage(viewLink) {
    const link = viewLink.link;
    currentFiles = viewLink.linkFiles || [];

    // 设置提示信息
    document.getElementById("desc").textContent = link.link_desc;
    console.log(link.link_desc);

    // 设置过期时间
    const expireEl = document.getElementById("time-display")
    if (link && link.expire_time) {
        expireEl.textContent = formatToSimpleDateTime(link.expire_time);
    } else {
        expireEl.textContent = "无";
    }

    // 渲染文件列表
    const tbody = document.querySelector("table tbody");
    tbody.innerHTML = "";

    currentFiles.forEach(file => {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.textContent = file.filename;

        const typeTd = document.createElement("td");
        typeTd.textContent = file.type || "未知";

        const sizeTd = document.createElement("td");
        sizeTd.textContent = file.filesize ? formatFileSize(file.filesize) : "未知";

        const actionTd = document.createElement("td");
        const btn = document.createElement("button");
        btn.className = "download-btn";
        btn.textContent = "下载";
        btn.addEventListener("click", () => {
            downloadFile(token, file.filename, file.filehash, getUsername() || "guest");
        });


        const previewBtn = document.createElement("button");
        previewBtn.className = "download-btn";
        previewBtn.style.backgroundColor = "#27ae60"; // 绿色
        previewBtn.textContent = "预览";

        previewBtn.addEventListener("click", () => {
            previewFile(token, file.filename, file.filehash);
        });

        actionTd.appendChild(previewBtn);
        actionTd.appendChild(btn);

        tr.appendChild(nameTd);
        tr.appendChild(typeTd);
        tr.appendChild(sizeTd);
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    });
}

/**
 * 文件大小格式化
 * @param {number} size
 */
function formatFileSize(size) {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB";
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + " MB";
    return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

/**
 * 下载单个文件
 * @param {string} token
 * @param {string} filename
 * @param {string} filehash
 * @param {string} username
 */
function getUsername() {
  const input = document.getElementById("usernameInput");
  const val = input.value.trim();
  return val !== "" ? val : input.placeholder;
}
function downloadFile(token, filename, filehash, username) {
    const url = `http://${serverIp}:${serverPort}/share/download?token=${encodeURIComponent(token)}`+
               `&filename=${encodeURIComponent(filename)}`+
               `&filehash=${encodeURIComponent(filehash)}`+
               `&username=${encodeURIComponent(getUsername())}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function previewFile(token, filename, filehash) {
    const url =
        `http://${serverIp}:${serverPort}/share/preview`
        + `?token=${encodeURIComponent(token)}`
        + `&filename=${encodeURIComponent(filename)}`
        + `&filehash=${encodeURIComponent(filehash)}`;

    // 打开新窗口预览
    window.open(url, "_blank");
}
/**
 * 批量下载所有文件
 */
function downloadAllFiles() {
    if (!currentFiles || currentFiles.length === 0) {
        alert("没有可下载的文件");
        return;
    }

    currentFiles.forEach((file, index) => {
        setTimeout(() => {
            downloadFile(token, file.filename, file.filehash, getUsername() || "guest");
        }, index * 800); // 间隔800ms避免浏览器阻止
    });
}