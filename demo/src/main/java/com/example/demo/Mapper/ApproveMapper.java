package com.example.demo.Mapper;

import com.example.demo.Model.Approve;
import com.example.demo.Provider.ApproveProvider;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ApproveMapper {

    @Options(useGeneratedKeys = true,keyProperty = "id")
    @InsertProvider(value = ApproveProvider.class,method = "insertApprove")
    boolean insertApprove(Approve approve);

    @SelectProvider(value = ApproveProvider.class,method ="selectApprovePage")
    List<Approve> selectApprove(@Param("approve_result")String approve_result,@Param("offset")Integer offset, @Param("pageSize")Integer pageSize);

    @UpdateProvider(value = ApproveProvider.class,method = "updateApprove_result")
    boolean updateApprove_result(@Param("approve_result")String approve_result,
                                 @Param("token")String token,
                                 @Param("time")String time
                                 );

    @DeleteProvider(value = ApproveProvider.class,method = "deleteApprove")
    boolean deleteApprove(@Param("approve_result")String approve_result);



}
