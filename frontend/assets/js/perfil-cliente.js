(function () {
  const uploadFoto = document.getElementById("uploadFoto");
  const avatars = document.querySelectorAll(".js-perfil-avatar");
  const nomeUsuario = document.getElementById("inputNomeUsuario");
  const nomeSidebar = document.getElementById("nomePerfilSidebar");
  const btnSalvar = document.querySelector(".btn-salvar");

  const MAX_BYTES = 1024 * 1024;

  function syncSidebarNome() {
    if (!nomeUsuario || !nomeSidebar) return;
    const v = nomeUsuario.value.trim();
    nomeSidebar.textContent = v || "Minha conta";
  }

  if (nomeUsuario) {
    nomeUsuario.addEventListener("input", syncSidebarNome);
    syncSidebarNome();
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      syncSidebarNome();
    });
  }

  if (!uploadFoto || !avatars.length) return;

  uploadFoto.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      window.alert("A imagem deve ter no máximo 1 MB.");
      this.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const src = e.target.result;
      avatars.forEach((img) => {
        img.src = src;
      });
    };
    reader.readAsDataURL(file);
  });
})();
