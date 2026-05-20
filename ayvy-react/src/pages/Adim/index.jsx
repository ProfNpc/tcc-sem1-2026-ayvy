import "./style.css";

export default function AdminHome() {
  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h1>Painel administrativo</h1>
        <p>Área para o CRUD de administração. Desenvolva suas telas aqui.</p>
      </header>

      <section className="panel-page-card">
        <h2>Próximos módulos</h2>
        <ul className="panel-page-list">
          <li>Lojistas (aprovar, suspender)</li>
          <li>Produtos e categorias</li>
          <li>Pedidos e relatórios</li>
          <li>Usuários e permissões</li>
        </ul>
      </section>
    </div>
  );
}
