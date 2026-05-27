package com.ayvy.api_java.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(ex.getStatusCode(), ex.getReason());
        detail.setTitle(ex.getStatusCode().toString());
        return detail;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        String raw = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();
        String message = "Violação de integridade dos dados";

        if (raw != null) {
            String lower = raw.toLowerCase();
            if (lower.contains("email") || lower.contains("uk_usuarios_email")) {
                message = "E-mail já cadastrado";
            } else if (lower.contains("cpf") || lower.contains("uk_clientes_cpf")) {
                message = "CPF já cadastrado";
            } else if (lower.contains("cnpj") || lower.contains("uk_lojistas_cnpj")) {
                message = "CNPJ já cadastrado";
            } else if (lower.contains("uk_produtos_lojista_slug")) {
                message = "Já existe um produto com este slug nesta loja";
            } else if (lower.contains("uk_lojistas_slug")) {
                message = "Slug da loja já existe";
            } else if (lower.contains("visualizacoestotal") || lower.contains("visualizacoes_total")) {
                message = "Erro ao salvar produto: contador de visualizações inválido. Reinicie a API e tente novamente.";
            } else if (lower.contains("not-null") && lower.contains("lojista")) {
                message = "Loja (lojista) é obrigatória para o produto";
            } else if (lower.contains("duplicate") || lower.contains("unique")) {
                message = "Registro duplicado (e-mail, CPF, CNPJ ou slug já existente)";
            }
        }

        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
    }
}
