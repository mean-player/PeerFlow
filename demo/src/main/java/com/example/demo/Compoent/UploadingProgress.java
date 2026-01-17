package com.example.demo.Compoent;

import com.example.demo.Model.UploadedTotal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class UploadingProgress {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final ConcurrentHashMap<String, UploadedTotal> progressMap
            =new ConcurrentHashMap<>();

    public void addKV(String hash,UploadedTotal uploadedTotal){
        progressMap.put(hash,uploadedTotal);
    }


    public UploadedTotal get(String hash){
        return progressMap.get(hash);
    }

    public void remove(String hash){

        progressMap.remove(hash);
    }



    public void Inform(UploadedTotal uploadedTotal){
        messagingTemplate.convertAndSendToUser("admin","/queue/progress",uploadedTotal);

    }


    public void update(String hash,int num){
        UploadedTotal uploadedTotal = get(hash);
        uploadedTotal.setUploaded_num(num);
        System.out.println(uploadedTotal.getUploaded_num()+"-"+uploadedTotal.getTotal_num());
        Inform(uploadedTotal);


    }



}
