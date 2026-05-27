import { Link } from "react-router-dom";

export default function AdminFormShell({ title, subtitle, backTo, error, children, actions }) {
  return (
    <div className="admin-page admin-form-page-wrap">
      <header className="admin-page-header">
        <div>
          <Link to={backTo} className="admin-form-back">
            <i className="fas fa-arrow-left" aria-hidden /> Voltar
          </Link>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="admin-page-actions">{actions}</div> : null}
      </header>

      {error ? <div className="admin-crud-alert admin-crud-alert--error">{error}</div> : null}

      <section className="admin-card admin-form-page">{children}</section>
    </div>
  );
}
