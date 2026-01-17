package com.example.demo.Compoent;

import com.example.demo.Repository.ChunkRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;


@Slf4j
@Component
public class ChunkCacheManager {

    @Autowired
    private ChunkRepository chunkRepository;

    @Autowired
    private UploadingProgress uploadingProgress;



    private static final int FLUSH_THRESHOLD = 7;

    private final Map<String, Set<Integer>> chunkMap = new ConcurrentHashMap<>();

    private Set<Integer>getInteger(String uploaded_chunk){
        if(uploaded_chunk.isEmpty()){
            return null;
        }
        return Arrays.stream(uploaded_chunk.split(","))
                .map(String::trim)
                .filter( s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toSet());
    }



    public void addChunk(String file_hash, int chunk_num) {
        // 获取或初始化 set
        chunkMap.computeIfAbsent(file_hash, k -> ConcurrentHashMap.newKeySet())
                .add(chunk_num);

        // 检查是否需要刷新数据库
        Set<Integer> chunkSet = chunkMap.get(file_hash);
        if (chunkSet.size() >= FLUSH_THRESHOLD) {

            flushToDatabase(file_hash, chunkSet);
        }
    }


    public void flushDB(String file_hash){
        Set<Integer> chunkSet = chunkMap.get(file_hash);
        flushToDatabase(file_hash, chunkSet);
    }



    private void flushToDatabase(String file_hash, Set<Integer> chunkSet) {



        if(chunkSet == null){
            return;
        }
        String uploaded_chunk = chunkRepository.selectByHash(file_hash);
        Set<Integer>uploaded_set = getInteger(uploaded_chunk);
        Set<Integer> flushedChunks;
        int uploaded_size = uploaded_set.size();

        synchronized (chunkSet) {
            flushedChunks = new HashSet<>(chunkSet);// 拷贝一份要保存的
            flushedChunks.addAll(uploaded_set);
            chunkSet.clear();                         // 清空缓存
        }

        String new_uploaded_chunk = flushedChunks.stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        // 刷新数据库
        chunkRepository.updateUploadedChunk(file_hash, new_uploaded_chunk);

        uploadingProgress.update(file_hash,chunkSet.size()+uploaded_size);

        String result = chunkSet.stream()
                        .sorted()
                        .map(Object::toString).collect(Collectors.joining(", "));
    }


}
