package com.example.demo.Model;

public class Chunk {
    private String file_hash;

    private String uploaded_chunks;

    private Integer status;

    private Integer max_chunk;

    public void setUploaded_chunks(String uploaded_chunks) {
        this.uploaded_chunks = uploaded_chunks;
    }

    public void setFile_hash(String file_hash) {
        this.file_hash = file_hash;
    }

    public String getUploaded_chunks() {
        return uploaded_chunks;
    }

    public String getFile_hash() {
        return file_hash;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Integer getMax_chunk() {
        return max_chunk;
    }

    public void setMax_chunk(Integer max_chunk) {
        this.max_chunk = max_chunk;
    }
}
