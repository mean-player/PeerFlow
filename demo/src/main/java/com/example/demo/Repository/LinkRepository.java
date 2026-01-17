package com.example.demo.Repository;

import com.example.demo.Mapper.LinkMapper;
import com.example.demo.Model.Link;
import com.example.demo.Model.LinkQueryParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class LinkRepository {

    @Autowired
    private LinkMapper linkMapper;


    private final Map<String, Object> linkLockMap= new ConcurrentHashMap<>();

    private Object getLockForLink(String token){
        return
                linkLockMap.computeIfAbsent(token, k ->new Object());

    }

    public boolean insertLink(String token, Link link){
        Object key=getLockForLink(token);
        synchronized (key){
            return linkMapper.insertLink(link);
        }
    }


    public List<Link> selectLinkPage(LinkQueryParam linkQueryParam)
    {
        //int offset=(page-1)*pageSize;
        return linkMapper.selectLinkPage(linkQueryParam);
    }


    public List<Link> selectLinkByType(String type){
        return linkMapper.selectLinkByType(type);
    }


    public int selectLinkVerify(String token){
        return linkMapper.selectLinkVerify(token);
    }

    public Link selectLink(String token){
        Object key=getLockForLink(token);
        synchronized (key){
            return linkMapper.selectLink(token);
        }
    }


    public List<String> selectExpiredToken(Integer status){
        return linkMapper.selectExpiredToken(status);
    }

    public List<String> selectExpiredTokenByType(Integer status,String type){
        return linkMapper.selectExpiredTokenByType(status,type);
    }



    public int selectUsed(String token){
        Object key=getLockForLink(token);
        synchronized (key){
            return linkMapper.selectUsed(token);
        }
    }



    public String selectExpireTime(String token){
        return linkMapper.selectExpireTime(token);
    }

    public String selectPassword(String token){
        return linkMapper.selectPassword(token);
    }

    public String selectLinkType(String token){
        return linkMapper.selectLinkType(token);

    }
    public boolean updateStatus(int status,String token){
        Object key=getLockForLink(token);
        synchronized (key){
            return linkMapper.updateStatus(status,token);
        }
    }





    public boolean updateUsed(String token){
        Object key=getLockForLink(token);
        synchronized (key){
           return linkMapper.updateUsed(token);
        }

    }



    public boolean updateLink(Link link){
        Object key=getLockForLink(link.getToken());
        synchronized (key){
            return linkMapper.updateLink(link);
        }

    }

    public boolean deleteExpiredLink(String token){
        Object key=getLockForLink(token);
        synchronized (key){
            return linkMapper.deleteExpiredLink(token);
        }


    }

}
