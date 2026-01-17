package com.example.demo.Model;

public class AckInfo {
    private String target;
    private boolean ack;
    private WebRequest webRequest;

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }


    public boolean isAck() {
        return ack;
    }

    public void setAck(boolean ack) {
        this.ack = ack;
    }

    public WebRequest getWebRequest() {
        return webRequest;
    }

    public void setWebRequest(WebRequest webRequest) {
        this.webRequest = webRequest;
    }
}
