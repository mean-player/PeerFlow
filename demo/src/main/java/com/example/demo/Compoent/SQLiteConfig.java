package com.example.demo.Compoent;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SQLiteConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        jdbcTemplate.execute("PRAGMA journal_mode = WAL;");
        jdbcTemplate.execute("PRAGMA busy_timeout = 5000;");
        System.out.println("SQLite configured: WAL mode + busy_timeout=5000ms");
    }
}