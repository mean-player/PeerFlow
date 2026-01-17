package com.example.demo.Controller;

import com.example.demo.Compoent.RequestIp;
import com.example.demo.Compoent.UploadingProgress;
import com.example.demo.Compoent.WebPermitMap;
import com.example.demo.Model.*;
import com.example.demo.Service.DownLoadServer;
import com.example.demo.Service.UploadServer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.time.LocalDateTime;
import java.util.Set;

@Slf4j
@RestController
public class FileController {
    @Autowired
    UploadServer uploadServer;

    @Autowired
    DownLoadServer  downLoadServer;

    @Autowired
    RequestIp linkIp;

    @Autowired
    WebPermitMap webPermitMap;

    @Autowired
    UploadingProgress uploadingProgress;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;






    @RequestMapping("/share/getIp")
    public String getIp(HttpServletRequest request){
        String Ip_Addr = linkIp.getClientIp(request);
        log.info("ip为：{} 的用户访问了查询ip的api", Ip_Addr);
        return Ip_Addr;
    }

    @RequestMapping("/share/LinkInfo")
    public LinkPart getLinkInfo(@RequestParam(value = "token",required = true) String token){
        LinkPart linkPart = downLoadServer.getLinkPart(token);
        log.info("用户访问了描述为{}的链接",linkPart.getLink_desc());
        return linkPart;
    }


    @RequestMapping("/share/LinkAndFiles")
    public ViewLink getViewLink(@RequestParam(value = "token",required = true) String token){
        log.info("用户访问了下载的链接，token为{}",token);
        return downLoadServer.getViewLink(token);
    }

    @RequestMapping("/share/upload/checkHash")
    public UploadResponse before_upload(@RequestParam(value = "hash",required = true)String hash,
                                        @RequestParam(value = "max_chunk",required = true)Integer max_chunk,
                                        @RequestParam(value = "final_name",required = true)String final_name,
                                        @RequestParam(value = "type",required = true)String type,
                                        @RequestParam(value = "size",required = true)Long size,
                                        @RequestParam(value = "username",required = true)String username,
                                        @RequestParam(value = "token",required = true) String token,
                                        HttpServletRequest request
                                        ){
        log.info("文件名为 {} 的文件在上传前查询进度",final_name);

        String new_user_ip=linkIp.getClientIp(request);
        LinkFile linkFile = uploadServer.registerLinkFile(token,final_name,type,size,username,new_user_ip,hash);
        messagingTemplate.convertAndSendToUser("admin","/queue/file",linkFile);

        Set<Integer>missing= uploadServer.beforeUpload(hash,max_chunk);


        UploadedTotal uploadedTotal = new UploadedTotal();
        if(missing.isEmpty()) {
            uploadedTotal.setUploaded_num(0);
            log.info("文件名为 {} 的文件此前从未上传",final_name);
        }else{
            uploadedTotal.setUploaded_num(missing.size());
            log.info("文件名为{}的文件缺少的的块数为{}",final_name,missing.size());
        }
        if(uploadingProgress.get(hash) == null) {
            uploadedTotal.setTotal_num(max_chunk);
            uploadedTotal.setHash(hash);
            uploadingProgress.addKV(hash, uploadedTotal);
        }



        UploadResponse uploadResponse=new UploadResponse();
        uploadResponse.setFile_hash(hash);
        uploadResponse.setMissing(missing);
        uploadResponse.setStatus("check");
        return uploadResponse;
    }


    @RequestMapping("share/upload/checkChunk")
    public UploadResponse after_upload( @RequestParam(value = "hash",required = true)String hash,
                                        @RequestParam(value = "max_chunk",required = true)Integer max_chunk,
                                        @RequestParam(value = "final_name",required = true)String final_name,
                                        @RequestParam(value = "permitCode",required = true)String permitCode,
                                        @RequestParam(value = "token",required = true) String token,
                                        HttpServletRequest request
                                       ){
        log.info("hash为{}的文件正在查询缺失块",hash);

        uploadServer.afterUpload(hash);
        Set<Integer>missing= uploadServer.CheckMissing(hash,max_chunk);


        UploadResponse uploadResponse=new UploadResponse();
        uploadResponse.setFile_hash(hash);

        if(missing.isEmpty()) {
            uploadServer.mergeChunks(token,hash,permitCode,final_name,max_chunk);
            log.info("hash为{}文件名为{}的文件完成了上传",hash,final_name);


            UploadedTotal uploadedTotal = new UploadedTotal();
            uploadedTotal.setUploaded_num(max_chunk);
            uploadedTotal.setTotal_num(max_chunk);
            uploadedTotal.setHash(hash);

            uploadingProgress.Inform(uploadedTotal);

            uploadingProgress.remove(hash);



            uploadResponse.setStatus("completed");
            uploadResponse.setMissing(missing);

        }else{
            log.info("文件名为{}的文件漏传了下面这些分块{}",final_name,missing);
            uploadResponse.setMissing(missing);
            uploadResponse.setStatus("uncompleted");
        }

        return uploadResponse;

    }


    @PostMapping("/share/upload")
    public UploadResponse upload_file(

            @RequestParam(value = "hash")String hash,
            @RequestParam(value = "max_chunk")Integer max_chunk,
            @RequestParam(value = "chunk_num")Integer chunk_num,
            @RequestParam(value = "permitCode")String permitCode,
            @RequestParam(value = "file") MultipartFile file,
            HttpServletRequest request

    ) throws IOException {
        log.info("正在上传分块{}",chunk_num);

        UploadResponse uploadResponse=new UploadResponse();


        uploadResponse.setFile_hash(hash);


        if(webPermitMap.get(hash) == null || !webPermitMap.get(hash).equals(permitCode) ){
            uploadResponse.setStatus("denied");
            log.info("{}的上传非法",hash);
            return uploadResponse;
        }




        try {
            boolean single_upload_result=uploadServer.SolveFile(hash, chunk_num, max_chunk, file);
            if(single_upload_result){
                log.info("块号{}完成了上传",chunk_num);
                uploadResponse.setStatus("Uploaded");
            }else{
                log.info("块号{}上传失败",chunk_num);
                uploadResponse.setStatus("upload failed");
            }

            return uploadResponse;

        }catch(IOException e){
            e.printStackTrace();
            uploadResponse.setStatus("upload failed");
        }

        return uploadResponse;

    }


    @RequestMapping("/share/download")
    public void download_file(
            @RequestParam(value = "token",required = true)String token,
            @RequestParam(value = "filename",required = true)String filename,
            @RequestParam(value = "filehash",required = true)String filehash,
            @RequestParam(value = "username",required = true)String username,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws UnsupportedEncodingException {
        log.info("有其他人利用token为{}的链接下载了文件名为{}的文件，该用户描述为{}",token,filename,username);

        String new_user_ip=linkIp.getClientIp(request);
        downLoadServer.downloadFile(new_user_ip,username,token,filename,filehash,request,response);

    }

    @RequestMapping("/share/preview")
    public void previewFile(
            @RequestParam("token") String token,
            @RequestParam("filename") String filename,
            @RequestParam("filehash") String filehash,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws UnsupportedEncodingException {

        log.info("预览文件: token={}, filename={}", token, filename);
        downLoadServer.previewFile(token, filehash, filename, request, response);
    }

}