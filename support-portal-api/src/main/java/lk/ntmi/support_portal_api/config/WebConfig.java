package lk.ntmi.support_portal_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map http://localhost:8080/uploads/filename.jpg -> to project_root/uploads/filename.jpg
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}