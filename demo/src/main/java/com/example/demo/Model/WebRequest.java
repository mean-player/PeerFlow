package com.example.demo.Model;

import java.util.List;

public class WebRequest {
    private String ip;
    private String sender;
    private String user;
    private Integer num;
    private String time;
    private String token;
    private String link_desc;
    private List<WebFileMeta> webFileMetas;


    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Integer getNum() {
        return num;
    }

    public void setNum(Integer num) {
        this.num = num;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }


    public List<WebFileMeta> getWebFileMetas() {
        return webFileMetas;
    }

    public void setWebFileMetas(List<WebFileMeta> webFileMetas) {
        this.webFileMetas = webFileMetas;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getLink_desc() {
        return link_desc;
    }

    public void setLink_desc(String link_desc) {
        this.link_desc = link_desc;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }
}
