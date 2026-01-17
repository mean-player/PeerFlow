package com.example.demo.Repository;

import com.example.demo.Mapper.ChunkMapper;
import com.example.demo.Model.Chunk;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class ChunkRepository {

    @Autowired
    private ChunkMapper chunkMapper;

    private Set<Integer>getInteger(String uploaded_chunks){
        return Arrays.stream(uploaded_chunks.split(","))
                .map(String::trim)
                .filter( s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toSet());
    }

    private final Map<String, Object> chunkLockMap= new ConcurrentHashMap<>();

    private Object getLockForFile(String file_hash){
        return
                chunkLockMap.computeIfAbsent(file_hash, k ->new Object());

    }

    public String selectByHash(String file_hash){
        Object key=getLockForFile(file_hash);
        synchronized (key) {
            return chunkMapper.selectByHash(file_hash);
        }
    }

    public List<Chunk> selectUnCompleted(int offset){
    return chunkMapper.selectUnCompleted(offset,10);

    }

    public void insertChunk(Chunk chunk,String file_hash){
        Object key=getLockForFile(file_hash);
        synchronized (key){
            chunkMapper.insertChunk(chunk);
        }
    }

    public void updateUploadedChunk(String file_hash,String new_uploaded_chunk){
        Object key=getLockForFile(file_hash);

        synchronized (key){

            chunkMapper.updateUploadedChunk(file_hash,new_uploaded_chunk);

        }
    }

    public void updateChunkStatus(String file_hash,int status){
        Object key=getLockForFile(file_hash);
        synchronized (key){
            chunkMapper.updateChunkStatus(file_hash,status);
        }

    }

    public void deleteSingleChunk(String file_hash){
        Object key=getLockForFile(file_hash);
        synchronized (key) {
            chunkMapper.deleteSingleChunk(file_hash);
        }
    }

    public void deleteCompletedChunk(){
        chunkMapper.deleteCompletedChunk();
    }

    public void deleteUnCompletedChunk(){
        chunkMapper.deleteUnCompletedChunk();
    }


}
