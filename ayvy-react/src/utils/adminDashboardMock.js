/** Navegação do painel admin (rotas reais, sem dados mock). */
export const ADMIN_NAV = [
  { to: "/admin", icon: "fa-home", label: "Visão geral", end: true },
  { to: "/admin/usuarios", icon: "fa-user-shield", label: "Usuários" },
  { to: "/admin/lojistas", icon: "fa-store", label: "Lojistas" },
  { to: "/admin/clientes", icon: "fa-users", label: "Clientes" },
  { to: "/admin/produtos", icon: "fa-box", label: "Produtos" },
  { to: "/admin/pedidos", icon: "fa-shopping-bag", label: "Pedidos" },
  { to: "/admin/relatorios", icon: "fa-chart-line", label: "Relatórios" },
];
