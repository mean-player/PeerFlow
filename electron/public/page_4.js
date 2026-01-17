// page4-create-link.js
window.addEventListener("DOMContentLoaded", () => {
  const submitBtn_2 = document.getElementById("submitBtn_2");
  const setPwdSelect = document.getElementById("setPwd");
  const passwordInput_2 = document.getElementById("passwordInput_2");
  const Result_2 = document.getElementById("result4");
  const ResultText_2 = document.getElementById('resultText4');
  const ResultImg_2 = document.getElementById('result-image4');
  const backBtn_2 = document.getElementById('back_2');
  // 设置密码选项控制密码输入框是否可用
  setPwdSelect.addEventListener("change", () => {
    if (setPwdSelect.value === "no") {
      passwordInput_2.disabled = true;
      passwordInput_2.value = "";
    } else {
      passwordInput_2.disabled = false;
    }
  });

  

backBtn_2.addEventListener('click',()=>{
    submitBtn_2.textContent='创建';
    submitBtn_2.dataset.mode='createLink';
    clearPage_4();
    showPage('page1');
});
  
  document.getElementById("copyResult4").addEventListener("click", () => {
  const resultText = document.getElementById("resultText4").innerText;

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
  
  // 创建按钮事件
  submitBtn_2.addEventListener("click", () => {
    const mode = submitBtn_2.dataset.mode;
    if(mode === 'createLink' || submitBtn.dataset.mode==='retry'){
      
    const name = document.getElementById("nameInput").value.trim();
    const password = passwordInput_2.value.trim();
    const expireTime = document.getElementById("expireInput").value;
    const setPassword = setPwdSelect.value;
    const now = new Date();
      
    if(!name || !expireTime){
      showToast('请填写完整信息');
      return;
    }
    if(setPwdSelect.value === 'yes' && passwordInput_2.value.trim() === ''){
      showToast('请输入密码');
      return;
    }
    if(hasIllegalChars(name)){
        showToast('链接命名中不可包含 < > : " / \ | ? *');
        return;
    }

    // 构造 Link 对象
    const link = {
      link_desc: name,
      type: "ULink",
      verify: setPwdSelect.value === "yes" ? 1 : 0,
      create_time: toDatetimeLocalString(new Date(now)),
      expire_time: expireTime,
      status: 1,
      password: setPassword === "yes" ? password : null,
      used: 0
    };

    const payload = {
      link: link,
      requestFiles: []
    };

    fetch(`http://localhost:${port}/admin/Link/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 200 && data.data) {
          console.log(data.data);
          submitBtn_2.textContent='确认';
          submitBtn_2.dataset.mode='back';
          const LinkInfo = "http://"+IP+":"+port+"/share/verify/link?token="+data.data;
          Result_2.classList.remove('hidden');
          ResultText_2.innerHTML=LinkInfo;
          new QRCode(ResultImg_2,{
              text: LinkInfo,
              width:160,
              height:160
          });
          
          
          //showResult(data.data);
        } else {
          submitBtn_2.textContent='重试';
          submitBtn_2.dataset.mode='retry';
          showToast("创建失败: " + data.message);
        }
      })
      .catch(err => {
        console.error("Request abnormal", err);
        showToast("网络错误，创建失败");
      });
    }else{
      clearPage_4();
      submitBtn_2.textContent='创建';
      submitBtn_2.dataset.mode='createLink';
      showPage('page1');
    }
  });
});

function  clearPage_4(){
  // 清空输入框
    document.getElementById('nameInput').value = '';
    document.getElementById('setPwd').value = 'no';
    document.getElementById('passwordInput_2').value = '';
    document.getElementById('expireInput').value = '';

    // 隐藏结果区域
    const resultSection = document.getElementById('result4');
    resultSection.classList.add('hidden');

    // 清空链接文本和二维码
    document.getElementById('resultText4').innerText = '';
    const qrContainer = document.getElementById('result-image4');
    qrContainer.innerHTML = '';
}

