package com.example.demo.Provider;


import org.apache.ibatis.jdbc.SQL;

public class ChunkProvider {

    public String insertChunk(){

        return new SQL(){
            {
                INSERT_INTO("Chunk");
                VALUES("file_hash","#{file_hash}");
                VALUES("uploaded_chunks","#{uploaded_chunks}");
                VALUES("status","#{status}");
                VALUES("max_chunk","#{max_chunk}");


            }
        }.toString();

    }

    public String selectByHash(){

        return new SQL(){
            {
               SELECT("uploaded_chunks");
               FROM("Chunk");
               WHERE("file_hash=#{file_hash}");

            }


        }.toString();


    }


    public String selectUnCompleted(){

        SQL sql=new SQL()
                .SELECT("*")
                .FROM("Chunk")
                .WHERE("status=0");

        return sql.toString()+" LIMIT #{offset},#{pageSize}";


    }

    public String updateUploadedChunk(){
        return new SQL(){
            {
                UPDATE("Chunk");
                SET("uploaded_chunks=#{uploaded_chunks}");
                WHERE("file_hash=#{file_hash}");

            }


        }.toString();

    }




    public String updateChunkStatus(){
        return new SQL(){
            {
                UPDATE("Chunk");
                SET("status=#{status}");
                WHERE("file_hash=#{file_hash}");

            }


        }.toString();

    }

    public String deleteSingleChunk(){
        return new SQL(){
            {

                DELETE_FROM("Chunk");
                WHERE("file_hash=#{file_hash}");

            }


        }.toString();

    }

    public String deleteCompletedChunk(){
        return new SQL(){
            {

                DELETE_FROM("Chunk");
                WHERE("status=1");

            }


        }.toString();

    }


    public String deleteUnCompletedChunk(){
        return new SQL(){
            {

                DELETE_FROM("Chunk");
                WHERE("status=0");

            }


        }.toString();

    }

}
