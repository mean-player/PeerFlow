package com.example.demo.Mapper;


import com.example.demo.Provider.ChunkProvider;
import com.example.demo.Model.Chunk;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ChunkMapper {

    @Options(useGeneratedKeys = false,keyProperty = "file_hash")
    @InsertProvider(value = ChunkProvider.class,method = "insertChunk")
    boolean insertChunk(Chunk chunk);

    @SelectProvider(value = ChunkProvider.class,method ="selectByHash")
    String selectByHash(@Param("file_hash")String file_hash);

    @SelectProvider(value = ChunkProvider.class,method ="selectUnCompleted")
    List<Chunk> selectUnCompleted(@Param("offset")Integer offset, @Param("pageSize")Integer pageSize);

    @UpdateProvider(value = ChunkProvider.class,method = "updateUploadedChunk")
    boolean updateUploadedChunk(@Param("file_hash")String file_hash,@Param("uploaded_chunks")String uploaded_chunks);

    @UpdateProvider(value = ChunkProvider.class,method = "updateChunkStatus")
    boolean updateChunkStatus(@Param("file_hash")String file_hash,@Param("status")Integer status);

    @DeleteProvider(value =ChunkProvider.class,method = "deleteSingleChunk")
    boolean deleteSingleChunk(@Param("file_hash")String file_hash);

    @DeleteProvider(value =ChunkProvider.class,method = "deleteCompletedChunk")
    boolean deleteCompletedChunk();

    @DeleteProvider(value =ChunkProvider.class,method = "deleteUnCompletedChunk")
    boolean deleteUnCompletedChunk();
}
