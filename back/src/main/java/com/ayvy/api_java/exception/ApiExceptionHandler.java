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
        String message = "Violação de integridade dos dados (e-mail, CPF, CNPJ ou slug já existente)";
        if (ex.getMessage() != null && ex.getMessage().contains("email")) {
            message = "E-mail já cadastrado";
        }
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
    }
}
