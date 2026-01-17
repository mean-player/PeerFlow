package com.example.demo.Provider;

import com.example.demo.Model.LinkQueryParam;
import org.apache.ibatis.jdbc.SQL;

public class ApproveProvider {

    public String insertApprove(){

        return new SQL(){
            {
                INSERT_INTO("Approve");
                VALUES("id","#{id}");
                VALUES("token","#{token}");
                VALUES("fileInfo","#{fileInfo}");
                VALUES("time","#{time}");
                VALUES("sender","#{sender}");
                VALUES("approve_result","#{approve_result}");
            }
        }.toString();

    }


    public String selectApprovePage(){

        SQL sql=new SQL()
                .SELECT("*")
                .FROM("Approve")
                .WHERE("approve_result=#{approve_result}");
        sql.ORDER_BY("time DESC");

        return sql.toString()+" LIMIT #{offset},#{pageSize}";

    }



    public String updateApprove_result(){
        return new SQL(){
            {
                UPDATE("Approve");
                SET("approve_result=#{approve_result}");
                WHERE("token=#{token}");
                WHERE("time=#{time}");

            }
        }.toString();

    }







    public String deleteApprove() {
        return new SQL() {{
            DELETE_FROM("Approve");
            WHERE("approve_result = #{approve_result}");
        }}.toString();
    }























}
