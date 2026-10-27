package com.ayvy.api_java.business;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/** Envio de SMS pela API REST do Twilio (sem SDK). Só funciona com as credenciais configuradas. */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final String accountSid;
    private final String authToken;
    private final String numeroOrigem;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public SmsService(@Value("${ayvy.sms.twilio.account-sid:}") String accountSid,
                      @Value("${ayvy.sms.twilio.auth-token:}") String authToken,
                      @Value("${ayvy.sms.twilio.from:}") String numeroOrigem) {
        this.accountSid = accountSid.trim();
        this.authToken = authToken.trim();
        this.numeroOrigem = numeroOrigem.trim();
    }

    public boolean configurado() {
        return !accountSid.isEmpty() && !authToken.isEmpty() && !numeroOrigem.isEmpty();
    }

    /** Converte telefone brasileiro (com ou sem DDI) para o formato E.164, ex.: +5511999998888. */
    public static String paraE164(String telefone) {
        if (telefone == null) return null;
        String digitos = telefone.replaceAll("\\D", "");
        if (digitos.length() == 10 || digitos.length() == 11) return "+55" + digitos;
        if ((digitos.length() == 12 || digitos.length() == 13) && digitos.startsWith("55")) return "+" + digitos;
        return null;
    }

    /** Envia o SMS; devolve false se o Twilio recusar ou não responder. */
    public boolean enviar(String telefoneE164, String mensagem) {
        String corpo = "To=" + url(telefoneE164) + "&From=" + url(numeroOrigem) + "&Body=" + url(mensagem);
        String credenciais = Base64.getEncoder()
                .encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Basic " + credenciais)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(corpo))
                .build();
        try {
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) return true;
            log.error("Twilio recusou o SMS para {} (HTTP {}): {}", telefoneE164, resp.statusCode(), resp.body());
            return false;
        } catch (IOException e) {
            log.error("Falha ao falar com o Twilio para enviar SMS a {}", telefoneE164, e);
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private static String url(String valor) {
        return URLEncoder.encode(valor, StandardCharsets.UTF_8);
    }
}
