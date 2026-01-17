/***************
 * 统一状态管理
 ***************/
const state = {
  token: "",
  status: "",        // radio 的值："" | "1" | "0"
  type: "",          // 由顶部按钮决定："ULink" | "DLink" | "QULink" | "QDLink"
  sortBy: "create",  // 你自己的排序规则："create"/"expire" 等
  offset: 0,         // 分页偏移
  pageSize: 10,
  isLoading: false,
  hasMore: true,
  editMode: false,   // “修改/确认”按钮的编辑状态
};

// DOM 引用
const linkListEl = document.getElementById("link-list");
const changeBtn = document.getElementById("change");
const verifySel = document.getElementById("verify");
const passwordInput =document.getElementById("password");
const url=document.getElementById('url');
const copyURLBtn=document.getElementById('copyURL');
const qrcode=document.getElementById('qrcode');


const uploadFolderPos = window.configUtils.getUploadPath();
let finalDir="";
const allFileInfo = document.getElementById("numAndSize");
const openDirBtnGroup = document.getElementById('openDirBtnGroup');
const openDirBtn = document.getElementById('openDirBtn');


copyURLBtn.addEventListener("click", () => {
  const text = url.innerText;
  if (text) {
    navigator.clipboard.writeText(text)
      .then(() => showToast("链接已复制！"))
      .catch(() => showToast("复制失败，请手动复制"));
  }
});




//清除所有失效链接按钮
async function cleanInvaluableLinks() {
  try {
    const response = await fetch(`http://localhost:${port}/admin/Link/cleanInvaluable?type=${state.type}`, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误：${response.status}`);
    }

    const result = await response.json();
    resetAndLoad();

    
  } catch (error) {
    showToast("❌ 请求出错，请检查网络或服务状态");
    console.error("Request abnormal：", error);
  }
}

function applyVerifyRule() {
  if (!verifySel) return;
  if (verifySel.value === "0") {
    // 选择“否”：禁用密码并清空
    passwordInput.value = "";
    passwordInput.disabled = true;
  } else {
    // 选择“是”：启用密码
    passwordInput.disabled = false;
  }
}

// ========== 工具方法 ==========
function computeSortBy(statusValue) {
  
  // 例：全部/无效 -> expire， 有效 -> create
  if (statusValue === "1") return "create";
  return "expire";
}

function toInputDatetime(str) {
  if (!str) return "";
  return str.replace(" ", "T").slice(0, 16);
}

function fromInputDatetime(str) {
  // 如果后端需要 "yyyy-MM-dd HH:mm:ss"
  if (!str) return "";
  return str.replace("T", " ") + ":00";
}

// 批量只读/可编辑（只用 readonly，不用 disabled，避免读取值出问题）
function setInputsEditable(editable) {
   // input：用 readonly（不影响读取值）
  document.querySelectorAll(".query-inputs input").forEach(input => {
    input.readOnly = !editable; 
  });
  // select：没有 readonly，只能用 disabled
  if (verifySel) verifySel.disabled = !editable;

  // password 的规则：
  if (editable) {
    // 进入编辑态：根据当前 verify 值决定是否允许改密码
    applyVerifyRule();
  } else {
    // 展示态：统一不可编辑
    if (passwordInput) passwordInput.disabled = true;
  }
}

if (verifySel) {
  verifySel.addEventListener('change', applyVerifyRule);
}
// ========== 列表加载 ==========
function resetAndLoad() {
  state.offset = 0;
  state.hasMore = true;
  linkListEl.innerHTML = "";
  loadLinks();
}

function loadLinks() {
  if (state.isLoading || !state.hasMore) return;
  state.isLoading = true;

  const body = {
    status: state.status === "" ? null : Number(state.status), // 传给后端可为 null/0/1
    type: state.type || null,
    offset: state.offset,
    pageSize: state.pageSize,
    sortBy: state.sortBy,
  };

  fetch(`http://localhost:${port}/admin/Link/viewAll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  .then(res => res.json())
  .then(list => {
    console.log("Received" +list.length+"records");
    if (!Array.isArray(list)) {
      console.warn("Unexpected response:", list);
      return;
    }
    if (list.length === 0) {
      state.hasMore = false;
      return;
    }

    list.forEach(renderLinkItem);

    // ✅ 处理分页：只在这儿+length，别放在 forEach 里
    state.offset += list.length;

    // 如果不到一页，说明没更多
    if (list.length < state.pageSize) {
      state.hasMore = false;
    }
  })
  .catch(err => {
    console.error("Loading failed：", err);
  })
  .finally(() => {
    state.isLoading = false;
  });
}

function renderLinkItem(link) {
  const div = document.createElement("div");
  div.className = "link-item";
  div.innerHTML = `
    <div class="text">
      <span>名称: ${link.link_desc ?? ""}</span>
      <span>创建日期: ${simplifyDate(link.create_time) ?? ""}</span>
      <span>过期日期: ${simplifyDate(link.expire_time) ?? ""}</span>
      <button class="${link.status === 1 ? 'cancel-btn' : 'disabled-btn'}">
      ${link.status === 1 ? '失效' : '已失效'}
      </button>
    </div>
  `;

  // 点击查看详情
  div.addEventListener("click", () => fetchViewLink(link.token));

  // 阻止按钮冒泡并调用 changeStatus
  
  const cancelBtn = div.querySelector(".cancel-btn");
  if(cancelBtn){
  cancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fetch(`http://localhost:${port}/admin/Link/changeStatus?token=${encodeURIComponent(link.token)}&status=0`, {
      method: "POST"
    })
    .then(r => r.json())
    .then(result => {
      console.log("Cancellation successful:", result);
      // 你可以把这条直接从列表移除，或调用 resetAndLoad() 刷新
      resetAndLoad();
      //div.remove();
      
    })
    .catch(err => console.error("Cancellation failed:", err));
  });
  }

  linkListEl.appendChild(div);
}

// ========== 滚动加载 ==========
linkListEl.addEventListener("scroll", () => {
  const nearBottom = linkListEl.scrollTop + linkListEl.clientHeight >= linkListEl.scrollHeight - 10;
  if (nearBottom) loadLinks();
});

// ========== 筛选（radio） ==========
document.querySelectorAll("input[name='statusFilter']").forEach(radio => {
  radio.addEventListener("change", () => {
    state.status = radio.value;           // "" / "1" / "0"
    state.sortBy = computeSortBy(state.status);
    resetAndLoad();
  });
});

// ========== 顶部四个按钮：设置 type 并加载 ==========
const ulink = document.getElementById("ulink");
const dlink = document.getElementById("dlink");
const qulink = document.getElementById("qulink");
const qdlink = document.getElementById("qdlink");

function onTypeButtonClick(type) {
  showPage("page2");
  state.type = type;
  // 你也可以在点按钮时重置 status，按你的业务来
  // state.status = "";
  state.sortBy = computeSortBy(state.status);
  resetAndLoad();
}

ulink?.addEventListener("click", () => onTypeButtonClick("ULink"));
dlink?.addEventListener("click", () => onTypeButtonClick("DLink"));
qulink?.addEventListener("click", () => onTypeButtonClick("QULink"));
qdlink?.addEventListener("click", () => onTypeButtonClick("QDLink"));

// ========== “修改 / 确认”按钮 ==========
changeBtn.addEventListener("click", function () {
  if (!state.editMode) {
    // 进入编辑
    setInputsEditable(true);
    changeBtn.textContent = "确认";
    state.editMode = true;
    return;
  }
  if(hasIllegalChars(document.getElementById('desc').value)){
    showToast('链接命名中不可包含< > : " / \ | ? *');
    return;
  }
  if( Number(verifySel.value) === 1 && passwordInput.value === ''){
    showToast('请输入密码');
    return;
  }

  // 点击确认 -> 提交
  const linkData = {
    token: state.token,
    link_desc: document.getElementById('desc').value,
    
    password: passwordInput.disabled ? "":passwordInput.value,
    
    create_time: "",
    expire_time: fromInputDatetime(document.getElementById('expire_time').value),
    verify: Number(verifySel.value)
  };

  fetch(`http://localhost:${port}/admin/Link/updateLink`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(linkData)
  })
  .then(res => res.json())
  .then(res => {
    // 依据你的返回结构处理
    console.log("Return after modification：", res);
    showToast("修改成功");
    setInputsEditable(false);
    changeBtn.textContent = "修改";
    state.editMode = false;
  })
  .catch(err => {
    console.error("Modification failed：", err);
    showToast("修改失败");
  });
});

// ========== 查看单个 link ==========
function fetchViewLink(token) {
  state.token=token;
  fetch(`http://localhost:${port}/admin/Link/view?token=${encodeURIComponent(token)}`)
    .then(res => res.json())
    .then(resp => {
      if (resp.code !== 200) {
        showToast("Retrieval error：" + resp.message);
        return;
      }
      const viewLink = resp.data;
      const link = viewLink.link;
      const linkFiles = viewLink.linkFiles;

      updateLinkInputs(link);
      updateURLandQR(link);
      updateLinkFiles(linkFiles);
      // 初始展示为只读
      setInputsEditable(false);
      changeBtn.textContent = "修改";
      state.editMode = false;
    })
    .catch(err => console.error("Request abnormal：", err));
}

function updateLinkInputs(link) {
  
  document.getElementById("desc").value = link.link_desc || "";
  document.getElementById("password").value = link.password || "";
  document.getElementById("used").innerText = link.used ?? "";
  document.getElementById("create_time").textContent = simplifyDate(link.create_time) || "";
  document.getElementById("expire_time").value = toInputDatetime(link.expire_time);
  
  // 新增：设置 verify 下拉的值（后端若是 0/1，这里转成字符串）
  if (verifySel) verifySel.value = String(link.verify ?? 1);

  // 展示态（不可编辑）
  setInputsEditable(false);
  // 按钮文字回到“修改”
  const changeBtn = document.getElementById('change');
  if (changeBtn) changeBtn.textContent = "修改";
  state.editMode = false;
  
  if(link.type === 'ULink' || link.type === 'QULink'){
    openDirBtnGroup.classList.remove("hidden");
    finalDir = uploadFolderPos+'/'+link.link_desc;
    
  }else{
    openDirBtnGroup.classList.add('hidden');
  }

  
}

openDirBtn.addEventListener('click',async()=>{
  const success=await window.myAPI.openFile(finalDir);
      if (!success) {
      showToast('文件夹不存在，无法打开！');
      }  
});

function updateURLandQR(link){
  url.innerHTML="";
  qrcode.innerHTML="";
  const URL="http://"+IP+":"+port+"/share/verify/link?token="+link.token;
  url.innerHTML=URL;
  new QRCode(qrcode,{
      text: URL,
      width:160,
      height:160
  });
  
}




function updateLinkFiles(linkFiles) {
  const fileNum = linkFiles.length;
  let totalSize = 0;
  const tbody = document.querySelector("#file-table tbody");
  tbody.innerHTML = "";
  (linkFiles || []).forEach(file => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${file.filename}</td>
      <td>${file.type}</td>
      <td>${formatBytes(file.filesize )} </td>
      <td><a href="#" class="file-path">${file.filepath}</a ></td>
      <td>${file.user}</td>
    `;
    
    const linkPath=row.querySelector(".file-path");
    linkPath.addEventListener('click',async(e)=>{
      e.preventDefault();
      const filePath=e.target.textContent;
      const success=await window.myAPI.openFile(filePath);
      if (!success) {
      showToast('文件不存在，无法打开！');
      }  
    });
    tbody.appendChild(row);
    totalSize +=file.filesize;
  });
  allFileInfo.textContent=`一共有${fileNum}个文件,总大小是${formatBytes(totalSize)}`;
}





// 初始：如果 page2 默认显示，希望加载默认类型/状态：
(function initPage2() {
  // 初始化默认值：status 为 radio 的 checked 值
  const checked = document.querySelector("input[name='statusFilter']:checked");
  state.status = checked ? checked.value : "";
  state.sortBy = computeSortBy(state.status);

  // 如果你希望初次进来不加载，注释掉下一行
  // loadLinks();
})();