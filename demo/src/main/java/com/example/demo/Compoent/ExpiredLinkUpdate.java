package com.example.demo.Compoent;

import com.example.demo.Service.LinkServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExpiredLinkUpdate {

    @Autowired
    private LinkServer linkServer;

    @Scheduled(initialDelay = 0, fixedRate = 10*60*1000)
    public void expiredUpdate(){

        linkServer.updateExpiredLinkStatus();


    }
}
