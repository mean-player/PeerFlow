package com.example.demo.Provider;

import com.example.demo.Model.LinkQueryParam;
import org.apache.ibatis.javassist.runtime.Desc;
import org.apache.ibatis.jdbc.SQL;

import java.util.Map;

public class LinkProvider {

    public String insertLink(){

        return new SQL(){
            {
                INSERT_INTO("Link");
                VALUES("token","#{token}");
                VALUES("type","#{type}");
                VALUES("verify","#{verify}");
                VALUES("create_time","#{create_time}");
                VALUES("expire_time","#{expire_time}");
                VALUES("status","#{status}");
                VALUES("password","#{password}");
                VALUES("link_desc","#{link_desc}");
                VALUES("used","#{used}");


            }
        }.toString();

    }


    public String selectLinkPage(LinkQueryParam param){

        SQL sql=new SQL()
                .SELECT("*")
                .FROM("Link");

        if(param.getStatus()!=null){
            sql.WHERE("status=#{status}");
        }
        if(param.getType()!=null){
            sql.WHERE("type=#{type}");
        }
        if(param.getSortBy().equals("create")) {
            sql.ORDER_BY("expire_time ASC");
        }else{
            sql.ORDER_BY("create_time DESC");
        }

        return sql.toString()+" LIMIT #{offset},#{pageSize}";


    }

    public String selectLink(){

        return new SQL(){
            {
                SELECT("*");
                FROM("Link");
                WHERE("token=#{token}");

            }


        }.toString();


    }



    public String selectExpiredToken(){

        return new SQL(){
            {
                SELECT("token");
                FROM("Link");
                WHERE("status=#{status}");


            }


        }.toString();


    }


    public String selectExpiredTokenByType(){

        return new SQL(){
            {
                SELECT("token");
                FROM("Link");
                WHERE("status=#{status}");
                WHERE("type=#{type}");

            }


        }.toString();


    }



    public String selectLinkVerify(){

        return new SQL(){
            {
                SELECT("verify");
                FROM("Link");
                WHERE("token=#{token}");

            }


        }.toString();


    }


    public String selectLinkByType(){

        return new SQL(){
            {
                SELECT("*");
                FROM("Link");
                WHERE("type=#{type}");

            }


        }.toString();


    }





    public String selectUsed(){

        return new SQL(){
            {
                SELECT("used");
                FROM("Link");
                WHERE("token=#{token}");

            }


        }.toString();


    }

    public String selectExpireTime(){

        return new SQL(){
            {
                SELECT("expire_time");
                FROM("Link");
                WHERE("token=#{token}");
                WHERE("status=1");

            }


        }.toString();


    }



    public String selectPassword(){

        return new SQL(){
            {
                SELECT("password");
                FROM("Link");
                WHERE("token=#{token}");
            }


        }.toString();


    }


    public String selectLinkType(){

        return new SQL(){
            {
                SELECT("type");
                FROM("Link");
                WHERE("token=#{token}");
            }


        }.toString();


    }





    public String updateStatus(){
        return new SQL(){
            {
                UPDATE("Link");
                SET("status=#{status}");
                WHERE("token=#{token}");

            }


        }.toString();

    }




    public String updateUsed(){
        return new SQL(){
            {
                UPDATE("Link");
                SET("used=used+1");
                WHERE("token=#{token}");

            }


        }.toString();

    }



    public String updateLink(){
        return new SQL(){
            {
                UPDATE("Link");
                SET("verify=#{verify}");
                SET("password=#{password}");
                SET("expire_time=#{expire_time}");
                SET("status=1");
                SET("link_desc=#{link_desc}");
                WHERE("token=#{token}");

            }


        }.toString();

    }

    public String deleteLink(){
        return new SQL(){
            {

                DELETE_FROM("Link");
                WHERE("token=#{token}");

            }


        }.toString();

    }






















}
