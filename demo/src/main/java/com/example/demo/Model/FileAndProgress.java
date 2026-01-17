package com.example.demo.Model;

public class FileAndProgress {
    private Chunk chunk;
    private LinkFile linkFile;


    public LinkFile getLinkFile() {
        return linkFile;
    }

    public void setLinkFile(LinkFile linkFile) {
        this.linkFile = linkFile;
    }

    public Chunk getChunk() {
        return chunk;
    }

    public void setChunk(Chunk chunk) {
        this.chunk = chunk;
    }
}
