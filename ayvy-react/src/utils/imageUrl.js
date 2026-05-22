const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8082";

/** Converte caminho do banco (/uploads/...) em URL exibível no front. */
export function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
