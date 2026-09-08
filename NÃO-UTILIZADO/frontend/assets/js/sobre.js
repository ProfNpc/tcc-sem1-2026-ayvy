document.addEventListener("DOMContentLoaded", () => {
  // Esse comando aqui embaixo já pega a equipe inteira de uma vez!
  const fotosMembros = document.querySelectorAll(".membro-media");

  fotosMembros.forEach((foto) => {
    foto.addEventListener("touchstart", function () {
      this.style.transform = "scale(1.1)";
    });

    foto.addEventListener("touchend", function () {
      this.style.transform = "scale(1)";
    });
  });
});
