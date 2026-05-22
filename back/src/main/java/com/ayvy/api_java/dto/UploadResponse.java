package com.ayvy.api_java.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UploadResponse {

    /** Caminho salvo no banco, ex.: /uploads/produtos/abc.jpg */
    private String caminho;

    /** URL para exibir no front, ex.: http://localhost:8082/uploads/produtos/abc.jpg */
    private String url;
}
