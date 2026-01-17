package com.example.demo.Interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

public class LocalhostOnlyInterceptor
implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler)throws Exception {

        String remoteAddr = request.getRemoteAddr();

        if ("127.0.0.1".equals(remoteAddr) ||
                "0:0:0:0:0:0:0:1".equals(remoteAddr) ||
                "::1".equals(remoteAddr)) {
            return true;
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write("you have no right to access");
        return false;

    }


}


