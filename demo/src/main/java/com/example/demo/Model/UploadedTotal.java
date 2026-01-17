package com.example.demo.Model;

public class UploadedTotal {
    private String hash;
    private int uploaded_num;
    private int total_num;

    public int getUploaded_num() {
        return uploaded_num;
    }

    public void setUploaded_num(int uploaded_num) {
        this.uploaded_num = uploaded_num;
    }

    public int getTotal_num() {
        return total_num;
    }

    public void setTotal_num(int total_num) {
        this.total_num = total_num;
    }



    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
    }
}
