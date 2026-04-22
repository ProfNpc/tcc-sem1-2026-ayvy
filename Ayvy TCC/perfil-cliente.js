const uploadFoto = document.getElementById("uploadFoto");
const fotoPerfil = document.getElementById("fotoPerfil");

uploadFoto.addEventListener("change", function () {
  const file = this.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      fotoPerfil.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }
});