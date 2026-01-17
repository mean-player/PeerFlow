document.addEventListener("DOMContentLoaded", () => {
    const quickUploadDiv = document.getElementById("quickUploadDiv");
    const quickUploadDesc = document.getElementById("quickUploadDesc");
    const cancelBtn = document.getElementById("cancelQuickUpload");
    const createBtn = document.getElementById("createQuickUpload");
    const QULinkBtn = document.getElementById("QULink");
    const QU_Result = document.getElementById('QUResult');
    const QU_Text=document.getElementById('resultQU');
    const QU_Img = document.getElementById("result-imageQU");
    const QU_Copy=document.getElementById("copyQUResult");

    let defaultQuDesc =  '';
    // 点击“快速上传链接”按钮，显示弹出层
    QULinkBtn.addEventListener("click", () => {
        console.log("click!");
        const now = new Date();
        defaultQuDesc =  `${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        quickUploadDesc.value = defaultQuDesc;
        quickUploadDesc.placeholder = defaultQuDesc;
        
        showQuCard();
    });
    
//placeholder

quickUploadDesc.addEventListener("focus",function(){
                         if(quickUploadDesc.value === defaultQuDesc)
                             {
                                 quickUploadDesc.value="";
                             }
                         });

quickUploadDesc.addEventListener("blur",function(){
   if(quickUploadDesc.value.trim() === ""){
       quickUploadDesc.value = defaultQuDesc;
   } 
});

    
   
    

    // 取消按钮
    cancelBtn.addEventListener("click", () => {
        createBtn.dataset.mode='createQULink';
        createBtn.textContent='创建';
        clearQUPage();
        hidQuCard();
    });

    
    // 创建按钮
 createBtn.addEventListener("click", async () => {
        const now = new Date();
        const Qu_desc = quickUploadDesc.value.trim() || defaultQuDesc;
        const mode = createBtn.dataset.mode;
        if(mode==='createQULink' || mode==='retry'){

        const expire_qu=new Date(Date.now() + 7 * 24 * 3600 * 1000);

        if(hasIllegalChars( Qu_desc)){
        showToast('链接命名中不可包含 < > : " / \ | ? *');
        return;
        }


        const linkCreateRequest = {
            link: {
                type: "QULink",
                link_desc: Qu_desc,
                password: "",
                verify: 0,
                create_time: toDatetimeLocalString(new Date(now)),
                expire_time: toDatetimeLocalString(expire_qu),
            },
            requestFiles: []
        };

        try {
            const res = await fetch(`http://localhost:${port}/admin/Link/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(linkCreateRequest)
            });

            const result = await res.json();
            if (result.code === 200) {

                createBtn.textContent = "确认";
                createBtn.dataset.mode='back';
                QU_Result.classList.remove('hidden');
                const QULinkInfo = "http://"+IP+":"+port+"/share/verify/link?token="+result.data;
                QU_Text.innerHTML=QULinkInfo;
                new QRCode(QU_Img,{
                        text: QULinkInfo,
                        width:160,
                        height:160
                    });
            } else {
                createBtn.dataset.mode='retry';
                createBtn.textContent='重试';

            }
        } catch (e) {
            console.error("Failed to create a quick upload link.", e);

        }
        }else{
            createBtn.dataset.mode='createQULink';
            createBtn.textContent='创建';
           clearQUPage();
            hidQuCard();
        }
    });


// copy
    
  document.getElementById("copyQUResult").addEventListener("click", () => {
  const text = document.getElementById("resultQU").innerText;

  if (text) {
    navigator.clipboard.writeText(text)
      .then(() => showToast("链接已复制！"))
      .catch(err => {
        console.error("Copy failed.:", err);
        showToast("复制失败，请手动复制");
      });
  } else {
    showToast("没有可复制的内容！");
  }
});  
    

});

function clearQUPage(){
     // 清空描述输入框
    document.getElementById('quickUploadDesc').value = '';

    // 隐藏结果区域
    const resultSection = document.getElementById('QUResult');
    resultSection.classList.add('hidden');

    // 清空链接文本和二维码
    document.getElementById('resultQU').innerText = '';
    document.getElementById('result-imageQU').innerHTML = '';
}



