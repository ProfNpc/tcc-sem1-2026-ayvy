import { useEffect } from "react";

/**
 * Injeta <link rel="stylesheet"> na montagem e remove na desmontagem.
 * Passe um array em constante de módulo (mesma referência) para evitar re-execuções.
 */
export default function useExternalStylesOnce(hrefs) {
  const serialized = hrefs.join("|");
  useEffect(() => {
    const links = serialized.split("|").map((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => {
      links.forEach((l) => l.remove());
    };
  }, [serialized]);
}
