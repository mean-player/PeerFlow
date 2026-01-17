package com.example.demo.Config;

import com.example.demo.Interceptor.ShareAccessInterceptor;
//import com.example.demo.Interceptor.ShareAccessInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ShareWebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry){
        registry.addInterceptor(new ShareAccessInterceptor())
                .addPathPatterns("/share/**")
                .excludePathPatterns("/share/verify/link","/share/verify/password",
                        "/share/upload","/share/getIp");

    }


}
