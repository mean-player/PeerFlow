package com.example.demo.Model;

public class UploadRequest {


    private String file_hash;
    private int max_chunk;
    private int chunk_num;
    private String final_path;
    private String final_name;
    private String type;
    private int size;
    private String permitCode;


    public String getFile_hash() {
        return file_hash;
    }

    public int getMax_chunk() {
        return max_chunk;
    }

    public void setFile_hash(String file_hash) {
        this.file_hash = file_hash;
    }


    public void setMax_chunk(int max_chunk) {
        this.max_chunk = max_chunk;
    }

    public int getChunk_num() {
        return chunk_num;
    }

    public void setChunk_num(int chunk_num) {
        this.chunk_num = chunk_num;
    }

    public String getFinal_path() {
        return final_path;
    }

    public void setFinal_path(String final_path) {
        this.final_path = final_path;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFinal_name() {
        return final_name;
    }

    public void setFinal_name(String final_name) {
        this.final_name = final_name;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getPermitCode() {
        return permitCode;
    }

    public void setPermitCode(String permitCode) {
        this.permitCode = permitCode;
    }
}
