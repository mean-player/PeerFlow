package com.example.demo.Repository;


import com.example.demo.Mapper.LinkFileMapper;
import com.example.demo.Model.LinkFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class LinkFileRepository {

    @Autowired
    LinkFileMapper linkFileMapper;

    private final Map<String, Object> linkFileLockMap= new ConcurrentHashMap<>();

    private Object getLockForLinkFile(String token){
        return
                linkFileLockMap.computeIfAbsent(token, k ->new Object());

    }

    public boolean insertLinkFile(LinkFile linkFile){
        Object key=getLockForLinkFile(linkFile.getToken());
        synchronized (key){
            return linkFileMapper.insertLinkFile(linkFile);
        }

    }


    public List<LinkFile> selectLinkFile(String token){

            return linkFileMapper.selectLinkFile(token);
    }


    public LinkFile selectLinkFileByHash(String filehash){

        return linkFileMapper.selectLinkFileByHash(filehash);
    }

    public LinkFile selectLinkFileByHashToken(String filehash,String token){

        return linkFileMapper.selectLinkFileByHashToken(filehash,token);
    }



    public String selectPath(String filehash,String token){
        Object key=getLockForLinkFile(token);
        synchronized (key){
            return linkFileMapper.selectPath(filehash,token);
        }
    }

    public String selectUser(String token,String filehash){
        Object key=getLockForLinkFile(token);
        synchronized (key){
            return linkFileMapper.selectUser(filehash,token);
        }
    }

    public boolean updateUser(String user,String filehash,String token){
        Object key=getLockForLinkFile(token);
        synchronized (key){
            return linkFileMapper.updateUser(user,filehash,token);
        }

    }


    public boolean updateStatus(Integer status,String filehash,String token){
        Object key=getLockForLinkFile(token);
        synchronized (key){
            return linkFileMapper.updateStatus(status,filehash,token);
        }

    }

    public boolean updateFilePath(String filepath,String filehash,String token){
        Object key=getLockForLinkFile(token);
        synchronized (key){
            return linkFileMapper.updateFilePath(filepath,filehash,token);
        }

    }


    public  boolean deleteLinkFile(String token){

        Object key=getLockForLinkFile(token);
        synchronized (key){
            return linkFileMapper.deleteLinkFile(token);
        }



    }


    public  boolean deleteLinkFileByHash(String token,String filehash){

        Object key=getLockForLinkFile(token);
        synchronized (key){
            return linkFileMapper.deleteLinkFileByHash(filehash);
        }



    }


    public  boolean deleteLinkFileByStatus(){


            return linkFileMapper.deleteLinkFileByStatus();




    }

    public  boolean deleteAllLinkFile(){


        return linkFileMapper.deleteAllLinkFile();




    }












}
