package com.example.demo.Compoent;


import com.example.demo.Model.CustomHandshakeHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setHandshakeHandler(new CustomHandshakeHandler()) // 自定义token解析
                .setAllowedOriginPatterns(
                        // 开发环境
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                        // 本地测试
        )
                .withSockJS(); // 使用 SockJS，浏览器兼容更好
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 前缀 /app 代表客户端发送的消息走 @MessageMapping 方法
        registry.setApplicationDestinationPrefixes("/app");

        // 启用内置的简单消息代理，前缀 /user 表示点对点消息
        registry.enableSimpleBroker("/topic","/queue");
        registry.setUserDestinationPrefix("/user");
    }
}