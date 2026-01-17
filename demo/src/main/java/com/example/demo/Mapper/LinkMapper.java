package com.example.demo.Mapper;

import com.example.demo.Model.LinkQueryParam;
import com.example.demo.Provider.LinkProvider;
import com.example.demo.Model.Link;
import org.apache.ibatis.annotations.*;

import java.util.Collection;
import java.util.List;
@Mapper
public interface LinkMapper {

    @Options(useGeneratedKeys = true,keyProperty = "id")
    @InsertProvider(value = LinkProvider.class,method = "insertLink")
    boolean insertLink(Link link);


    @SelectProvider(value = LinkProvider.class,method ="selectLinkPage")
    List<Link> selectLinkPage(LinkQueryParam linkQueryParam);

    @SelectProvider(value = LinkProvider.class,method ="selectLink")
    Link selectLink(@Param("token")String token);

    @SelectProvider(value = LinkProvider.class,method ="selectExpiredToken")
    List<String> selectExpiredToken(@Param("status")Integer status);

    @SelectProvider(value = LinkProvider.class,method ="selectExpiredTokenByType")
    List<String> selectExpiredTokenByType(@Param("status")Integer status,@Param("type")String type);


    @SelectProvider(value = LinkProvider.class,method ="selectLinkVerify")
    Integer selectLinkVerify(@Param("token")String token);

    @SelectProvider(value = LinkProvider.class,method ="selectLinkByType")
    List<Link> selectLinkByType(@Param("type")String type);

    @SelectProvider(value = LinkProvider.class,method ="selectExpireTime")
    String selectExpireTime(@Param("token")String token);

    @SelectProvider(value = LinkProvider.class,method ="selectPassword")
    String selectPassword(@Param("token")String token);

    @SelectProvider(value = LinkProvider.class,method ="selectLinkType")
    String selectLinkType(@Param("token")String token);




    @SelectProvider(value = LinkProvider.class,method ="selectUsed")
    Integer selectUsed(@Param("token")String token);

    @UpdateProvider(value = LinkProvider.class,method = "updateStatus")
    boolean updateStatus(@Param("status")Integer status,@Param("token")String token);


    @UpdateProvider(value = LinkProvider.class,method = "updateUsed")
    boolean updateUsed(@Param("token")String token);


    @UpdateProvider(value = LinkProvider.class,method = "updateLink")
    boolean updateLink(Link link);

    @DeleteProvider(value = LinkProvider.class,method = "deleteLink")
    boolean deleteExpiredLink(@Param("token")String token);








}
