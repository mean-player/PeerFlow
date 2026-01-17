const clearLogBtn = document.getElementById('page7-clearLogBtn');
const openLogBtn = document.getElementById('page7-openLogBtn');
const changePortBtn = document.getElementById('page7-changePortsBtn');


const logSize = document.getElementById('page7-logSize');
const IpAddr = document.getElementById('page7-ipAddress');
const portInput = document.getElementById('page7PortInput');






//change port
function changePort() {
    const new_port = parseInt(portInput.value, 10);
    if (!Number.isInteger(new_port) || new_port <= 0 || new_port > 65535) {
            showToast('端口号无效，必须是 1-65535 之间的整数',2000);
        return;
        }

    try {
        const result = window.configUpdater.updateServerPort(new_port);
        console.log('Port updated successfully.', result);
        showToast(`端口更新为 ${new_port},重启以生效`);
    } catch (err) {
        showToast('更新端口失败：' + err.message,2000);
    }
}

// 获取日志大小
function fetchLogSize() {
    try {
        const size = window.logUtils.getLogSize();
        console.log(`Total size of logs: ${size} bytes`);
        return size;
    } catch (error) {
        console.error('Failed to retrieve the log size:', error);
    }
}



// 打开日志文件夹
function openLogDirectory() {
    try {
        window.logUtils.openLogFolder();
        console.log('The log folder has been opened.');
    } catch (error) {
        showToast('打开日志文件夹失败:', error);
    }
}





// 初始化时显示日志大小
document.addEventListener('DOMContentLoaded', () => {
    const size = fetchLogSize(); // 替换为实际日志路径
    logSize.textContent = `${formatBytes(size)}`;
    IpAddr.textContent = IP;
    portInput.placeholder = port;
    portInput.disabled=true;




openLogBtn.addEventListener("click",()=>{
    openLogDirectory();
});



changePortBtn.addEventListener('click',()=>{
    const mode = changePortBtn.dataset.mode;
    if(mode === 'ackPort'){
    changePort();
     portInput.disabled=true;
    changePortBtn.dataset.mode='changePort';
    changePortBtn.textContent='更改';
    }
    if(mode === 'changePort'){
        showToast('更改前请确认该端口可用！',2000);
        portInput.disabled=false;
        changePortBtn.dataset.mode='ackPort';
        changePortBtn.textContent='确认';
    }
});


});










