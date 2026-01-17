package com.example.demo.Provider;

import org.apache.ibatis.jdbc.SQL;

public class LinkFileProvider {

    public String insertLinkFile(){

        return new SQL(){
            {
                INSERT_INTO("LinkFile");
                VALUES("token","#{token}");
                VALUES("filename","#{filename}");
                VALUES("filepath","#{filepath}");
                VALUES("filesize","#{filesize}");
                VALUES("type","#{type}");
                VALUES("user","#{user}");
                VALUES("filehash","#{filehash}");
                VALUES("status","#{status}");

            }
        }.toString();

    }




    public String selectLinkFile(){

        return new SQL(){
            {
                SELECT("*");
                FROM("LinkFile");
                WHERE("token=#{token}");
                WHERE("status=1");

            }
        }.toString();

    }

    public String selectLinkFileByHash(){
        return new SQL(){
            {
                SELECT("*");
                FROM("LinkFile");
                WHERE("filehash=#{filehash}");
            }
        }.toString() + " LIMIT 1";
    }

    public String selectLinkFileByHashToken(){

        return new SQL(){
            {
                SELECT("*");
                FROM("LinkFile");
                WHERE("filehash=#{filehash}");
                WHERE("token=#{token}");

            }
        }.toString();

    }



    public String selectPath(){

        return new SQL(){
            {
                SELECT("filepath");
                FROM("LinkFile");
                WHERE("filehash=#{filehash}");
                WHERE("token=#{token}");


            }
        }.toString();

    }



    public String selectUser(){

        return new SQL(){
            {
                SELECT("user");
                FROM("LinkFile");
                WHERE("filehash=#{filehash}");
                WHERE("token=#{token}");


            }
        }.toString();

    }


    public String updateUser(){

        return new SQL(){
            {
               UPDATE("LinkFile");
               SET("user = #{user}");
               WHERE("filehash=#{filehash}");
               WHERE("token=#{token}");


            }
        }.toString();
    }


    public String updateStatus(){

        return new SQL(){
            {
                UPDATE("LinkFile");
                SET("status = #{status}");
                WHERE("filehash=#{filehash}");
                WHERE("token=#{token}");


            }
        }.toString();
    }


    public String updateFilePath(){

        return new SQL(){
            {
                UPDATE("LinkFile");
                SET("filepath = #{filepath}");
                WHERE("filehash=#{filehash}");
                WHERE("token=#{token}");


            }
        }.toString();
    }





    public String deleteLinkFile(){
        return new SQL(){
            {

                DELETE_FROM("LinkFile");
                WHERE("token=#{token}");

            }


        }.toString();

    }


    public String deleteLinkFileByHash(){
        return new SQL(){
            {

                DELETE_FROM("LinkFile");
                WHERE("filehash=#{filehash}");

            }


        }.toString();

    }

    public String deleteLinkFileByStatus(){
        return new SQL(){
            {

                DELETE_FROM("LinkFile");
                WHERE("status=0");

            }


        }.toString();

    }

    public String deleteAllLinkFile(){
        return new SQL(){
            {

                DELETE_FROM("LinkFile");


            }


        }.toString();

    }


}
