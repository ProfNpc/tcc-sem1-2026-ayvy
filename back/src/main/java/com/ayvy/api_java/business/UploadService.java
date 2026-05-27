package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.UploadResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class UploadService {

    private static final Set<String> PASTAS_PERMITIDAS = Set.of(
            "produtos", "lojistas", "usuarios", "geral"
    );

    private static final Set<String> CONTENT_TYPES_PERMITIDOS = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    @Value("${ayvy.upload.dir:uploads}")
    private String uploadDir;

    @Value("${server.port:8082}")
    private int serverPort;

    private Path basePath;

    @PostConstruct
    void init() throws IOException {
        basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        for (String pasta : PASTAS_PERMITIDAS) {
            Files.createDirectories(basePath.resolve(pasta));
        }
    }

    public UploadResponse salvarImagem(MultipartFile file, String pasta) {
        validarArquivo(file);
        String pastaSegura = normalizarPasta(pasta);

        String extensao = extrairExtensao(file.getOriginalFilename());
        String nomeArquivo = UUID.randomUUID() + extensao;

        Path destino = basePath.resolve(pastaSegura).resolve(nomeArquivo);
        try {
            Files.copy(file.getInputStream(), destino);
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível salvar a imagem"
            );
        }

        String caminho = "/uploads/" + pastaSegura + "/" + nomeArquivo;
        String url = "http://localhost:" + serverPort + caminho;
        return new UploadResponse(caminho, url);
    }

    public Path resolverCaminhoFisico(String caminhoRelativo) {
        if (caminhoRelativo == null || caminhoRelativo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caminho da imagem é obrigatório");
        }
        String normalizado = caminhoRelativo.startsWith("/") ? caminhoRelativo.substring(1) : caminhoRelativo;
        if (!normalizado.startsWith("uploads/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caminho deve começar com /uploads/");
        }
        Path fisico = basePath.resolve(normalizado.substring("uploads/".length())).normalize();
        if (!fisico.startsWith(basePath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caminho de imagem inválido");
        }
        return fisico;
    }

    private void validarArquivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo de imagem é obrigatório");
        }
        String contentType = file.getContentType();
        if (contentType == null || !CONTENT_TYPES_PERMITIDOS.contains(contentType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Formato não permitido. Use JPEG, PNG, WebP ou GIF"
            );
        }
    }

    private String normalizarPasta(String pasta) {
        if (pasta == null || pasta.isBlank()) {
            return "geral";
        }
        String p = pasta.toLowerCase().trim().replaceAll("[^a-z0-9_-]", "");
        if (!PASTAS_PERMITIDAS.contains(p)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pasta inválida. Use: produtos, lojistas, usuarios ou geral"
            );
        }
        return p;
    }

    private String extrairExtensao(String nomeOriginal) {
        if (nomeOriginal == null || !nomeOriginal.contains(".")) {
            return ".jpg";
        }
        String ext = nomeOriginal.substring(nomeOriginal.lastIndexOf('.')).toLowerCase();
        return switch (ext) {
            case ".jpg", ".jpeg", ".png", ".webp", ".gif" -> ext.equals(".jpeg") ? ".jpg" : ext;
            default -> ".jpg";
        };
    }
}
