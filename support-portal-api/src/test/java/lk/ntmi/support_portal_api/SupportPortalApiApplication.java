package lk.ntmi.support_portal_api;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class SupportPortalApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SupportPortalApiApplication.class, args);
    }

    // --- ADD THIS BEAN ---
    @Bean
    public CommandLineRunner run() {
        return args -> {
            PasswordEncoder encoder = new BCryptPasswordEncoder();
            String rawPassword = "admin123";
            String encodedPassword = encoder.encode(rawPassword);
            
            System.out.println("==========================================");
            System.out.println("   GENERATED VALID HASH FOR 'admin123'");
            System.out.println("   " + encodedPassword);
            System.out.println("==========================================");
        };
    }
}