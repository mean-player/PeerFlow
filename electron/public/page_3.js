// link_create.js





// 密码开关控制
const setPassword = document.getElementById("setPassword");
const passwordInput_2 = document.getElementById("password_1");
setPassword.addEventListener("change", () => {
    if (setPassword.value === "no") {
        passwordInput_2.disabled = true;
        passwordInput_2.value = "";
    } else {
        passwordInput_2.disabled = false;
    }
});


document.addEventListener("DOMContentLoaded", function () {

       
        const fileInput = document.getElementById("selectFileBtn");
        const fileTableBody = document.getElementById("fileTableBody");
        const submitBtn = document.getElementById("submitBtn");

        const Result = document.getElementById("resultSection");
        const ResultText = document.getElementById('resultText');
        const ResultImg = document.getElementById('result-image');

        const baclBtn = document.getElementById('back');
        fileTableBody.innerHTML = "";


// 监听文件选择，更新表格
const selectedFiles = [];

fileInput.addEventListener("click", async () => {

    const fileInfo = await window.myAPI.selectFileAndInfo();
    if(!fileInfo){
        showToast('获取文件信息失败');
        return;
    }




    if (selectedFiles.includes(fileInfo)) {
        showToast('文件重复选择!');
        return; // 避免重复
    }

    selectedFiles.push(fileInfo);

    const sizeStr = formatFileSize(fileInfo.size);
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${fileInfo.name}</td>
        <td>${fileInfo.type || "未知"}</td>
        <td>${sizeStr}</td>
        <td>${fileInfo.path}</td>
        <td><button class="remove-btn">取消</button></td>
    `;

    fileTableBody.appendChild(row);

    // 绑定删除事件
    row.querySelector(".remove-btn").addEventListener("click", () => {
        fileTableBody.removeChild(row);
        const index = selectedFiles.indexOf(fileInfo);
        if (index !== -1) {
            selectedFiles.splice(index, 1);
        }
    });



});








function formatFileSize(bytes) {
    if (bytes >= 1024 * 1024 * 1024) {
        return (bytes / (1024 ** 3)).toFixed(2) + ' GB';
    } else if (bytes >= 1024 * 1024) {
        return (bytes / (1024 ** 2)).toFixed(2) + ' MB';
    } else {
        return (bytes / 1024).toFixed(2) + ' KB';
    }
}


//copy btn
document.getElementById("copyResult3").addEventListener("click", () => {
  const resultText = document.getElementById("resultText").innerText;

  if (resultText) {
    navigator.clipboard.writeText(resultText)
      .then(() => {
        showToast("链接已复制！");
      })
      .catch((err) => {
        console.error("Copy failed:", err);
        showToast("复制失败，请手动复制");
      });
  } else {
    showToast("没有可复制的内容！");
  }
});
//back

baclBtn.addEventListener('click',()=>{
    submitBtn.textContent='创建';
    submitBtn.dataset.mode='createLink';
    clearAll();
    showPage('page1');
});

// 提交按钮点击逻辑
        submitBtn.addEventListener("click", async () => {
            const mode = submitBtn.dataset.mode;
            if(mode === 'createLink' || submitBtn.dataset.mode==='retry'){

            const title = document.getElementById("title").value;
            const password = passwordInput_2.value.trim();
            const expire = document.getElementById("expire").value;
           
            const now = new Date();

            if (!title || !expire ) {
                showToast("请填写完整信息");
                return;
            }
            
            if(setPassword.value === "yes" && password === ''){
                showToast("请输入密码");
                return;
            }
                
            if(selectedFiles.length === 0){
                showToast("请先选择文件");
                return;
            }
             if(hasIllegalChars(title)){
                showToast('链接命名不可包含 < > : " / \ | ? *');
                return;
            }

            const link = {
                type: "DLink",
                verify:setPassword.value === "yes" ? 1 : 0,
                create_time: toDatetimeLocalString(new Date(now)),
                link_desc: title,
                password: setPassword.value === "yes" ? password : null,
                expire_time: expire
            };

            const requestFiles = [];
            for (const file of selectedFiles) {
                const hash = await generateFileHashWithTime(file);
                requestFiles.push({
                    filename: file.name,
                    filetype: file.type,
                    filehash: hash,
                    filepath: file.path,
                    filesize: file.size
                });
                console.log("Selected files："+file.name);
            }

            const body = {
                link: link,
                requestFiles: requestFiles
            };

            fetch(`http://localhost:${port}/admin/Link/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })
            .then(res => res.json())
            .then(data => {
                if (data.code === 200 && data.data) {
                    submitBtn.textContent='确认';
                    submitBtn.dataset.mode='back';
                    const selectedFiles = [];
                     showToast("创建成功");
                    const LinkInfo = "http://"+IP+":"+port+"/share/verify/link?token="+data.data;
                    Result.classList.remove('hidden');
                    ResultText.innerHTML=LinkInfo;
                    new QRCode(ResultImg,{
                        text: LinkInfo,
                        width:160,
                        height:160
                    });


                } else {
                    submitBtn.textContent='重试';
                    submitBtn.dataset.mode='retry';
                    showToast("创建失败：" + data.message);
                }
            })
            .catch(err => {
                showToast("网络错误：" + err);
            });
        }else{
            submitBtn.textContent='创建';
            submitBtn.dataset.mode='createLink';
            clearAll();
            showPage('page1');

        }
        });

    });

function clearAll(){

    document.getElementById("resultSection").classList.add('hidden');
    document.getElementById("title").value = "";
    document.getElementById("setPassword").value = "no";
    document.getElementById("password_1").value = "";
    document.getElementById("expire").value = "";


    // 清空文件表格内容
    const tbody = document.getElementById("fileTableBody");
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    // 隐藏结果区域
    document.getElementById("resultText").textContent = "";
    document.getElementById("resultSection").classList.add("hidden");
    document.getElementById("result-image").innerHTML = "";

}

