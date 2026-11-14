package com.ayvy.api_java.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Transforma erros em JSON padrão { "detail": "mensagem" }.
 * Violação de banco → 409, agora com a CAUSA REAL (coluna / constraint) no detail e no log do Spring.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    // SQL Server: "Cannot insert the value NULL into column 'favoritos_id', table 'ayvy.dbo.produtos'; ..."
    private static final Pattern COLUNA_NULL = Pattern.compile(
            "cannot insert the value null into column '([^']+)', table '([^']+)'", Pattern.CASE_INSENSITIVE);
    // SQL Server: "...conflicted with the FOREIGN KEY constraint "FK_x". The conflict occurred in database "ayvy", table "dbo.lojistas", column 'id'."
    private static final Pattern FK = Pattern.compile(
            "foreign key constraint \"([^\"]+)\".*?table \"([^\"]+)\"", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern CHECK = Pattern.compile(
            "check constraint \"([^\"]+)\"", Pattern.CASE_INSENSITIVE);

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

        // Sempre registra a causa real no console do Spring (era isso que estava escondido).
        log.warn("Violação de integridade: {}", raw);

        String message = "Violação de integridade dos dados";

        if (raw != null) {
            String lower = raw.toLowerCase();
            Matcher nulo = COLUNA_NULL.matcher(raw);
            Matcher fk = FK.matcher(raw);
            Matcher check = CHECK.matcher(raw);

            if (nulo.find()) {
                message = "Campo obrigatório sem valor: coluna '" + nulo.group(1)
                        + "' da tabela " + nulo.group(2);
            } else if (fk.find()) {
                message = "Referência inválida (chave estrangeira " + fk.group(1)
                        + ") — o registro em " + fk.group(2) + " não existe";
            } else if (check.find()) {
                message = "Valor não permitido pela regra (check constraint " + check.group(1) + ")";
            } else if (lower.contains("string or binary data would be truncated")) {
                message = "Algum texto é maior que o tamanho da coluna no banco: " + raw;
            } else if (lower.contains("uk_produtos_lojista_slug")) {
                message = "Já existe um produto com este slug nesta loja";
            } else if (lower.contains("uk_lojistas_slug")) {
                message = "Slug da loja já existe";
            } else if (lower.contains("uk_usuarios_email")) {
                message = "E-mail já cadastrado";
            } else if (lower.contains("uk_clientes_cpf")) {
                message = "CPF já cadastrado";
            } else if (lower.contains("uk_lojistas_cnpj")) {
                message = "CNPJ já cadastrado";
            } else if (lower.contains("duplicate") || lower.contains("unique")) {
                message = "Registro duplicado — verifique constraint: " + raw;
            } else {
                message = "Violação de integridade dos dados: " + raw;
            }
        }

        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, message);
    }
}