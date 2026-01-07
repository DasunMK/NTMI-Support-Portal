package lk.ntmi.support_portal_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map URL "/uploads/**" to physical path "C:/NTMI_Data/Uploads/"
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:C:/NTMI_Data/Uploads/");
    }
}