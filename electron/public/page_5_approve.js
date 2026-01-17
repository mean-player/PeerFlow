  const SLIDEBTN = document.getElementById('slideBtn');

  const auditPanel = document.getElementById("auditPanel");
  const auditRecords = auditPanel.querySelector(".audit-records");
  const radios = auditPanel.querySelectorAll("input[name='auditFilter']");
  const deleteAllAuditBtn = document.getElementById('clear-all-audit');
  
  let offset = 0;
  const pageSize = 10;
  let isLoading = false;
  let allLoaded = false;
  let currentFilter = "approve"; // 默认筛选


SLIDEBTN.addEventListener('click',()=>{
    console.log("page5 click");
    const mode = SLIDEBTN.dataset.mode;//view   back
  
    if(mode ===  "view"){
    
    offset = 0;
    allLoaded = false;
    auditRecords.innerHTML = ""; // 清空现有记录
      
    loadRecords();
    showAuditCard();
    SLIDEBTN.textContent="返回";
    SLIDEBTN.dataset.mode = 'back';
      
    }else{
      SLIDEBTN.textContent="打开侧栏";
      SLIDEBTN.dataset.mode = 'view';
      hidAuditCard(); 
    }
});
  
  
  // 转换 approve_result 为中文文本和样式
  function translateResult(result) {
    switch (result) {
      case "approve": return { text: "同意", className: "status-pass" };
      case "reject": return { text: "否决", className: "status-reject" };
      case "none": return { text: "未决定", className: "status-pending" };
      default: return { text: "未知", className: "" };
    }
  }

  function createRecord(item) {
    const { text, className } = translateResult(item.approve_result);

    const div = document.createElement("div");
    div.className = "audit-record";
    div.innerHTML = `
      <div class="record-row"><strong>文件信息:</strong> ${item.fileInfo}</div>
      <div class="record-row"><strong>申请时间:</strong> ${item.time}</div>
      <div class="record-row"><strong>申请人:</strong> ${item.sender}</div>
      <div class="record-row"><strong>审核结果:</strong> <span class="${className}">${text}</span></div>
    `;
    return div;
  }

  
  async function loadRecords() {
    if (isLoading || allLoaded) return;
      console.log("Viewed approve");
    isLoading = true;

    try {
      const response = await fetch(`http://localhost:${port}/admin/Link/Approves?offset=${offset}&approveResult=${currentFilter}`);
      const data = await response.json();
    
      
     

      if ( data.length < pageSize) {
        allLoaded = true;
      }

      data.forEach(item => auditRecords.appendChild(createRecord(item)));

      offset += data.length;
    } catch (err) {
      showToast("加载失败");
      console.error("Loading failed:", err);
    } finally {
      isLoading = false;
    }
  }

  // 滚动监听
  auditRecords.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = auditRecords;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
        console.log("close to the bottom");
      loadRecords();
    }
  });

  // 筛选变更监听
  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      currentFilter = radio.value;
      offset = 0;
      allLoaded = false;
      auditRecords.innerHTML = ""; // 清空现有记录
      loadRecords();
      const btnText = currentFilter === "approve" ? "同意" : currentFilter === "reject" ? "否决" : "未决定";
      deleteAllAuditBtn.textContent=`清除${btnText}审核记录`;
    });
  });
  
  
  async function deleteApprove(approveResult) {
  if (!approveResult) {
    showToast("请提供审核结果关键字！");
    return;
  }

  try {
    const response = await fetch(`http://localhost:${port}/admin/Link/deleteApprove?approve_result=${encodeURIComponent(approveResult)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json(); // 因为你的后端返回 boolean
    if (result === true) {
      auditRecords.innerHTML = "";
      showToast("删除成功！");
    } else {
      showToast("删除失败！");
    }
  } catch (error) {
    console.error("Request abnormal：", error);
    showToast("请求失败，请稍后重试！");
  }
}
  
  deleteAllAuditBtn.addEventListener("click",()=>{
    deleteApprove(currentFilter);
    
    loadRecords();
    
  });

  