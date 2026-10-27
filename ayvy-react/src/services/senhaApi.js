/**
 * Recuperação de senha (tela /esqueci-senha).
 * POST /usuarios/recuperar-senha (envia código por e-mail ou SMS) e POST /usuarios/redefinir-senha (código + nova senha).
 * Back: UsuarioController → RecuperacaoSenhaService.
 */
import { apiJson } from "./api";

export function solicitarCodigoSenha(email, canal = "email") {
  return apiJson("/usuarios/recuperar-senha", { method: "POST", body: { email, canal } });
}

export function redefinirSenhaComCodigo({ email, codigo, novaSenha }) {
  return apiJson("/usuarios/redefinir-senha", {
    method: "POST",
    body: { email, codigo, novaSenha },
  });
}
