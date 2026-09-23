import "./style.css";

const FAQ = [
  {
    q: "Como faço um pedido na AYVY?",
    a: "Entre na loja, escolha o produto, cor e tamanho, adicione ao carrinho e finalize o checkout com endereço e pagamento.",
  },
  {
    q: "Como acompanho meu pedido?",
    a: "Em Minha conta → Pedidos você vê status, itens e valor de cada compra vinculada à sua conta.",
  },
  {
    q: "Sou lojista — como publico produtos?",
    a: "Com login de lojista, abra Minha loja e use a aba de produtos para criar, salvar rascunho ou publicar.",
  },
  {
    q: "Esqueci minha senha. E agora?",
    a: "Na tela de login use Esqueci a senha e siga o fluxo de recuperação com o e-mail cadastrado.",
  },
];

/**
 * Rodapé.
 * - variant "support": único bloco Suporte AYVY (use só na home)
 * - variant "simple": rodapé institucional curto
 */
export default function Footer({ variant = "simple" }) {
  if (variant === "support") {
    return (
      <footer className="site-footer ayvy-support" id="support-section">
        <div className="ayvy-support__inner">
          <header className="ayvy-support__head">
            <h2 className="ayvy-support__title">Suporte AYVY</h2>
            <p className="ayvy-support__lead">
              Dúvidas sobre pedidos, lojas ou sua conta? Estamos aqui para ajudar —
              com clareza e rapidez.
            </p>
          </header>

          <div className="ayvy-support__grid">
            <a className="ayvy-support__card" href="mailto:suporte@ayvy.com.br">
              <span className="ayvy-support__icon" aria-hidden>
                <i className="fas fa-envelope" />
              </span>
              <h3>E-mail</h3>
              <p>suporte@ayvy.com.br</p>
              <span className="ayvy-support__link">Enviar mensagem</span>
            </a>

            <a className="ayvy-support__card" href="tel:+551141994220">
              <span className="ayvy-support__icon" aria-hidden>
                <i className="fas fa-phone" />
              </span>
              <h3>Telefone</h3>
              <p>(11) 4199-4220</p>
              <span className="ayvy-support__link">Ligar agora</span>
            </a>

            <div className="ayvy-support__card ayvy-support__card--static">
              <span className="ayvy-support__icon" aria-hidden>
                <i className="fas fa-map-marker-alt" />
              </span>
              <h3>Campus FIEB</h3>
              <p>
                R. Interna Grupo Bandeirante, 138
                <br />
                Jardim Belval, Barueri - SP
              </p>
            </div>
          </div>

          <section className="ayvy-support__faq" aria-label="Perguntas frequentes">
            <h3 className="ayvy-support__faq-title">Perguntas frequentes</h3>
            <ul className="ayvy-support__faq-list">
              {FAQ.map((item) => (
                <li key={item.q}>
                  <details>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                </li>
              ))}
            </ul>
          </section>

          <div className="ayvy-support__foot">
            <p>
              <strong>ITB Brasílio Flores de Azevedo (FIEB)</strong>
            </p>
            <p>
              © {new Date().getFullYear()} AYVY — plataforma de visibilidade para o seu
              negócio.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer-ayvy">
      <div className="footer-box">
        <h3>ITB Brasílio Flores de Azevedo (FIEB)</h3>
        <p>
          suporte@ayvy.com.br | R. Interna Grupo Bandeirante, 138 - Jardim Belval, Barueri
          - SP
        </p>
        <p>Tel: (11) 4199-4220</p>
      </div>
    </footer>
  );
}
