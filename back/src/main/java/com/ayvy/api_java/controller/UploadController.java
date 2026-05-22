package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.UploadService;
import com.ayvy.api_java.dto.UploadResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/upload")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    /**
     * Envia uma imagem e salva em back/uploads/{pasta}/.
     * Retorna o caminho para gravar no banco (imagemPrincipalUrl, bannerUrl, avatarUrl, produto_imagens.url).
     *
     * @param file  campo multipart "file"
     * @param pasta produtos | lojistas | usuarios | geral
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "pasta", defaultValue = "geral") String pasta
    ) {
        UploadResponse response = uploadService.salvarImagem(file, pasta);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
