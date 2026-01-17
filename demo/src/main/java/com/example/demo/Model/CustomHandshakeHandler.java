package com.example.demo.Model;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.net.URI;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;

public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        // 从 URI 中获取 token
        String token = getTokenFromRequest(request.getURI());
        return () -> token != null ? token : UUID.randomUUID().toString(); // fallback 匿名用户
    }

    private String getTokenFromRequest(URI uri) {
        String query = uri.getQuery(); // eg: token=abc123
        if (query == null) return null;
        for (String param : query.split("&")) {
            if (param.startsWith("token=")) {
                return param.substring(6);
            }
        }
        return null;
    }
}
