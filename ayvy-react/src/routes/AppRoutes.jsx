import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import MainLayout from "../components/MainLayout";
import RequireAuth from "../components/RequireAuth";
import RequireRole from "../components/RequireRole";
import { ROLES } from "../utils/mockAuthUsers";
import AdminHome from "../pages/Adim";
import Cadastro from "../pages/Cadastro";
import EsqueciSenha from "../pages/EsqueciSenha";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Loja from "../pages/Loja";
import LojaProdutoNovo from "../pages/Loja/ProdutoNovo";
import Perfil from "../pages/Perfil";
import Produto from "../pages/Produto";
import Ranking from "../pages/Ranking";
import Sobre from "../pages/Sobre";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="sobre" element={<Sobre />} />
        <Route
          path="perfil"
          element={
            <RequireAuth>
              <Perfil />
            </RequireAuth>
          }
        />
        <Route path="ranking" element={<Ranking />} />
        <Route path="loja/:slug" element={<Loja />} />
        <Route path="loja/:slug/p/:productId" element={<Produto />} />
        <Route
          path="loja/:slug/produto/novo"
          element={
            <RequireAuth>
              <LojaProdutoNovo />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        path="admin"
        element={
          <RequireRole role={ROLES.ADMIN}>
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminHome />} />
      </Route>

      <Route path="login" element={<Login />} />
      <Route path="cadastro" element={<Cadastro />} />
      <Route path="esqueci-senha" element={<EsqueciSenha />} />
      <Route path="lojista" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
