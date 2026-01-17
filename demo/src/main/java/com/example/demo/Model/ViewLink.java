package com.example.demo.Model;

import java.util.List;

public class ViewLink {
    private Link link;
    private List<LinkFile> linkFiles;


    public Link getLink() {
        return link;
    }

    public void setLink(Link link) {
        this.link = link;
    }

    public List<LinkFile> getLinkFiles() {
        return linkFiles;
    }

    public void setLinkFiles(List<LinkFile> linkFiles) {
        this.linkFiles = linkFiles;
    }
}
