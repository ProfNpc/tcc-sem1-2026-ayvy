package br.belval.com.ayvy;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
 
@Configuration
public class CorsConfig implements WebMvcConfigurer {
	
	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
			.allowedOrigins("http://localhost:8080")
			.allowedMethods("GET","POST","PUT","DELETE","OPTIONS","PATCH")
			.allowedHeaders("*");
	}
	
 
}
<<<<<<< HEAD
 
=======
	

>>>>>>> 2c217c4255fb349b828cddaf9dc6ed6c309e6926
