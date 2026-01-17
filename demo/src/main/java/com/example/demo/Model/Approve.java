package com.example.demo.Model;

public class Approve {
    private Integer id;
    private String token;
    private String fileInfo;
    private String time;
    private String sender;
    private String approve_result;//approve    reject  none



    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }




    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }



    public String getApprove_result() {
        return approve_result;
    }

    public void setApprove_result(String approve_result) {
        this.approve_result = approve_result;
    }


    public String getFileInfo() {
        return fileInfo;
    }

    public void setFileInfo(String fileInfo) {
        this.fileInfo = fileInfo;
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
}
