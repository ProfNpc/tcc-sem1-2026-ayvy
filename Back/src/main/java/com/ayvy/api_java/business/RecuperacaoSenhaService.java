package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.RedefinicaoSenha;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import com.ayvy.api_java.infrastructure.repositories.RedefinicaoSenhaRepository;
import com.ayvy.api_java.infrastructure.repositories.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class RecuperacaoSenhaService {

    private static final Logger log = LoggerFactory.getLogger(RecuperacaoSenhaService.class);
    private static final Duration VALIDADE = Duration.ofMinutes(15);
    private static final Duration INTERVALO_REENVIO = Duration.ofSeconds(60);
    private static final int MAX_TENTATIVAS = 5;
    private static final int TAMANHO_MINIMO_SENHA = 6;

    private final UsuarioRepository usuarioRepository;
    private final RedefinicaoSenhaRepository redefinicaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final SmsService smsService;
    private final String remetente;
    private final SecureRandom random = new SecureRandom();

    public RecuperacaoSenhaService(UsuarioRepository usuarioRepository,
                                   RedefinicaoSenhaRepository redefinicaoRepository,
                                   PasswordEncoder passwordEncoder,
                                   ObjectProvider<JavaMailSender> mailSender,
                                   SmsService smsService,
                                   @Value("${ayvy.mail.from:${spring.mail.username:no-reply@ayvy.com.br}}") String remetente) {
        this.usuarioRepository = usuarioRepository;
        this.redefinicaoRepository = redefinicaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.smsService = smsService;
        this.remetente = remetente;
    }

    /**
     * Gera e envia um código de 6 dígitos por e-mail ou SMS. Responde igual exista ou não
     * a conta, para não revelar quais e-mails estão cadastrados.
     */
    @Transactional
    public void solicitarCodigo(String email, String canal) {
        String emailLimpo = normalizarEmail(email);
        Usuario usuario = usuarioRepository.findByEmail(emailLimpo).orElse(null);
        if (usuario == null || usuario.getStatus() != StatusUsuario.ativo) {
            log.info("Recuperação de senha pedida para e-mail sem conta ativa: {}", emailLimpo);
            return;
        }

        var anterior = redefinicaoRepository
                .findFirstByUsuarioIdAndUsadoEmIsNullOrderByCriadoEmDesc(usuario.getId());
        if (anterior.isPresent() && anterior.get().getCriadoEm() != null
                && anterior.get().getCriadoEm().isAfter(LocalDateTime.now().minus(INTERVALO_REENVIO))) {
            log.info("Novo código pedido antes de 1 minuto para {}; mantido o código anterior", emailLimpo);
            return;
        }

        invalidarCodigosAbertos(usuario.getId());

        String codigo = String.format("%06d", random.nextInt(1_000_000));
        redefinicaoRepository.save(RedefinicaoSenha.builder()
                .usuario(usuario)
                .codigoHash(passwordEncoder.encode(codigo))
                .expiraEm(LocalDateTime.now().plus(VALIDADE))
                .build());

        if ("sms".equalsIgnoreCase(canal)) {
            String telefone = SmsService.paraE164(usuario.getTelefone());
            if (telefone != null) {
                enviarSms(usuario, telefone, codigo);
                return;
            }
            log.info("Conta {} sem telefone válido para SMS; código enviado por e-mail", usuario.getEmail());
        }
        enviarEmail(usuario, codigo);
    }

    public void redefinirSenha(String email, String codigo, String novaSenha) {
        String emailLimpo = normalizarEmail(email);
        String codigoLimpo = codigo == null ? "" : codigo.replaceAll("\\D", "");
        if (codigoLimpo.length() != 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código de 6 dígitos.");
        }
        if (novaSenha == null || novaSenha.trim().length() < TAMANHO_MINIMO_SENHA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A nova senha precisa ter pelo menos " + TAMANHO_MINIMO_SENHA + " caracteres.");
        }

        ResponseStatusException codigoInvalido = new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Código inválido ou expirado. Peça um novo código.");

        Usuario usuario = usuarioRepository.findByEmail(emailLimpo).orElseThrow(() -> codigoInvalido);
        RedefinicaoSenha pedido = redefinicaoRepository
                .findFirstByUsuarioIdAndUsadoEmIsNullOrderByCriadoEmDesc(usuario.getId())
                .orElseThrow(() -> codigoInvalido);

        if (pedido.getExpiraEm().isBefore(LocalDateTime.now()) || pedido.getTentativas() >= MAX_TENTATIVAS) {
            pedido.setUsadoEm(LocalDateTime.now());
            redefinicaoRepository.save(pedido);
            throw codigoInvalido;
        }

        if (!passwordEncoder.matches(codigoLimpo, pedido.getCodigoHash())) {
            pedido.setTentativas(pedido.getTentativas() + 1);
            redefinicaoRepository.save(pedido);
            int restantes = MAX_TENTATIVAS - pedido.getTentativas();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, restantes > 0
                    ? "Código incorreto. Você tem mais " + restantes + " tentativa(s)."
                    : "Código incorreto. Peça um novo código.");
        }

        usuario.setSenha(passwordEncoder.encode(novaSenha.trim()));
        usuarioRepository.save(usuario);
        pedido.setUsadoEm(LocalDateTime.now());
        redefinicaoRepository.save(pedido);
        invalidarCodigosAbertos(usuario.getId());
    }

    private void invalidarCodigosAbertos(Integer usuarioId) {
        LocalDateTime agora = LocalDateTime.now();
        for (RedefinicaoSenha aberto : redefinicaoRepository.findByUsuarioIdAndUsadoEmIsNull(usuarioId)) {
            aberto.setUsadoEm(agora);
            redefinicaoRepository.save(aberto);
        }
    }

    private void enviarSms(Usuario usuario, String telefoneE164, String codigo) {
        if (!smsService.configurado()) {
            mostrarNoConsole("SMS", telefoneE164 + " (" + usuario.getEmail() + ")", codigo,
                    "SMS não configurado: defina TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_FROM");
            return;
        }
        String texto = "AYVY: seu código para redefinir a senha é " + codigo
                + ". Vale por " + VALIDADE.toMinutes() + " minutos. Não compartilhe.";
        if (!smsService.enviar(telefoneE164, texto)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível enviar o SMS agora. Tente receber por e-mail.");
        }
    }

    /** Sem serviço de envio configurado, o código aparece em destaque no console do Spring. */
    private void mostrarNoConsole(String canal, String destino, String codigo, String motivo) {
        String linha = "=".repeat(68);
        log.warn("""

                {}
                  AYVY · RECUPERAÇÃO DE SENHA ({} não enviado: modo console)
                  Para:   {}
                  CÓDIGO: {}   (vale {} minutos)
                  Motivo: {}
                {}""",
                linha, canal, destino, codigo, VALIDADE.toMinutes(), motivo, linha);
    }

    private void enviarEmail(Usuario usuario, String codigo) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            mostrarNoConsole("E-mail", usuario.getEmail(), codigo,
                    "e-mail não configurado: defina SPRING_MAIL_HOST, SPRING_MAIL_USERNAME e SPRING_MAIL_PASSWORD");
            return;
        }

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(remetente);
        msg.setTo(usuario.getEmail());
        msg.setSubject("AYVY — código para redefinir sua senha");
        msg.setText("Olá, " + (usuario.getNome() != null ? usuario.getNome() : "cliente") + "!\n\n"
                + "Seu código para redefinir a senha da AYVY é: " + codigo + "\n\n"
                + "Ele vale por " + VALIDADE.toMinutes() + " minutos. Se você não pediu a troca de senha, "
                + "ignore este e-mail: sua senha continua a mesma.\n\n"
                + "Equipe AYVY");
        try {
            sender.send(msg);
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail de recuperação para {}", usuario.getEmail(), e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
        }
    }

    private static String normalizarEmail(String email) {
        String limpo = email == null ? "" : email.trim();
        if (limpo.isEmpty() || !limpo.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um e-mail válido.");
        }
        return limpo;
    }
}
