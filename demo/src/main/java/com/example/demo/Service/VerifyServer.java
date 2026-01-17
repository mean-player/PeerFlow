package com.example.demo.Service;


import com.example.demo.Config.PasswordUtil;
import com.example.demo.Mapper.LinkMapper;
import com.example.demo.Model.Link;
import com.example.demo.Repository.LinkRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Service
public class VerifyServer {


    @Autowired
    LinkRepository linkRepository;

    @Autowired
    PasswordUtil passwordUtil;




    private boolean PasswordCheck(String password,String encrypted){

        return
                passwordUtil.matches(password,encrypted);

    }

    public boolean isLinkExpired(String timeStr) {

        if (timeStr == null || timeStr.isEmpty()) return true;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = null;

        // 尝试解析格式 1: "2025-08-01T22:10"
        try {
            DateTimeFormatter formatter3 = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
            targetTime = LocalDateTime.parse(timeStr, formatter3);
            return now.isAfter(targetTime);
        } catch (DateTimeParseException ignored) {}

        // 尝试解析格式 2: "2025-07-31T14:23:31.332Z"（Z 代表 UTC 时区）
        try {
            Instant instant = Instant.parse(timeStr); // 自动处理 Z
            targetTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            return now.isAfter(targetTime);
        } catch (DateTimeParseException ignored) {}

        // 尝试解析格式 3: "2025-08-01 14:00:37"
        try {
            DateTimeFormatter formatter1 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            targetTime = LocalDateTime.parse(timeStr, formatter1);
            return now.isAfter(targetTime);
        } catch (DateTimeParseException ignored) {}

        // 所有格式都无法解析，默认认为已过期
        return true;
    }



    public boolean isLinkValuable(String token){
        Link link = linkRepository.selectLink(token);
        if(link == null || link.getStatus() == 0){
            return false;
        }
        String expired_time_str= link.getExpire_time();
        if(expired_time_str.isEmpty()) {
            return false;
        }
        if(isLinkExpired(expired_time_str)){
            linkRepository.updateStatus(0,token);
            return false;
        }

        return true;

    }

    public boolean isLinkVerify(String token){
        int verify=linkRepository.selectLinkVerify(token);
        return verify == 1;
    }


    public boolean isPasswordValuable(String token,String password){
        String encrypted = linkRepository.selectPassword(token);
        if(encrypted.isEmpty()){
            return false;
        }
        return PasswordCheck(password,encrypted);

    }

    public String getLinkType(String token){
        return linkRepository.selectLinkType(token);
    }



}
