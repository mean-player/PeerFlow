// ====== 显示当前时间 ======
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString(); // 例如 14:35:20
    document.getElementById("timeDisplay").textContent = "当前时间：" + timeStr;
}
setInterval(updateTime, 1000);
updateTime();

// ====== 获取 URL 参数（token） ======
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// ====== 提交按钮绑定事件 ======
document.getElementById("verifyBtn").addEventListener("click", async () => {

    const password = document.getElementById("password").value.trim();
    const token = getQueryParam("token");

    if (!password) {
        alert("请输入密码！");
        return;
    }

    try {
        const response = await fetch("/share/verify/password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,

                password: password
            })
        });

        // 如果后端返回了 redirect，fetch 不会自动跳转，需要手动跳转
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            const text = await response.text();
            console.log("received from backend：", text);
            alert("验证失败，请检查密码。");
        }
    } catch (err) {
        console.error("bad request：", err);
        alert("网络错误，请稍后重试。");
    }
});