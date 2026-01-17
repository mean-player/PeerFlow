package com.example.demo.Config;

import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Component
public class PasswordUtil {


    @Value("${PasswordKEY}")
    private String KEY;// 保存在配置文件

    private static final String ALGORITHM = "AES";

    // 加密
    public String encrypt(String password) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(KEY.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(password.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes); // 输出可传输字符串
        } catch (Exception e) {
            throw new RuntimeException("AES加密失败", e);
        }
    }

    // 解密
    public String decrypt(String encryptedText) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(KEY.getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
            return new String(decryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("AES解密失败", e);
        }
    }


    public boolean matches(String inputPassword, String encryptedPasswordFromDB) {
        String encryptedInput = encrypt(inputPassword);
        return encryptedInput.equals(encryptedPasswordFromDB);
    }

}