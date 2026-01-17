package com.example.demo.Compoent;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.websocket.Session;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RequestIp {



    public  String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            // 多级代理时可能返回多个 IP，第一个为真实 IP
            return ip.split(",")[0].trim();
        }

        ip = request.getHeader("X-Real-IP");
        if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }

        return request.getRemoteAddr(); // 最后退一步，获取直接连接的 IP
    }



    public String getIpFromSession(Session session) {
        List<String> ips = session.getRequestParameterMap().get("X-Real-IP");
        if (ips != null && !ips.isEmpty()) return ips.get(0);
        return session.getUserProperties().get("javax.websocket.endpoint.remoteAddress").toString();
    }


}
