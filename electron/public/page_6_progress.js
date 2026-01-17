
const progressPanel = document.getElementById("progressPanel"); 
const progressList = document.getElementById("progress-list"); 
const clearAllBtn = progressPanel.querySelector(".clear-all-btn");

let progressOffset = 0; 

let loading_6 = false; 
let allLoaded_6 = false;

const SLIDEBTN_2 = document.getElementById('slideBtn_2');
SLIDEBTN_2.addEventListener('click',()=>{
   console.log("page6 click");
    const mode_2 = SLIDEBTN_2.dataset.mode;//view   back
    if(mode_2 ===  "view_2"){
    progressList.innerHTML = ""; 
    progressOffset = 0;
    allLoaded_6 = false;
    console.log("view——2");
    loadProgressRecords();
    showProgressCard(); 
    
    SLIDEBTN_2.textContent="返回";
    SLIDEBTN_2.dataset.mode = 'back_2';
    }else{
      SLIDEBTN_2.textContent="打开侧栏";
      SLIDEBTN_2.dataset.mode = 'view_2';
      hidProgressCard();
    }
  
});




// progress-panel.js


// 加载进度数据 
async function loadProgressRecords() { 
   if (loading_6 || allLoaded_6) return; 
   loading_6 = true; 
   try {
      console.log("Accessing information of files that have not finished uploading.");
      const res = await fetch(`http://localhost:${port}/admin/Link/uncompletedFiles?offset=${progressOffset}`); 
      const records = await res.json();
      console.log("收到了条未完成记录"+records.length);

      if (!records || records.length === 0) {
      allLoaded_6 = true;
      return;
      }

      records.forEach(renderProgressItem);
      progressOffset += records.length;

      } catch (e) { 
         console.error("Loading files that have not finished uploading.:", e); 
      } finally { 
         loading_6 = false; 
      } 
}

// 渲染单条记录 
function renderProgressItem(record) {
   console.log("file name:"+record.linkFile.filename);
   const chunk = record.chunk; 
   const uploaded_num = chunk.uploaded_chunks.split(',').length;
   const file = record.linkFile; 
   const percent = parseInt(uploaded_num) / chunk.max_chunk;
   console.log("percent :"+percent+"uploaded_num="+uploaded_num+"max_chunk="+chunk.max_chunk);

   const item = document.createElement("div"); item.className = "progress-item";

   
   item.innerHTML = `
  <div class="progress-info">
    <div class="file-name">文件名：${file.filename}</div>
    <div class="file-meta">大小：${formatBytes(file.filesize)} &nbsp;&nbsp; 上传者：${file.user || '未知'}</div>
  </div>
  
  <div class="upload-progress">
    <div class="progress-circle" data-progress="${(percent * 100).toFixed(0)}">
      <svg viewBox="0 0 36 36">
        <path class="bg" d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path class="fg" stroke-dasharray="${(percent * 100).toFixed(0)}, 100" d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831" />
        <text x="18" y="20.35" class="progress-text">${(percent * 100).toFixed(0)}%</text>
      </svg>
    </div>
  </div>

  <button class="clear-btn" data-id="${record.id}">清除</button>
`;
   const clearBtn = item.querySelector(".clear-btn"); 
      clearBtn.addEventListener("click", async () => { 
      try { 
         console.log("Attempting to delete the incomplete upload progress.");
         await fetch(`http://localhost:${port}/admin/Link/deleteSingleUnCompleted?token=${file.token}&filehash=${file.filehash}`); 
         item.remove(); 
       } catch (err) {
          showToast("删除失败");
          console.error("Deletion failed.：", err); 
       } 
});

progressList.appendChild(item); 
}

// 清除所有 
clearAllBtn.addEventListener("click", async () => {
   try { await fetch(`http://localhost:${port}/admin/Link/deleteAllUnCompleted`); 
        progressList.innerHTML = ""; 
        progressOffset = 0; 
        allLoaded_6 = false; 
       } catch (e) { 
          console.error("Failed to clear all incomplete progress.：", e); 
       } 
});

// 监听滚动加载 
progressList.addEventListener("scroll", () => { 
   const { scrollTop, scrollHeight, clientHeight } = progressList; 
   if (scrollTop + clientHeight >= scrollHeight - 10) { 
      loadProgressRecords(); 
   } 
});

//文件大小格式化 
function formatFileSize(size) { 
   if (size > 1024 * 1024) 
      return (size / (1024 * 1024)).toFixed(1) + "MB"; 
   if (size > 1024) 
      return (size / 1024).toFixed(1) + "KB"; 
   return size + "B"; 
}

// 初始化调用（你可以在打开面板时调用这个） 
function showProgressPanel() { 
   //progressPanel.classList.remove("hidden"); 
   if (progressOffset === 0) { 
      loadProgressRecords();
   } 
}










