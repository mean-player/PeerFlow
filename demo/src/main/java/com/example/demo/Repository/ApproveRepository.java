package com.example.demo.Repository;

import com.example.demo.Mapper.ApproveMapper;
import com.example.demo.Model.Approve;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class ApproveRepository {


    @Autowired
    ApproveMapper approveMapper;

    private final Map<String, Object> approveLockMap= new ConcurrentHashMap<>();

    private Object getLockForApprove(String token){
        return
                approveLockMap.computeIfAbsent(token, k ->new Object());

    }

    public void insertApprove(Approve approve){
        Object key = getLockForApprove(approve.getToken());
        synchronized (key){
            approveMapper.insertApprove(approve);
            System.out.println("2");
        }
    }

    public List<Approve> selectApprove(String approve_result,Integer offset,Integer pageSize){
        return approveMapper.selectApprove(approve_result,offset,pageSize);
    }



    public boolean updateApprove_result(String approve_result,String token,String time){
        Object key = getLockForApprove(token);
        synchronized (key){
            return approveMapper.updateApprove_result(approve_result,token,time);
        }
    }

    public boolean deleteApprove(String approve_result){
        return approveMapper.deleteApprove(approve_result);
    }

}
