package com.ayvy.api_java;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ponto de entrada da API Spring Boot (porta 8082, ver application.properties).
 * Ao subir, os bootstraps de config/ preparam dados (admin, seed, categorias, códigos, imagens).
 */
@SpringBootApplication
public class ApiJavaApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiJavaApplication.class, args);
	}

}
