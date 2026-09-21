import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUsuario, updateUsuario, uploadImage } from "../../services/adminApi";
import { resolveImageUrl } from "../../utils/imageUrl";
import "./style.css";

const MAX_BYTES = 1024 * 1024;
const DEFAULT_AVATAR = "/assets/img/ayvy-media-a.png";

export default function Perfil() {
  const { user } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);
  const [avatarPath, setAvatarPath] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [sidebarTitle, setSidebarTitle] = useState("Minha conta");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

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

  async function handleSave() {
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
      if (senhaNova.trim()) {
        payload.senha = senhaNova.trim();
      }
      await updateUsuario(user.id, payload);
      setSidebarTitle(payload.nome || "Minha conta");
      setSenhaNova("");
      setMsg("Perfil atualizado na API.");
    } catch (err) {
      setError(err.message || "Erro ao gravar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <aside className="sidebar">
          <div className="usuario">
            <img className="js-perfil-avatar" src={avatarSrc} alt="Foto do usuário" />
            <div>
              <h3 id="nomePerfilSidebar">{sidebarTitle}</h3>
              <a href="#painel-perfil">
                <i className="fa-solid fa-pen" />
                Editar perfil
              </a>
            </div>
          </div>

          <nav className="menu" aria-label="Minha conta">
            <div className="menu-titulo">
              <i className="fa-regular fa-user" />
              Minha conta
            </div>
            <div className="submenu">
              <Link to="/perfil" className="ativo">
                Perfil
              </Link>
              <Link to="/favoritos">Favoritos</Link>
              <Link to="/meus-pedidos">Pedidos</Link>
            </div>
            <Link to="/meus-pedidos" className="menu-link">
              <i className="fa-regular fa-clipboard" />
              Minhas compras
            </Link>
            <Link to="/notificacoes" className="menu-link">
              <i className="fa-regular fa-bell" />
              Notificações
            </Link>
            <Link to="/favoritos" className="menu-link">
              <i className="fa-regular fa-heart" />
              Favoritos
            </Link>
          </nav>
        </aside>

        <main className="painel" id="painel-perfil">
          <div className="painel-card">
            <div className="painel-topo">
              <h2>Meu perfil</h2>
              <p>Gerenciar e proteger sua conta</p>
            </div>
            <div className="linha" />

            {msg ? <p style={{ color: "#0a7a32" }}>{msg}</p> : null}
            {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}

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
                <div className="campo">
                  <label htmlFor="inputSenha">Nova senha (opcional)</label>
                  <input
                    id="inputSenha"
                    type="password"
                    autoComplete="new-password"
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    placeholder="Deixe em branco para não alterar"
                  />
                </div>
                <button
                  type="button"
                  className="btn-salvar"
                  onClick={handleSave}
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
          </div>
        </main>
      </div>
    </div>
  );
}
