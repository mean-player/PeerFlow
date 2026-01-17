package com.example.demo.Mapper;

import com.example.demo.Provider.LinkFileProvider;
import com.example.demo.Model.LinkFile;
import com.example.demo.Provider.LinkProvider;
import org.apache.ibatis.annotations.*;


import java.util.Collection;
import java.util.List;

@Mapper
public interface LinkFileMapper {

    @Options(useGeneratedKeys = true,keyProperty = "id")
    @InsertProvider(value = LinkFileProvider.class,method = "insertLinkFile")
    boolean insertLinkFile(LinkFile linkFile);

    @SelectProvider(value = LinkFileProvider.class,method ="selectLinkFile")
    List<LinkFile> selectLinkFile(@Param("token")String token);

    @SelectProvider(value = LinkFileProvider.class,method ="selectLinkFileByHash")
    LinkFile selectLinkFileByHash(@Param("filehash")String filehash);

    @SelectProvider(value = LinkFileProvider.class,method ="selectLinkFileByHashToken")
    LinkFile selectLinkFileByHashToken(@Param("filehash")String filehash,@Param("token")String token);

    @SelectProvider(value = LinkFileProvider.class,method ="selectPath")
    String selectPath(@Param("filehash")String filehash,@Param("token")String token);

    @SelectProvider(value = LinkFileProvider.class,method ="selectUser")
    String selectUser(@Param("filehash")String filehash,@Param("token")String token);

    @UpdateProvider(value = LinkFileProvider.class,method ="updateUser")
    boolean updateUser(@Param("user")String user,@Param("filehash")String filehash,@Param("token")String token);

    @UpdateProvider(value = LinkFileProvider.class,method ="updateStatus")
    boolean updateStatus(@Param("status")Integer status,@Param("filehash")String filehash,@Param("token")String token);

    @UpdateProvider(value = LinkFileProvider.class,method ="updateFilePath")
    boolean updateFilePath(@Param("filepath")String filepath,@Param("filehash")String filehash,@Param("token")String token);

    @DeleteProvider(value = LinkFileProvider.class,method = "deleteLinkFile")
    boolean deleteLinkFile(@Param("token")String token);

    @DeleteProvider(value = LinkFileProvider.class,method = "deleteLinkFileByHash")
    boolean deleteLinkFileByHash(@Param("filehash")String filehash);

    @DeleteProvider(value = LinkFileProvider.class,method = "deleteLinkFileByStatus")
    boolean deleteLinkFileByStatus();

    @DeleteProvider(value = LinkFileProvider.class,method = "deleteAllLinkFile")
    boolean deleteAllLinkFile();




}
