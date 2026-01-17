package com.example.demo.Model;

import java.util.List;

public class LinkCreateRequest {
    private Link link;
    private List<RequestFile> requestFiles;

    public Link getLink() {
        return link;
    }

    public void setLink(Link link) {
        this.link = link;
    }


    public List<RequestFile> getRequestFiles() {
        return requestFiles;
    }

    public void setRequestFiles(List<RequestFile> requestFiles) {
        this.requestFiles = requestFiles;
    }
}
