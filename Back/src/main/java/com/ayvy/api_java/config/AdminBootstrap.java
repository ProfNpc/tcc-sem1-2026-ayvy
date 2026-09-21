package com.ayvy.api_java.config;

import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Garante um admin de desenvolvimento se o banco estiver sem administradores.
 * Login: admin@ayvy.com.br / admin123
 */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    private static final String ADMIN_EMAIL = "admin@ayvy.com.br";
    private static final String ADMIN_PASSWORD = "admin123";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrap(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean hasAdmin = usuarioRepository.findAll().stream()
                .anyMatch(u -> u.getPapel() == PapelUsuario.admin);
        if (hasAdmin) {
            return;
        }

        Usuario admin = Usuario.builder()
                .papel(PapelUsuario.admin)
                .nome("Administrador AYVY")
                .email(ADMIN_EMAIL)
                .senha(passwordEncoder.encode(ADMIN_PASSWORD))
                .status(StatusUsuario.ativo)
                .build();
        usuarioRepository.saveAndFlush(admin);
        log.info("Admin bootstrap criado: {} / {}", ADMIN_EMAIL, ADMIN_PASSWORD);
    }
}
