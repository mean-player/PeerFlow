package com.example.demo.Controller;


import com.example.demo.Compoent.RequestIp;
import com.example.demo.Compoent.UploadingProgress;
import com.example.demo.Compoent.WebPermitMap;
import com.example.demo.Model.*;
import com.example.demo.Service.LinkServer;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@Slf4j
@RestController

public class LinkController {

    @Autowired
    LinkServer linkServer;

    @Autowired
    UploadingProgress uploadingProgress;

    @Autowired
    private WebPermitMap webPermitMap;











    @RequestMapping("/admin/Link/viewAll")
    public List<Link> viewLinks(@RequestBody LinkQueryParam linkQueryParam){
        log.info("{}",linkQueryParam.getSortBy());
        log.info("前端尝试查看所有状态为{} 类型为{} 的链接的信息",linkQueryParam.getStatus(),linkQueryParam.getType());
        return linkServer.viewLinks(linkQueryParam);
    }


    @RequestMapping("/admin/Link/interrupt")
    public void interruptProcess(@RequestParam("filehash") String filehash){
        log.info("中断hash为：{} 的文件的传输",filehash);
        webPermitMap.simpleRemove(filehash);
        uploadingProgress.remove(filehash);
        linkServer.interrupt(filehash);
    }



    @RequestMapping("admin/Link/view")
    public LinkResponse<ViewLink> viewLink(@RequestParam(value = "token",required = true)String token){
        log.info("访问了查看token为{}对应信息的api",token);
        LinkResponse<ViewLink>linkResponse = new LinkResponse<>();
        ViewLink viewLink = linkServer.viewLink(token);
        if(viewLink!=null){
            log.info("查看成功");
            linkResponse.setCode(200);
            linkResponse.setMessage("view link success");
            linkResponse.setData(viewLink);

        }else{
            log.error("查看失败");
            linkResponse.setCode(500);
            linkResponse.setMessage("view link failed");
            linkResponse.setData(null);

        }

        return linkResponse;

    }

    @PostMapping("/admin/Link/create")
    public LinkResponse<String> CreateLink(@RequestBody LinkCreateRequest linkCreateRequest){
        System.out.println(linkCreateRequest.getLink().getLink_desc());
        log.info("访问了创建token的api");

        String token=linkServer.CreateLink(linkCreateRequest);
        LinkResponse<String> linkResponse = new LinkResponse<>();
        if(!token.isEmpty()) {
            log.info("创建了token为：{}",token);
            linkResponse.setCode(200);
            linkResponse.setMessage("create Link success");
            linkResponse.setData(token);
            System.out.println("200");
        }else{
            log.error("创建token失败");
            linkResponse.setCode(500);
            linkResponse.setMessage("create Link failed");
            linkResponse.setData(null);

        }
        return linkResponse;

    }

    @RequestMapping("/admin/Link/changeStatus")
    public LinkResponse<String> ChangeStatus(@RequestParam String token,
                                             @RequestParam Integer status
    ){
        log.info("使token为：{}的链接status为 {}",token,status);
        LinkResponse<String> linkResponse=new LinkResponse<>();
        boolean result = linkServer.updateLinkStatus(token,status);
        if(result){
            linkResponse.setCode(200);
            linkResponse.setMessage("success");
            linkResponse.setData(null);
            log.info("改变status成功");
        }else{
            linkResponse.setCode(500);
            linkResponse.setMessage("failed");
            linkResponse.setData(null);
            log.error("改变status失败");
        }
        return linkResponse;
    }

    @RequestMapping("/admin/Link/updateLink")
    public LinkResponse<String> UpdateLink(@RequestBody Link link){

        log.info("更新了token为{}的链接",link.getToken());

        LinkResponse<String> linkResponse=new LinkResponse<>();
        boolean result = linkServer.updateLink(link);
        if(result){
            log.info("更新token为{}的链接成功",link.getToken());
            linkResponse.setCode(200);
            linkResponse.setMessage("update link success");
            linkResponse.setData(null);
        }else{
            log.error("更新token为{}的链接失败",link.getToken());
            linkResponse.setCode(500);
            linkResponse.setMessage("update link failed");
            linkResponse.setData(null);
        }
        return linkResponse;

    }


    @RequestMapping("/admin/Link/uncompletedFiles")
    public List<FileAndProgress> UncompletedFiles(@RequestParam(value = "offset",required = true)int offset){
        log.info("用户尝试访问未完成上传文件列表");
        List<FileAndProgress> fileAndProgresses = linkServer.UncompletedFiles(offset);
        log.info("读取了{}个尚未完成的上传文件列表",fileAndProgresses.size());
        return fileAndProgresses;

    }

    @RequestMapping("/admin/Link/Approves")
    public List<Approve> viewApproves(@RequestParam(value = "offset",required = true)int offset,
                                      @RequestParam(value = "approveResult",required = true)String approveResult){
        if(!List.of("approve","reject","none").contains(approveResult)){
            return null ;
        }

        List<Approve> approves = linkServer.viewApproves(offset,approveResult);

        log.info("用户查看了{}条审核情况",approves.size());
        return approves;

    }

    @RequestMapping("/admin/Link/cleanInvaluable")
    public LinkResponse<String> cleanInvaluable(@RequestParam(value = "type",required = true)String type){
        log.info("尝试清除{}所有过期或无效的链接",type);

        LinkResponse<String> linkResponse=new LinkResponse<>();
        linkServer.deleteExpiredLink(type);

        log.info("清楚所有过期或无效的链接成功");
        linkResponse.setCode(200);
        linkResponse.setMessage("clean invaluable links success");
        linkResponse.setData(null);


        return linkResponse;

    }


    @RequestMapping("admin/Link/fresh")
    public LinkResponse<String> updateExpiredStatus(){
        log.info("尝试更新所有链接的可用状态");

        LinkResponse<String> linkResponse=new LinkResponse<>();
        boolean result = linkServer.updateExpiredLinkStatus();
        if(result){
            log.info("更新所有链接的可用状态成功");
            linkResponse.setCode(200);
            linkResponse.setMessage("fresh links success");
            linkResponse.setData(null);
        }else{
            log.error("更新所有链接的可用状态失败");
            linkResponse.setCode(500);
            linkResponse.setMessage("fresh links failed");
            linkResponse.setData(null);
        }
        return linkResponse;
    }


    @RequestMapping("admin/Link/deleteSingleUnCompleted")
    public void deleteSingleUncompleted(@RequestParam(value = "token",required = true)String token,
                                        @RequestParam(value = "filehash",required = true)String filehash){
        log.info("用户删除了单个未完成的进度，token：{} hash：{}",token,filehash);
        linkServer.deleteSingleUncompleted(token,filehash);
    }

    @RequestMapping("admin/Link/deleteAllUnCompleted")
    public void deleteSingleUncompleted(){
        log.info("用户删除了所有未完成的进度");
        linkServer.deleteAllUncompleted();
    }

    @RequestMapping("admin/Link/deleteAllLinkFile")
    public void deleteAllLinkFile(){
        log.info("用户删除了所有link file");
        linkServer.deleteAllLinkFile();
    }

    @RequestMapping("admin/Link/deleteApprove")
    public boolean deleteApprove(@RequestParam(value = "approve_result",required = true)String approve_result){
        log.info("用户尝试删除审核结果为{}的审核历史",approve_result);
        boolean deleteResult=linkServer.deleteApprove(approve_result);
        if(deleteResult){
            log.info("删除approve成功");
        }else{
            log.error("删除approve失败");
        }
        return deleteResult;
    }







}
