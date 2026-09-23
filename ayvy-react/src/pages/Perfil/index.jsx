import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUsuario, updateUsuario, uploadImage } from "../../services/adminApi";
import { loginUsuario } from "../../services/authApi";
import {
  criarEndereco,
  deletarEndereco,
  listEnderecos,
} from "../../services/pedidosApi";
import { formatCep } from "../../utils/cartHelpers";
import useCepLookup from "../../hooks/useCepLookup";
import {
  deletePaymentMethod,
  listPaymentMethods,
  savePaymentMethod,
} from "../../utils/paymentMethodsStore";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./style.css";

const MAX_BYTES = 1024 * 1024;
const DEFAULT_AVATAR = "/assets/img/ayvy-media-a.png";

const EMPTY_ADDR = {
  apelido: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  cep: "",
};

const EMPTY_CARD = {
  holder: "",
  number: "",
  validity: "",
  brand: "Cartão",
};

export default function Perfil() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const aba = searchParams.get("aba") === "seguranca" ? "seguranca" : "perfil";

  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);
  const [avatarPath, setAvatarPath] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [sidebarTitle, setSidebarTitle] = useState("Minha conta");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDR);
  const { formatAndLookup, cepLoading, cepError: cepLookupError } = useCepLookup(
    (data) => {
      setAddrForm((f) => ({
        ...f,
        logradouro: data.logradouro || f.logradouro,
        bairro: data.bairro || f.bairro,
        cidade: data.cidade || f.cidade,
        uf: data.estado || f.uf,
      }));
    },
  );
  const [addrSaving, setAddrSaving] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);

  const [payments, setPayments] = useState(() => listPaymentMethods());
  const [cardForm, setCardForm] = useState(EMPTY_CARD);
  const [showCardForm, setShowCardForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      try {
        const data = await getUsuario(user.id);
        if (cancelled) return;
        setNomeCompleto(data.nome || "");
        setNomeUsuario((data.email || "").split("@")[0] || "");
        setEmail(data.email || "");
        setTelefone(data.telefone || "");
        setSidebarTitle(data.nome || "Minha conta");
        const url = resolveImageUrl(data.avatarUrl);
        if (url) {
          setAvatarSrc(url);
          setAvatarPath(data.avatarUrl);
        }
      } catch {
        if (!cancelled) {
          setNomeCompleto(user.displayName || "");
          setNomeUsuario(user.login || "");
          setEmail(user.email || "");
          setSidebarTitle(user.displayName || "Minha conta");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.displayName, user?.login, user?.email]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      try {
        const apiList = await listEnderecos();
        const mine = (apiList || [])
          .filter((e) => {
            const uid = e?.usuario?.id ?? e?.usuarioId;
            return uid == null || Number(uid) === Number(user.id);
          })
          .map((e) => ({
            id: e.id,
            apelido: e.apelido || "Endereço",
            logradouro: e.logradouro || "",
            numero: e.numero || "",
            complemento: e.complemento || "",
            bairro: e.bairro || "",
            cidade: e.cidade || "",
            uf: e.uf || "",
            cep: formatCep(String(e.cep || "").replace(/\D/g, "")),
            principal: !!e.principal,
          }));
        if (!cancelled) setAddresses(mine);
      } catch {
        if (!cancelled) setAddresses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  function setAba(next) {
    setMsg("");
    setError("");
    if (next === "seguranca") setSearchParams({ aba: "seguranca" });
    else setSearchParams({});
  }

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      alert("A imagem deve ter no máximo 1 MB.");
      e.target.value = "";
      return;
    }
    try {
      const up = await uploadImage(file, "usuarios");
      const caminho = up?.caminho || up?.url;
      if (!caminho) throw new Error("Upload sem caminho");
      setAvatarPath(caminho);
      setAvatarSrc(resolveImageUrl(caminho));
    } catch (err) {
      alert(err.message || "Falha no upload");
    }
  }

  async function handleSaveProfile() {
    if (!user?.id) return;
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const payload = {
        nome: nomeCompleto.trim() || nomeUsuario.trim(),
        telefone: telefone.trim() || null,
        avatarUrl: avatarPath || null,
      };
      await updateUsuario(user.id, payload);
      setSidebarTitle(payload.nome || "Minha conta");
      setMsg("Perfil atualizado.");
    } catch (err) {
      setError(err.message || "Erro ao gravar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword() {
    if (!user?.id) return;
    if (!senhaAtual.trim()) {
      setError("Informe a senha atual para continuar.");
      return;
    }
    if (!senhaNova.trim() || senhaNova.trim().length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const emailLogin = email || user.email;
      if (!emailLogin) throw new Error("E-mail da conta não encontrado.");
      await loginUsuario({ email: emailLogin, senha: senhaAtual.trim() });
      await updateUsuario(user.id, { senha: senhaNova.trim() });
      setSenhaNova("");
      setSenhaAtual("");
      setMsg("Senha atualizada com sucesso.");
    } catch (err) {
      const msgErr = String(err.message || "").toLowerCase();
      if (msgErr.includes("senha") || msgErr.includes("401") || msgErr.includes("credencial") || msgErr.includes("inválid") || msgErr.includes("invalid")) {
        setError("Senha atual incorreta.");
      } else {
        setError(err.message || "Erro ao alterar senha");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAddress() {
    if (!user?.id) return;
    const cep = String(addrForm.cep || "").replace(/\D/g, "");
    if (
      !addrForm.apelido.trim() ||
      !addrForm.logradouro.trim() ||
      !addrForm.cidade.trim() ||
      !addrForm.uf.trim() ||
      cep.length !== 8
    ) {
      setError("Preencha apelido, rua, cidade, UF e CEP válido.");
      return;
    }
    setAddrSaving(true);
    setError("");
    setMsg("");
    try {
      const created = await criarEndereco({
        usuario: { id: user.id },
        apelido: addrForm.apelido.trim(),
        logradouro: addrForm.logradouro.trim(),
        numero: addrForm.numero.trim() || "S/N",
        complemento: addrForm.complemento.trim() || null,
        bairro: addrForm.bairro.trim() || "Centro",
        cidade: addrForm.cidade.trim(),
        uf: String(addrForm.uf).slice(0, 2).toUpperCase(),
        cep,
        principal: addresses.length === 0,
      });
      const mapped = {
        id: created?.id ?? Date.now(),
        apelido: addrForm.apelido.trim(),
        logradouro: addrForm.logradouro.trim(),
        numero: addrForm.numero.trim() || "S/N",
        complemento: addrForm.complemento.trim(),
        bairro: addrForm.bairro.trim(),
        cidade: addrForm.cidade.trim(),
        uf: String(addrForm.uf).slice(0, 2).toUpperCase(),
        cep: formatCep(cep),
        principal: addresses.length === 0,
      };
      setAddresses((prev) => [mapped, ...prev]);
      setAddrForm(EMPTY_ADDR);
      setShowAddrForm(false);
      setMsg("Endereço salvo.");
    } catch (err) {
      setError(err.message || "Não foi possível salvar o endereço.");
    } finally {
      setAddrSaving(false);
    }
  }

  async function handleDeleteAddress(id) {
    if (!window.confirm("Remover este endereço?")) return;
    try {
      await deletarEndereco(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setMsg("Endereço removido.");
    } catch (err) {
      setError(err.message || "Falha ao remover endereço.");
    }
  }

  function handleSaveCard(e) {
    e.preventDefault();
    const digits = String(cardForm.number || "").replace(/\D/g, "");
    if (!cardForm.holder.trim() || digits.length < 12 || !cardForm.validity.trim()) {
      setError("Preencha nome, número e validade do cartão.");
      return;
    }
    savePaymentMethod({
      holder: cardForm.holder.trim(),
      last4: digits.slice(-4),
      validity: cardForm.validity.trim(),
      brand: cardForm.brand || "Cartão",
    });
    setPayments(listPaymentMethods());
    setCardForm(EMPTY_CARD);
    setShowCardForm(false);
    setError("");
    setMsg("Forma de pagamento adicionada neste dispositivo.");
  }

  function handleDeleteCard(id) {
    deletePaymentMethod(id);
    setPayments(listPaymentMethods());
    setMsg("Forma de pagamento removida.");
  }

  const panelTitle = useMemo(
    () => (aba === "seguranca" ? "Segurança" : "Meu perfil"),
    [aba],
  );

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <aside className="sidebar">
          <div className="usuario">
            <img className="js-perfil-avatar" src={avatarSrc} alt="Foto do usuário" />
            <div>
              <h3 id="nomePerfilSidebar">{sidebarTitle}</h3>
              <button type="button" className="perfil-edit-link" onClick={() => setAba("perfil")}>
                <i className="fa-solid fa-pen" />
                Editar perfil
              </button>
            </div>
          </div>

          <nav className="menu" aria-label="Minha conta">
            <div className="menu-titulo">
              <i className="fa-regular fa-user" />
              Minha conta
            </div>
            <div className="submenu">
              <button
                type="button"
                className={aba === "perfil" ? "ativo" : ""}
                onClick={() => setAba("perfil")}
              >
                Perfil
              </button>
              <button
                type="button"
                className={aba === "seguranca" ? "ativo" : ""}
                onClick={() => setAba("seguranca")}
              >
                Segurança
              </button>
              <Link to="/meus-pedidos">Pedidos</Link>
              <Link to="/favoritos">Favoritos</Link>
            </div>
            <Link to="/meus-pedidos" className="menu-link">
              <i className="fa-regular fa-clipboard" />
              Minhas compras
            </Link>
            <Link to="/notificacoes" className="menu-link">
              <i className="fa-regular fa-bell" />
              Notificações
            </Link>
          </nav>
        </aside>

        <main className="painel" id="painel-perfil">
          <div className="painel-card">
            <div className="painel-topo">
              <h2>{panelTitle}</h2>
              <p>
                {aba === "seguranca"
                  ? "Senha, endereços e formas de pagamento"
                  : "Gerenciar e proteger sua conta"}
              </p>
            </div>
            <div className="linha" />

            {msg ? <p className="perfil-msg perfil-msg--ok">{msg}</p> : null}
            {error ? <p className="perfil-msg perfil-msg--err">{error}</p> : null}

            {aba === "perfil" ? (
              <div className="perfil-grid">
                <div className="formulario">
                  <div className="campo">
                    <label htmlFor="inputNomeUsuario">Nome de usuário</label>
                    <input
                      id="inputNomeUsuario"
                      type="text"
                      autoComplete="username"
                      value={nomeUsuario}
                      onChange={(e) => setNomeUsuario(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="inputNomeCompleto">Nome</label>
                    <input
                      id="inputNomeCompleto"
                      type="text"
                      placeholder="Digite seu nome"
                      autoComplete="name"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                    />
                  </div>
                  <div className="campo-texto">
                    <label>Email</label>
                    <span className="campo-texto-valor">{email || "—"}</span>
                  </div>
                  <div className="campo">
                    <label htmlFor="inputTelefone">Telefone</label>
                    <input
                      id="inputTelefone"
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-salvar"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? "Gravando…" : "Gravar"}
                  </button>
                </div>

                <div className="foto-lateral">
                  <img className="js-perfil-avatar" src={avatarSrc} alt="Foto de perfil" />
                  <input
                    type="file"
                    id="uploadFoto"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={onUpload}
                  />
                  <label htmlFor="uploadFoto">Selecionar imagem</label>
                  <p>Tamanho máximo: 1 MB</p>
                  <p>Formatos: .JPEG, .PNG</p>
                </div>
              </div>
            ) : (
              <div className="seg-stack">
                <section className="seg-block">
                  <div className="seg-block-head">
                    <h3>
                      <i className="fas fa-lock" aria-hidden /> Senha
                    </h3>
                    <p>Altere sua senha de acesso à conta.</p>
                  </div>
                  <div className="seg-form-row">
                    <div className="campo">
                      <label htmlFor="senhaAtual">Senha atual</label>
                      <input
                        id="senhaAtual"
                        type="password"
                        autoComplete="current-password"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        required
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="senhaNova">Nova senha</label>
                      <input
                        id="senhaNova"
                        type="password"
                        autoComplete="new-password"
                        value={senhaNova}
                        onChange={(e) => setSenhaNova(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-salvar"
                    onClick={handleSavePassword}
                    disabled={saving}
                  >
                    {saving ? "Salvando…" : "Atualizar senha"}
                  </button>
                </section>

                <section className="seg-block">
                  <div className="seg-block-head">
                    <div>
                      <h3>
                        <i className="fas fa-map-marker-alt" aria-hidden /> Endereços
                      </h3>
                      <p>Endereços salvos na sua conta para entrega.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-seg-ghost"
                      onClick={() => setShowAddrForm((v) => !v)}
                    >
                      {showAddrForm ? "Cancelar" : "Novo endereço"}
                    </button>
                  </div>

                  {showAddrForm ? (
                    <div className="seg-form-grid">
                      <div className="campo">
                        <label>Apelido</label>
                        <input
                          value={addrForm.apelido}
                          onChange={(e) =>
                            setAddrForm((f) => ({ ...f, apelido: e.target.value }))
                          }
                          placeholder="Casa, Trabalho…"
                        />
                      </div>
                      <div className="campo">
                        <label>CEP</label>
                        <input
                          value={addrForm.cep}
                          maxLength={9}
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="00000-000"
                          onChange={(e) => {
                            const { formatted } = formatAndLookup(e.target.value);
                            setAddrForm((f) => ({ ...f, cep: formatted }));
                          }}
                          onBlur={() => formatAndLookup(addrForm.cep)}
                        />
                        {cepLoading ? (
                          <span className="seg-cep-hint">Buscando endereço…</span>
                        ) : null}
                        {cepLookupError ? (
                          <span className="seg-cep-hint seg-cep-hint--err">
                            {cepLookupError}
                          </span>
                        ) : null}
                      </div>
                      <div className="campo seg-span-2">
                        <label>Rua / logradouro</label>
                        <input
                          value={addrForm.logradouro}
                          onChange={(e) =>
                            setAddrForm((f) => ({ ...f, logradouro: e.target.value }))
                          }
                        />
                      </div>
                      <div className="campo">
                        <label>Número</label>
                        <input
                          value={addrForm.numero}
                          onChange={(e) =>
                            setAddrForm((f) => ({ ...f, numero: e.target.value }))
                          }
                        />
                      </div>
                      <div className="campo">
                        <label>Complemento</label>
                        <input
                          value={addrForm.complemento}
                          onChange={(e) =>
                            setAddrForm((f) => ({ ...f, complemento: e.target.value }))
                          }
                        />
                      </div>
                      <div className="campo">
                        <label>Bairro</label>
                        <input
                          value={addrForm.bairro}
                          onChange={(e) =>
                            setAddrForm((f) => ({ ...f, bairro: e.target.value }))
                          }
                        />
                      </div>
                      <div className="campo">
                        <label>Cidade</label>
                        <input
                          value={addrForm.cidade}
                          onChange={(e) =>
                            setAddrForm((f) => ({ ...f, cidade: e.target.value }))
                          }
                        />
                      </div>
                      <div className="campo">
                        <label>UF</label>
                        <input
                          maxLength={2}
                          value={addrForm.uf}
                          onChange={(e) =>
                            setAddrForm((f) => ({
                              ...f,
                              uf: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="SP"
                        />
                      </div>
                      <div className="seg-span-2">
                        <button
                          type="button"
                          className="btn-salvar"
                          onClick={handleSaveAddress}
                          disabled={addrSaving}
                        >
                          {addrSaving ? "Salvando…" : "Salvar endereço"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {addresses.length === 0 && !showAddrForm ? (
                    <p className="seg-empty">Nenhum endereço cadastrado ainda.</p>
                  ) : (
                    <ul className="seg-list">
                      {addresses.map((addr) => (
                        <li key={addr.id} className="seg-item">
                          <div>
                            <strong>
                              {addr.apelido}
                              {addr.principal ? (
                                <span className="seg-badge">Principal</span>
                              ) : null}
                            </strong>
                            <p>
                              {addr.logradouro}
                              {addr.numero ? `, ${addr.numero}` : ""}
                              {addr.complemento ? ` — ${addr.complemento}` : ""}
                            </p>
                            <p>
                              {addr.bairro} · {addr.cidade}/{addr.uf} · CEP {addr.cep}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-seg-danger"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="seg-block">
                  <div className="seg-block-head">
                    <div>
                      <h3>
                        <i className="fas fa-credit-card" aria-hidden /> Formas de
                        pagamento
                      </h3>
                      <p>
                        Cartões salvos neste dispositivo para agilizar o checkout.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-seg-ghost"
                      onClick={() => setShowCardForm((v) => !v)}
                    >
                      {showCardForm ? "Cancelar" : "Adicionar cartão"}
                    </button>
                  </div>

                  {showCardForm ? (
                    <form className="seg-form-grid" onSubmit={handleSaveCard}>
                      <div className="campo seg-span-2">
                        <label>Nome no cartão</label>
                        <input
                          value={cardForm.holder}
                          onChange={(e) =>
                            setCardForm((f) => ({ ...f, holder: e.target.value }))
                          }
                          autoComplete="cc-name"
                        />
                      </div>
                      <div className="campo seg-span-2">
                        <label>Número</label>
                        <input
                          value={cardForm.number}
                          onChange={(e) =>
                            setCardForm((f) => ({ ...f, number: e.target.value }))
                          }
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                      <div className="campo">
                        <label>Validade</label>
                        <input
                          value={cardForm.validity}
                          onChange={(e) =>
                            setCardForm((f) => ({ ...f, validity: e.target.value }))
                          }
                          placeholder="MM/AA"
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div className="campo">
                        <label>Bandeira</label>
                        <select
                          value={cardForm.brand}
                          onChange={(e) =>
                            setCardForm((f) => ({ ...f, brand: e.target.value }))
                          }
                        >
                          <option>Visa</option>
                          <option>Mastercard</option>
                          <option>Elo</option>
                          <option>Amex</option>
                          <option>Cartão</option>
                        </select>
                      </div>
                      <div className="seg-span-2">
                        <button type="submit" className="btn-salvar">
                          Salvar cartão
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {payments.length === 0 && !showCardForm ? (
                    <p className="seg-empty">Nenhuma forma de pagamento salva.</p>
                  ) : (
                    <ul className="seg-list">
                      {payments.map((pm) => (
                        <li key={pm.id} className="seg-item">
                          <div>
                            <strong>
                              {pm.brand} •••• {pm.last4}
                            </strong>
                            <p>
                              {pm.holder} · Val. {pm.validity}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-seg-danger"
                            onClick={() => handleDeleteCard(pm.id)}
                          >
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
