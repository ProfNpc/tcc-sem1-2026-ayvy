import "./style.css";

/**
 * Rodapé institucional.
 * @param {{ variant?: 'home' | 'sobre' }} props
 */
export default function Footer({ variant = "home" }) {
  if (variant === "sobre") {
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

  return (
    <footer className="site-footer" id="support-section">
      <div className="footer-info">
        <p>
          <strong>ITB Brasílio Flores de Azevedo (FIEB)</strong>
        </p>
        <p>R. Interna Grupo Bandeirante, 138 - Jardim Belval, Barueri - SP</p>
        <p>Tel: (11) 4199-4220</p>
      </div>
    </footer>
  );
}
