package com.example.demo.Service;


import com.example.demo.Compoent.UploadingProgress;
import com.example.demo.Config.PasswordUtil;
import com.example.demo.Mapper.LinkMapper;
import com.example.demo.Model.*;
import com.example.demo.Repository.ApproveRepository;
import com.example.demo.Repository.ChunkRepository;
import com.example.demo.Repository.LinkFileRepository;
import com.example.demo.Repository.LinkRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class LinkServer {

    @Autowired
    private PasswordUtil passwordUtil;

    @Autowired
    LinkRepository linkRepository;

    @Autowired
    LinkFileRepository linkFileRepository;

    @Autowired
    ChunkRepository chunkRepository;

    @Autowired
    UploadingProgress uploadingProgress;

    @Autowired
    ApproveRepository approveRepository;

    @Value("${file.temp}")
    private String temp_path;

    private String getToken(){
        return
                UUID.randomUUID().toString().replace("-","").substring(0,12);

    }

    private Link initLink(Link link){

        String token=getToken();
        link.setUsed(0);
        link.setStatus(1);
        link.setToken(token);
        int verify=link.getVerify();
        String password = link.getPassword();
        if(verify==1 && !password.isEmpty()){
            String encrypted=passwordUtil.encrypt(password);
            link.setPassword(encrypted);
        }

        return link;

    }


    public boolean isExpired(String token) {
        String timeStr = linkRepository.selectExpireTime(token);
        if (timeStr == null || timeStr.isEmpty()) return true;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = null;

        // 尝试解析格式 1: "2025-08-01T22:10"
        try {
            DateTimeFormatter formatter3 = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
            targetTime = LocalDateTime.parse(timeStr, formatter3);
            return now.isAfter(targetTime);
        } catch (DateTimeParseException ignored) {}

        // 尝试解析格式 2: "2025-07-31T14:23:31.332Z"（Z 代表 UTC 时区）
        try {
            Instant instant = Instant.parse(timeStr); // 自动处理 Z
            targetTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            return now.isAfter(targetTime);
        } catch (DateTimeParseException ignored) {}

        // 尝试解析格式 3: "2025-08-01 14:00:37"
        try {
            DateTimeFormatter formatter1 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            targetTime = LocalDateTime.parse(timeStr, formatter1);
            return now.isAfter(targetTime);
        } catch (DateTimeParseException ignored) {}

        // 所有格式都无法解析，默认认为已过期
        return true;
    }





    public String CreateLink(LinkCreateRequest linkCreateRequest){

        Link link=initLink(linkCreateRequest.getLink());
        String token=link.getToken();
        String type = link.getType();
        linkRepository.insertLink(token,link);
        boolean result =true;

        LinkFile linkFile = new LinkFile();
        if(type.equals("QDLink") || type.equals("DLink")) {
            List<RequestFile> requestFiles = linkCreateRequest.getRequestFiles();
            for (RequestFile requestFile : requestFiles) {

                linkFile.setFilename(requestFile.getFilename());
                linkFile.setFilesize(requestFile.getFilesize());
                linkFile.setToken(token);
                linkFile.setType(requestFile.getFiletype());
                linkFile.setFilepath(requestFile.getFilepath());
                linkFile.setFilehash(requestFile.getFilehash());
                linkFile.setUser(null);
                linkFile.setStatus(1);
                result = linkFileRepository.insertLinkFile(linkFile);
                if(!result){
                    return null;
                }
            }
        }
        return token;
    }



    public boolean updateLinkStatus(String token,Integer status){
        return linkRepository.updateStatus(status,token);

    }


    public boolean updateLink(Link link){
        int verify=link.getVerify();
        String password = link.getPassword();
        if(verify==1 && !password.isEmpty()){
            String encrypted=passwordUtil.encrypt(password);
            link.setPassword(encrypted);
        }
        return linkRepository.updateLink(link);
    }



    public void deleteExpiredLink(String type){
        if(type == null || type.isEmpty()){
            return ;
        }

        List<String> expiredTokens=linkRepository.selectExpiredTokenByType(0,type);
        for(String token : expiredTokens){
            linkRepository.deleteExpiredLink(token);
            linkFileRepository.deleteLinkFile(token);

        }

    }


    public boolean updateExpiredLinkStatus(){
        log.info("尝试更新所有有效link的状态");
        boolean result = true;
        List<String>tokens=linkRepository.selectExpiredToken(1);
        for(String token : tokens){
            if(isExpired(token)){
                boolean part = linkRepository.updateStatus(0,token);
                if(!part){
                    result = false;
                }
            }
        }
        if(result){
            log.info("更新成功");
        }else{
            log.error("更新失败");
        }
        return result;
    }

    public List<Link> viewLinks(LinkQueryParam linkQueryParam){
        return linkRepository.selectLinkPage(linkQueryParam);
    }

    public ViewLink viewLink(String token){

        Link link = linkRepository.selectLink(token);

        if(link.getVerify()==1) {
            String encrypt = link.getPassword();
            link.setPassword(passwordUtil.decrypt(encrypt));
        }


        List<LinkFile>linkFiles = linkFileRepository.selectLinkFile(token);
        ViewLink viewLink = new ViewLink();
        viewLink.setLink(link);
        viewLink.setLinkFiles(linkFiles);
        return viewLink;
    }


    public List<FileAndProgress> UncompletedFiles(int offset){

        List<FileAndProgress> fileAndProgresses = new ArrayList<>();


        List<Chunk> chunks = chunkRepository.selectUnCompleted(offset);
        
        log.info("查询到的未完成文件有{}个",chunks.size());
        for(Chunk chunk : chunks){
            String hash = chunk.getFile_hash();
            LinkFile linkFile = linkFileRepository.selectLinkFileByHash(hash);
            FileAndProgress fileAndProgress = new FileAndProgress();
            fileAndProgress.setLinkFile(linkFile);
            fileAndProgress.setChunk(chunk);

            fileAndProgresses.add(fileAndProgress);

        }

        log.info("查询到的有 {}个",fileAndProgresses.size());
        return fileAndProgresses;


    }

    public List<Approve> viewApproves(int offset,String  approve_result){
        return approveRepository.selectApprove(approve_result,offset,10);

    }

    @Transactional
    public void deleteSingleUncompleted(String token,String filehash){

        linkFileRepository.deleteLinkFileByHash(token,filehash);
        interrupt(filehash);
    }

    @Transactional
    public void deleteAllUncompleted(){
        chunkRepository.deleteUnCompletedChunk();
        linkFileRepository.deleteLinkFileByStatus();
        Path temp_Dir= Paths.get(temp_path);
        try {
            Files.walk(temp_Dir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }catch (IOException e){
            log.error("删除未完成文件所在临时目录失败");
            e.printStackTrace();
        }

    }

    public void deleteAllLinkFile(){
        linkFileRepository.deleteAllLinkFile();
    }

    public void interrupt(String filehash){
        chunkRepository.deleteSingleChunk(filehash);
        Path temp_Dir= Paths.get(temp_path);
        Path chunkDir= temp_Dir.resolve(filehash);
        try {
            Files.walk(chunkDir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }catch (IOException e){
            log.error("删除被终止文件所在临时目录失败");
            e.printStackTrace();
        }
    }

    public boolean deleteApprove(String approve_result){
        return approveRepository.deleteApprove(approve_result);
    }





}
