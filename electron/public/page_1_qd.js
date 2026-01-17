const QD_PANEL = document.getElementById('quickDownloadPanel');
const QD_LINK_BTN = document.getElementById('QDLink');
const QD_DESC = document.getElementById('qdDesc');
const QD_FILE_INPUT = document.getElementById('selectQdFileBtn');
const QD_FILE_LIST = document.getElementById('qdFileList');
const QD_ACTION_BTN = document.getElementById('qdActionBtn');
const QD_CANCEL = document.getElementById('qdCancel');
const QD_RESULT = document.getElementById('qdResult');
const QD_TEXT = document.getElementById('resultQd');
const QD_IMG = document.getElementById("result-imageQd");


document.getElementById("copyQdResult").addEventListener("click", () => {
  const text = document.getElementById("resultQd").innerText;

  if (text) {
    navigator.clipboard.writeText(text)
      .then(() => showToast("链接已复制！"))
      .catch(err => {
        console.error("Copy failed:", err);
        showToast("复制失败，请手动复制");
      });
  } else {
    showToast("没有可复制的内容！");
  }
});

function toDatetimeLocalString(date) {
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}



let selectedQDFiles = [];

let defaultDesc = '';


// 点击快速下载链接按钮，打开右侧面板
QD_LINK_BTN.addEventListener('click', () => {
    const now = new Date();
    defaultDesc = `这是 ${now.getMonth() + 1}月${now.getDate()}日${now.getHours()}时 的快速下载链接`;

    QD_DESC.value = defaultDesc;
    QD_DESC.placeholder = defaultDesc;

    selectedQDFiles = [];
    renderQDFileList();


    showQdCard();
});

//返回
QD_CANCEL.addEventListener('click',()=>{
    QD_ACTION_BTN.dataset.mode = 'createQDLink';
    QD_ACTION_BTN.textContent='创建';
    clearQDPage();
    hidQdCard();
});
//placeholder
QD_DESC.addEventListener("focus",function(){
                         if(QD_DESC.value === defaultDesc)
                             {
                                 QD_DESC.value="";
                             }
                         });

QD_DESC.addEventListener("blur",function(){
   if(QD_DESC.value.trim() === ""){
       QD_DESC.value = defaultDesc;
   }
});

// 选择文件
QD_FILE_INPUT.addEventListener("click", async() => {
    // 把新选择的文件添加到数组
    const fileInfo = await window.myAPI.selectFileAndInfo();
    selectedQDFiles.push(fileInfo);
    console.log(fileInfo.name);




    // 更新文件列表显示
    renderQDFileList();
    console.log("update");
});


// 渲染文件列表
function renderQDFileList() {
    QD_FILE_LIST.innerHTML = '';
    selectedQDFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'qd-file-item';
        div.innerHTML = `
            <span>${file.name} (${file.type || 'unknown'}, ${file.size} bytes)</span>
            <button data-index="${index}">取消</button>
        `;
        QD_FILE_LIST.appendChild(div);
    });

    // 绑定取消按钮
    QD_FILE_LIST.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', e => {
            const idx = e.target.dataset.index;
            selectedQDFiles.splice(idx, 1);
            renderQDFileList();
        });
    });
}





// 点击创建/返回
QD_ACTION_BTN.addEventListener('click', async () => {
    const now = new Date();
    const mode = QD_ACTION_BTN.dataset.mode;
    if (mode === 'retry' || mode ==='createQDLink') {



    if (selectedQDFiles.length === 0) {
        showToast('请先选择文件！');
        return;
    }


    const desc = QD_DESC.value.trim() || defaultDesc;
    if(hasIllegalChars(desc)){
        showToast('The link description should not contain < > : " / \ | ? *');
        return;
    }
    const expire=new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const link = {
        type: "QDLink",
        verify: 0,
        password: '',
        create_time: toDatetimeLocalString(new Date(now)),
        expire_time: toDatetimeLocalString(expire),
        link_desc: desc
    };

    // 构造 requestFiles
    const requestFiles = [];
    for (const file of selectedQDFiles) {
        const hash = await generateFileHashWithTime(file);
        requestFiles.push({
        filename: file.name,
        filetype: file.type,
        filehash: hash,
        filepath: file.path,
        filesize: file.size
        });
    }

    const payload = {
        link: link,
        requestFiles: requestFiles
    };

    try {
        const response = await fetch(`http://localhost:${port}/admin/Link/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.code === 200) {

            QD_RESULT.classList.remove("hidden");
            const QDLinkInfo = "http://"+IP+":"+port+"/share/verify/link?token="+data.data;
            QD_TEXT.innerHTML = QDLinkInfo;
            new QRCode(QD_IMG,{
                        text: QDLinkInfo,
                        width:160,
                        height:160
                    });
            QD_ACTION_BTN.dataset.mode = 'back';
            QD_ACTION_BTN.textContent='确认';




        } else {
            QD_ACTION_BTN.dataset.mode = 'retry';
            QD_ACTION_BTN.textContent='重试';
        }
    } catch (e) {
        console.error('Creation failed', e);

    }
    }else{
    QD_ACTION_BTN.dataset.mode = 'createQDLink';
    QD_ACTION_BTN.textContent='创建';
    clearQDPage();
    hidQdCard();
    }


    //copy

});

function clearQDPage(){
     // 清空描述输入框
    const descInput = document.getElementById('qdDesc');
    if (descInput) descInput.value = '';

    // 清空文件列表
    const fileList = document.getElementById('qdFileList');
    if (fileList) fileList.innerHTML = '';

    // 隐藏结果区域
    const resultArea = document.getElementById('qdResult');
    if (resultArea) resultArea.classList.add('hidden');

    // 清空生成链接
    const resultLink = document.getElementById('resultQd');
    if (resultLink) resultLink.textContent = '';

    // 清空二维码图片
    const resultImage = document.getElementById('result-imageQd');
    if (resultImage) resultImage.innerHTML = '';



}