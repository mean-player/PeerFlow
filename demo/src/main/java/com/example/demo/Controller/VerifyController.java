package com.example.demo.Controller;


import com.example.demo.Model.Link;
import com.example.demo.Model.Verify;
import com.example.demo.Service.VerifyServer;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Objects;

@Slf4j
@Controller

public class VerifyController {

    @Autowired
    VerifyServer verifyServer;

    @Value("${my.public.ip}")
    private String publicIp;

    @Value("${server.port}")
    private String port;



    @RequestMapping("/share/verify/link")
    public String verifyLink(
            @RequestParam(value = "token",required = true)String token,
            HttpSession httpSession
    ){
        log.info("有其他人尝试访问token为{}的链接",token);
        if(!verifyServer.isLinkValuable(token)){
            log.info("token为{}的链接不可用",token);
            return "redirect:/NotFound.html";

        }
        if(!verifyServer.isLinkVerify(token)){
            httpSession.setAttribute("Token:"+token,true);
            String type = verifyServer.getLinkType(token);
            if(type.equals("QDLink") || type.equals("DLink")) {
                log.info("token为{}的链接为下载链接，已经跳转",token);
                return "redirect:/FileDownload.html?token=" + token + "&server="+publicIp+"&port="+port;
            }else{
                log.info("token为{}的链接为上传链接，已经跳转",token);
                return "redirect:/FileUpload.html?token=" + token + "&server="+publicIp+"&port="+port;
            }
        }
        log.info("token为{}的链接为需要验证的链接，已经跳转",token);
        return "redirect:/password.html?token="+token;

    }




    @PostMapping("/share/verify/password")
    public String verifyPassword(HttpSession httpSession,
                                 @RequestBody Verify verify) {

        String token = verify.getToken();
        String password = verify.getPassword();


        // 尝试次数记录键
        String countKey = "TryCount:" + token;
        Integer tryCount = (Integer) httpSession.getAttribute(countKey);
        if (tryCount == null) tryCount = 0;

        // 超过尝试次数
        if (tryCount >= 3) {
            return "redirect:/Locked.html"; // 封锁页
        }

        // 校验密码
        if (verifyServer.isPasswordValuable(token, password)) {
            httpSession.setAttribute("Token:" + token, true); // 通关标记
            httpSession.removeAttribute(countKey); // 清除尝试计数
            String linkType = verifyServer.getLinkType(token);
            return "redirect:/" + (linkType.equals("DLink") ? "FileDownload.html" : "FileUpload.html") +
                    "?token=" + token + "&server="+publicIp+"&port="+port;
        } else {
            // 密码错误，+1
            httpSession.setAttribute(countKey, tryCount + 1);
            return "redirect:/password.html?token=" + token + "&error=1";
        }
    }
}
