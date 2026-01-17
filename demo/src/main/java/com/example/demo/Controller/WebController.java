package com.example.demo.Controller;

import com.example.demo.Compoent.WebPermitMap;
import com.example.demo.Model.*;
import com.example.demo.Repository.ApproveRepository;
import com.example.demo.Repository.LinkRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Controller
public class WebController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    WebPermitMap webPermitMap;

    @Autowired
    LinkRepository linkRepository;

    @Autowired
    ApproveRepository approveRepository;


    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int unit = 1024;
        String[] units = {"KB", "MB", "GB", "TB"};
        double size = bytes;
        int i = -1;
        while (size >= unit && i < units.length - 1) {
            size /= unit;
            i++;
        }
        return String.format("%.2f %s", size, units[i]);
    }



    @MessageMapping("sendToAdmin")
    public void sendToAdmin(@Payload WebRequest webRequest, Principal sender){

        log.info("收到{}的文件上传请求",sender.getName());
        webRequest.setSender(sender.getName());


        String token = webRequest.getToken();
        Link link =linkRepository.selectLink(token);

        String link_desc=link.getLink_desc();
        webRequest.setLink_desc(link_desc);

        if(link.getStatus()==1 && (link.getType().equals("QULink"))){

            HashMap<String, String> hashPermit = new HashMap<>();
            for(WebFileMeta webFileMeta : webRequest.getWebFileMetas()){
                String hash=webFileMeta.getHash();
                System.out.println("收到文件hash："+hash);
                String permitCode=UUID.randomUUID().toString().replace("-","").substring(0,12);
                webPermitMap.add(hash,permitCode);
                hashPermit.put(hash,permitCode);

            }
            messagingTemplate.convertAndSendToUser(sender.getName(),"/queue/ack",hashPermit);
            log.info("已经自动同意了{}的上传请求",sender.getName());


        }else {

            StringBuilder fileInfo = new StringBuilder();
            StringBuilder file = new StringBuilder();
            messagingTemplate.convertAndSendToUser("admin", "/queue/info", webRequest);
            log.info("已经转发了{}的上传请求",sender.getName());

            for (WebFileMeta webFileMeta : webRequest.getWebFileMetas()) {
                webPermitMap.add(webFileMeta.getHash(), "EMPTY");
                 file.append(webFileMeta.getName()).append("-")
                         .append(webFileMeta.getType()).append("-").append(formatBytes(webFileMeta.getSize()));
                 fileInfo.append(file.toString());
            }

            Approve approve = new Approve();
            approve.setToken(token);
            approve.setApprove_result("none");
            approve.setSender(webRequest.getUser()+"-"+webRequest.getIp());
            approve.setTime(webRequest.getTime());
            approve.setFileInfo(fileInfo.toString());
            approveRepository.insertApprove(approve);


        }

    }

    @MessageMapping("sendAck")
    public void sendAck(@Payload AckInfo ackInfo,Principal admin){

        WebRequest webRequest = ackInfo.getWebRequest();
        String token = webRequest.getToken();
        String time = webRequest.getTime();
        HashMap<String, String> hashPermit = new HashMap<>();
        if(ackInfo.isAck())
        {
            for(WebFileMeta webFileMeta : ackInfo.getWebRequest().getWebFileMetas()){
                String hash=webFileMeta.getHash();
                String permitCode=UUID.randomUUID().toString().replace("-","").substring(0,12);
                if(webPermitMap.get(hash).equals("EMPTY")) {
                    webPermitMap.add(hash, permitCode);

                    hashPermit.put(hash, permitCode);
                }else{
                    log.info("hash为{}已经存在允许码",hash);
                    String orgCode= webPermitMap.get(hash);
                    hashPermit.put(hash,orgCode);
                }
            }
            approveRepository.updateApprove_result("approve",token,time);
            log.info("已经同意了{}的上传请求",ackInfo.getTarget());

        }else{
            approveRepository.updateApprove_result("reject",token,time);
            log.info("已经拒绝了{}的上传请求",ackInfo.getTarget());
        }
        messagingTemplate.convertAndSendToUser(ackInfo.getTarget(),"/queue/ack",hashPermit);
    }




    public void InformUploadingFile(LinkFile linkFile){
        messagingTemplate.convertAndSendToUser("admin","/queue/file",linkFile);

    }





}
