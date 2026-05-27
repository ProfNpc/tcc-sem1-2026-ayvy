import { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css";

const MAX_BYTES = 1024 * 1024;
const DEFAULT_AVATAR = "/assets/img/ayvy-media-a.png";

export default function Perfil() {
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [sidebarTitle, setSidebarTitle] = useState("Minha conta");

  function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      alert("A imagem deve ter no máximo 1 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarSrc(String(ev.target?.result || ""));
    };
    reader.readAsDataURL(file);
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
              <a href="#">Cartões / contas bancárias</a>
              <a href="#">Endereços</a>
              <a href="#">Trocar senha</a>
              <a href="#">Preferências de cookies</a>
              <a href="#">Configurações de privacidade</a>
            </div>
            <a href="#" className="menu-link">
              <i className="fa-regular fa-clipboard" />
              Minhas compras
            </a>
            <a href="#" className="menu-link">
              <i className="fa-regular fa-bell" />
              Notificações
            </a>
            <a href="#" className="menu-link">
              <i className="fa-solid fa-ticket" />
              Meus cupons
            </a>
          </nav>
        </aside>

        <main className="painel" id="painel-perfil">
          <div className="painel-card">
            <div className="painel-topo">
              <h2>Meu perfil</h2>
              <p>Gerenciar e proteger sua conta</p>
            </div>
            <div className="linha" />

            <div className="perfil-grid">
              <div className="formulario">
                <div className="campo">
                  <label htmlFor="inputNomeUsuario">Nome de usuário</label>
                  <input
                    id="inputNomeUsuario"
                    type="text"
                    placeholder="****************"
                    autoComplete="username"
                    value={nomeUsuario}
                    onChange={(e) => setNomeUsuario(e.target.value)}
                    onBlur={(e) =>
                      setSidebarTitle(e.target.value.trim() || "Minha conta")
                    }
                  />
                </div>
                <div className="campo">
                  <label htmlFor="inputNomeCompleto">Nome</label>
                  <input
                    id="inputNomeCompleto"
                    type="text"
                    placeholder="Digite seu nome"
                    autoComplete="name"
                  />
                </div>
                <div className="campo-texto">
                  <label>Email</label>
                  <span className="campo-texto-valor campo-texto-mascarado">
                    **********@gmail.com
                  </span>
                  <a href="#">Trocar</a>
                </div>
                <div className="campo-texto">
                  <label>Telefone</label>
                  <span className="campo-texto-valor campo-texto-mascarado">**********</span>
                  <a href="#">Trocar</a>
                </div>
                <div className="campo-radio">
                  <label>Sexo</label>
                  <div className="radios">
                    <label>
                      <input type="radio" name="sexo" value="m" />
                      Masculino
                    </label>
                    <label>
                      <input type="radio" name="sexo" value="f" />
                      Feminino
                    </label>
                    <label>
                      <input type="radio" name="sexo" value="o" />
                      Outros
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-salvar"
                  onClick={() => setSidebarTitle(nomeUsuario.trim() || "Minha conta")}
                >
                  Gravar
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
