package com.example.demo.Service;


import com.example.demo.Compoent.ChunkCacheManager;

import com.example.demo.Compoent.WebPermitMap;
import com.example.demo.Model.Chunk;
import com.example.demo.Model.LinkFile;
import com.example.demo.Repository.ChunkRepository;
import com.example.demo.Repository.LinkFileRepository;
import com.example.demo.Repository.LinkRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UploadServer {

    @Value("${file.temp}")
    private String temp_path;

    @Value("${file.final}")
    private String final_path;


    @Autowired
    private ChunkRepository chunkRepository;

    @Autowired
    private LinkRepository linkRepository;

    @Autowired
    private LinkFileRepository linkFileRepository;

    @Autowired
    private WebPermitMap webPermitMap;

    @Autowired
    private ChunkCacheManager chunkCacheManager;






    private Set<Integer>getInteger(String uploaded_chunks){
        return Arrays.stream(uploaded_chunks.split(","))
                .map(String::trim)
                .filter( s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toSet());
    }


    public LinkFile registerLinkFile(String token,String final_name,String type,Long size,
                                 String username,String new_user_ip,String filehash){

        if(linkFileRepository.selectLinkFileByHashToken(filehash,token) != null ){
            return linkFileRepository.selectLinkFileByHashToken(filehash,token);
        }
        LinkFile linkFile=new LinkFile();
        linkFile.setToken(token);
        linkFile.setFilename(final_name);
        linkFile.setFilepath(null);
        linkFile.setType(type);
        linkFile.setFilesize(size);
        linkFile.setUser(username+"-"+new_user_ip);
        linkFile.setFilehash(filehash);
        linkFile.setStatus(0);
        linkFileRepository.insertLinkFile(linkFile);
        return linkFile;

    }

    public Set<Integer>beforeUpload(String file_hash,int max_chunk){
        Set<Integer> missing=new HashSet<>();

        String uploaded_chunk = chunkRepository.selectByHash(file_hash);
        log.info("{}",uploaded_chunk);
        if(uploaded_chunk == null || uploaded_chunk.trim().isEmpty()){

            log.info("type-1");
            return missing;
        }else {
            Set<Integer> chunkSet = getInteger(uploaded_chunk);
            for (int i = 0; i <max_chunk; i++) {
                if (!chunkSet.contains(i)) {
                    missing.add(i);
                }
            }
            log.info("type-2");
            return missing;
        }


    }


    public void afterUpload(String file_hash){

        chunkCacheManager.flushDB(file_hash);
    }


    public Set<Integer>CheckMissing(String file_hash,int max_chunk){
        Set<Integer> missing=new HashSet<>();

            String uploaded_chunk = chunkRepository.selectByHash(file_hash);
            if(uploaded_chunk == null || uploaded_chunk.trim().isEmpty()){
                log.error("严重错误，此文件此前上传全部失败");
                for (int i = 0; i < max_chunk; i++) {
                        missing.add(i);
                }

            }else {
                Set<Integer> chunkSet = getInteger(uploaded_chunk);

                for (int i = 0; i < max_chunk; i++) {
                    if (!chunkSet.contains(i)) {
                        missing.add(i);
                    }
                }
            }
            return missing;

    }

    @Transactional
    private void SolveFileDB(String file_hash,int chunk_num,int max_chunk){
        String uploaded_chunk = chunkRepository.selectByHash(file_hash);
        if (uploaded_chunk == null) {
            Chunk chunk = new Chunk();
            chunk.setFile_hash(file_hash);
            chunk.setUploaded_chunks(String.valueOf(chunk_num));
            chunk.setStatus(0);
            chunk.setMax_chunk(max_chunk);
            chunkRepository.insertChunk(chunk,file_hash);

        }else {

            chunkCacheManager.addChunk(file_hash, chunk_num);
        }

    }

    public boolean SolveFile(String file_hash, int chunk_num, int max_chunk,MultipartFile file) throws IOException {

        Path temp_Dir=Paths.get(temp_path);

        Path chunkDir= temp_Dir.resolve(file_hash);
        Files.createDirectories(chunkDir);

        Path chunkPath=chunkDir.resolve("chunk_"+chunk_num);
        try {
            file.transferTo(chunkPath.toFile());
            SolveFileDB(file_hash,chunk_num,max_chunk);
            return true;
        }catch (IOException e){
            e.printStackTrace();
            log.error("块号{}存储失败",chunk_num);
            return false;
        }


    }


    @Transactional
    private void mergeDB(String filehash,String token,String final_path ){

        chunkRepository.updateChunkStatus(filehash,1);
        chunkRepository.deleteSingleChunk(filehash);

        linkFileRepository.updateStatus(1,filehash,token);
        linkFileRepository.updateFilePath(final_path,filehash,token);
        linkRepository.updateUsed(token);



    }


    public void mergeChunks(String token, String filehash,String permitCode,
                            String final_name,int max_chunk){

        Path temp_Dir=Paths.get(temp_path);

        Path chunkDir= temp_Dir.resolve(filehash);

        String link_desc = linkRepository.selectLink(token).getLink_desc();

        File final_dir = new File(final_path,link_desc);
        if(!final_dir.exists()){
            synchronized (token){
                final_dir.mkdirs();
            }
        }
        // 1. 拆分文件名和扩展名
        String baseName;
        String extension = "";

        int dotIndex = final_name.lastIndexOf('.');
        if (dotIndex != -1) {
            baseName = final_name.substring(0, dotIndex);
            extension = final_name.substring(dotIndex); // 包含 "."
        } else {
            baseName = final_name;
        }

        // 2. 尝试循环创建不重复文件
        int count = 0;
        String NEW_NAME="";
        while (true) {
            NEW_NAME = (count == 0) ? final_name : baseName + "(" + count + ")" + extension;
            Path path = Paths.get(final_path,link_desc,NEW_NAME);
            if(!Files.exists(path)){
                break;
            }
            count++;
            if (count > 100) {
                log.error("error");
                break;
            }
        }


        Path finalPath=Paths.get(final_path,link_desc,NEW_NAME);
        try(OutputStream os=Files.newOutputStream(finalPath, StandardOpenOption.CREATE,StandardOpenOption.TRUNCATE_EXISTING)){
            for(int i=0;i<max_chunk;i++){

                Path  chunkFile=chunkDir.resolve("chunk_"+i);
                if(!Files.exists(chunkFile)) {
                //throw new IOException("file missing!");
                    System.out.println("file missing! chunk_"+i);

                }

                try (InputStream in = Files.newInputStream(chunkFile)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = in.read(buffer)) != -1) {
                        os.write(buffer, 0, bytesRead);
                    }
                }
            }

            webPermitMap.remove(filehash,permitCode);


            Files.walk(chunkDir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);



            mergeDB(filehash,token,finalPath.toString());


        }catch (IOException e){
            e.printStackTrace();
        }


    }



}
