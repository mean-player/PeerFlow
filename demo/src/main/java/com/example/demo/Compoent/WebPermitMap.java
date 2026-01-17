package com.example.demo.Compoent;


import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Component

public class WebPermitMap {
    private final ConcurrentHashMap<String, String>permitHashMap
            =new ConcurrentHashMap<>();

    public void add(String hash,String permitCode){
        permitHashMap.put(hash,permitCode);
    }


    public String get(String hash){
        return permitHashMap.get(hash);
    }

    public void remove(String hash,String permitCode){

        permitHashMap.remove(hash,permitCode);
    }

    public  void simpleRemove(String hash){
        permitHashMap.remove(hash);
    }






}
