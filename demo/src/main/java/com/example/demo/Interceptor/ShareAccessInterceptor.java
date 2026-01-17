package com.example.demo.Interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

public class ShareAccessInterceptor implements HandlerInterceptor {



    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler)throws Exception{

        String token=request.getParameter("token");
        if(token==null){
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return false;
        }
        HttpSession httpSession = request.getSession(false);
        Boolean validated = httpSession != null ? (Boolean)
                httpSession.getAttribute("Token:"+token) : null;
        if(validated==null){
            return false;
        }
       return validated;
    }

}
