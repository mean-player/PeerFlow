package com.example.demo.Service;


import com.example.demo.Model.Link;
import com.example.demo.Model.LinkFile;
import com.example.demo.Model.LinkPart;
import com.example.demo.Model.ViewLink;
import com.example.demo.Repository.LinkFileRepository;
import com.example.demo.Repository.LinkRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Slf4j
@Service
public class DownLoadServer {

    @Autowired
    private LinkFileRepository linkFileRepository;

    @Autowired
    private LinkRepository linkRepository;



    public LinkPart getLinkPart(String token){
        Link link = linkRepository.selectLink(token);
        LinkPart linkPart = new LinkPart();
        linkPart.setLink_desc(link.getLink_desc());
        linkPart.setExpire_time(link.getExpire_time());
        return linkPart;
    }

    public ViewLink getViewLink(String token){

        Link link = linkRepository.selectLink(token);

        link.setPassword(null);
        link.setUsed(null);
        link.setStatus(null);
        link.setCreate_time(null);
        link.setId(null);

        List<LinkFile> linkFiles = linkFileRepository.selectLinkFile(token);
        ViewLink viewLink = new ViewLink();
        viewLink.setLink(link);
        viewLink.setLinkFiles(linkFiles);
        return viewLink;
    }


    @Transactional
    private void downloadFileDB(String user_ip,String username,String token,String filehash){
        String user=linkFileRepository.selectUser(token,filehash);
        log.info(user);
        if(user == null || user.isEmpty()){
            log.info("first user");
            String new_user = username+"-"+user_ip;
            linkFileRepository.updateUser(new_user,filehash,token);
        }else{
            log.info("...");
            String new_user=user+","+username+"-"+user_ip;
            linkFileRepository.updateUser(new_user,filehash,token);
        }

        linkRepository.updateUsed(token);
    }

    public void downloadFile(String user_ip,String username,String token, String filename,String filehash,
                             HttpServletRequest request,HttpServletResponse response) {


        String path=linkFileRepository.selectPath(filehash,token);

        Path file_path = Paths.get(path);
        File file=file_path.toFile();
        if(!file.exists()){
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
        long length=file.length();
        String rangeHeader=request.getHeader("Range");
        long start=0;
        long end=length-1;
        boolean isPartial=false;

        if(StringUtils.hasText(rangeHeader)&&rangeHeader.startsWith("bytes=")){
            String[]ranges=rangeHeader.substring(6).split("-");
            try{
                start=Long.parseLong(ranges[0].trim());
                if(ranges.length>1&&!ranges[1].isEmpty()){
                    end=Long.parseLong(ranges[1].trim());
                }
                if(start>end||end>=length){
                    response.setStatus(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);

                }
                isPartial=true;
            }catch (NumberFormatException e){

            }
        }


        long contentLength=end-start+1;


        if(isPartial){
            response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
            response.setHeader("Content-Range","bytes"+start+" -"+end+"/"+length);

        }else{
            response.setStatus(HttpServletResponse.SC_OK);
        }


        response.setHeader("Accept-Ranges","bytes");
        response.setHeader("Content-Type","application/octet-stream");
        response.setHeader("Content-Length",String.valueOf(contentLength));
        response.setHeader("Content-Disposition","attachment;filename="+
                URLEncoder.encode(filename, StandardCharsets.UTF_8));



        try (RandomAccessFile raf=new RandomAccessFile(file,"r");

             OutputStream out=new BufferedOutputStream(response.getOutputStream())
        ){
            raf.seek(start);
            byte[]buffer=new byte[8192];
            int len;
            while(contentLength >0&&(len= raf.read(buffer,0,(int)Math.min(buffer.length,contentLength)))!=-1){
                out.write(buffer,0,len);
                contentLength-=len;
            }

            downloadFileDB(user_ip,username,token,filehash);



        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


    public void previewFile(String token, String filehash, String filename,
                            HttpServletRequest request, HttpServletResponse response) {

        String path = linkFileRepository.selectPath(filehash, token);
        Path filePath = Paths.get(path);
        File file = filePath.toFile();

        if (!file.exists()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        long length = file.length();
        String rangeHeader = request.getHeader("Range");
        long start = 0;
        long end = length - 1;
        boolean isPartial = false;

        if (StringUtils.hasText(rangeHeader) && rangeHeader.startsWith("bytes=")) {
            String[] ranges = rangeHeader.substring(6).split("-");
            try {
                start = Long.parseLong(ranges[0].trim());
                if (ranges.length > 1 && !ranges[1].isEmpty()) {
                    end = Long.parseLong(ranges[1].trim());
                }
                if (start <= end && end < length) {
                    isPartial = true;
                }
            } catch (NumberFormatException ignored) {}
        }

        long contentLength = end - start + 1;

        // 设置 MIME 类型（关键）
        String contentType;
        try {
            contentType = java.nio.file.Files.probeContentType(filePath);
        } catch (IOException e) {
            contentType = "application/octet-stream";
        }

        // 图片 / 视频预览必须 inline
        response.setHeader("Content-Type", contentType);
        response.setHeader("Accept-Ranges", "bytes");
        response.setHeader("Content-Length", String.valueOf(contentLength));

        if (isPartial) {
            response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
            response.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + length);
        } else {
            response.setStatus(HttpServletResponse.SC_OK);
        }

        response.setHeader("Content-Disposition",
                "inline;filename=" + URLEncoder.encode(filename, StandardCharsets.UTF_8));

        try (
                RandomAccessFile raf = new RandomAccessFile(file, "r");
                OutputStream out = new BufferedOutputStream(response.getOutputStream())
        ) {
            raf.seek(start);
            byte[] buffer = new byte[8192];
            int len;
            while (contentLength > 0 && (len = raf.read(buffer, 0,
                    (int)Math.min(buffer.length, contentLength))) != -1) {
                out.write(buffer, 0, len);
                contentLength -= len;
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
