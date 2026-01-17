package com.example.demo.Model;

import java.util.Set;

public class UploadResponse {
    private String status;
    private Set<Integer> missing;
    private String file_hash;


    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = String.valueOf(status);
    }

    public Set<Integer> getMissing() {
        return missing;
    }

    public void setMissing(Set<Integer> missing) {
        this.missing = missing;
    }


    public String getFile_hash() {
        return file_hash;
    }

    public void setFile_hash(String file_hash) {
        this.file_hash = file_hash;
    }
}
