function toggleMobileMenu() {
  if (window.innerWidth < 1024) {
    document.getElementById("menuDrop").classList.toggle("active");
  }
}

// Fecha o menu ao clicar fora
document.addEventListener("click", (e) => {
  if (!document.getElementById("menuArea").contains(e.target)) {
    document.getElementById("menuDrop").classList.remove("active");
  }
});

const lojas = [
  {
    nome: "rafaele_fashion",
    views: 125900,
    img: "https://i.pravatar.cc/100?u=2",
  },
  {
    nome: "livre_store",
    views: 98450,
    img: "https://i.pravatar.cc/100?u=1",
  },
  {
    nome: "urban_vibes",
    views: 15400,
    img: "https://i.pravatar.cc/100?u=7",
  },
  {
    nome: "itb_moda",
    views: 12100,
    img: "https://i.pravatar.cc/100?u=5",
  },
  { nome: "loja_oculta", views: 500, img: "" }, // Não vai aparecer (<10k)
];

function carregar() {
  const body = document.getElementById("ranking-body");

  // Filtra > 10.000 e ordena
  const filtrados = lojas
    .filter((l) => l.views > 10000)
    .sort((a, b) => b.views - a.views);

  body.innerHTML = filtrados
    .map((loja, i) => {
      const isTop = i < 3;
      const rowClass = isTop ? 'class="row-highlight"' : "";
      // Criamos a variável da estrela aqui
      const star = isTop ? `<i class="fas fa-star star-icon"></i>` : "";

      return `
              <tr ${rowClass}>
                  <td class="pos-num">${i + 1}º</td>
                  <td>
                      <div class="store-profile">
                          <img src="${loja.img || "https://via.placeholder.com/40"}" alt="logo">
                          <span style="font-weight: 600;">${loja.nome}</span>
                      </div>
                  </td>
                  <td class="views-count">${loja.views.toLocaleString("pt-BR")}</td>
                  <td>
                      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                          ${star} <span class="status-pill">VERIFICADO</span>
                      </div>
                  </td>
              </tr>
          `;
    })
    .join("");
}

window.onload = carregar;
