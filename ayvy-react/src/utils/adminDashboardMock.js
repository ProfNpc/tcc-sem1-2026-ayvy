import { SHOPS } from "./lojistaData";

const shopList = Object.entries(SHOPS).map(([slug, shop]) => ({
  slug,
  name: shop.name,
  handle: shop.handle,
  avatar: shop.avatar,
  products: shop.products?.length ?? 0,
  status: slug === "livre_store" ? "pendente" : "aprovado",
}));

export const ADMIN_OVERVIEW = {
  platform: {
    name: "AYVY Marketplace",
    status: "online",
    plan: "TCC — Ambiente de desenvolvimento",
    domain: "localhost:5174",
    emailStatus: "Configurar em produção",
  },
  metrics: {
    lojistasAtivos: shopList.filter((s) => s.status === "aprovado").length,
    lojistasPendentes: shopList.filter((s) => s.status === "pendente").length,
    produtosPublicados: shopList.reduce((acc, s) => acc + s.products, 0),
    pedidosMes: 128,
    clientesCadastrados: 842,
    receitaMes: "R$ 24.380,00",
  },
  moderation: {
    checklistPercent: 78,
    issues: 4,
    recommendations: 3,
    completedTasks: 11,
    tasks: [
      { id: 1, label: "Aprovar lojista Livre Store", done: false, priority: "alta" },
      { id: 2, label: "Revisar denúncia de produto", done: false, priority: "media" },
      { id: 3, label: "Atualizar termos da plataforma", done: true, priority: "baixa" },
      { id: 4, label: "Validar banners da home", done: true, priority: "baixa" },
    ],
  },
  performance: {
    uptime: 99.9,
    visits7d: [420, 510, 480, 620, 590, 710, 680],
    conversionRate: 3.2,
  },
  recentLojistas: shopList,
  recentOrders: [
    { id: "#AY-1042", loja: "ITB Moda", valor: "R$ 229,72", status: "enviado" },
    { id: "#AY-1041", loja: "Rafaele Fashion", valor: "R$ 189,90", status: "pago" },
    { id: "#AY-1040", loja: "Rafaele Fashion", valor: "R$ 349,80", status: "pendente" },
  ],
};

export const ADMIN_NAV = [
  { to: "/admin", icon: "fa-home", label: "Visão geral", end: true },
  { to: "/admin/usuarios", icon: "fa-user-shield", label: "Usuários" },
  { to: "/admin/lojistas", icon: "fa-store", label: "Lojistas" },
  { to: "/admin/clientes", icon: "fa-users", label: "Clientes" },
  { to: "/admin/produtos", icon: "fa-box", label: "Produtos" },
  { to: "/admin/pedidos", icon: "fa-shopping-bag", label: "Pedidos", soon: true },
  { to: "/admin/relatorios", icon: "fa-chart-line", label: "Relatórios", soon: true },
];
