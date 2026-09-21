// perfil-cliente.js

const uploadFoto =
document.getElementById('uploadFoto');

const fotoPerfil =
document.getElementById('fotoPerfil');

uploadFoto.addEventListener(
  'change',
  function () {

    const arquivo = this.files[0];

    if (arquivo) {

      const leitor =
      new FileReader();

      leitor.onload = function (e) {

        fotoPerfil.src =
        e.target.result;

      };

      leitor.readAsDataURL(arquivo);

    }

  }
);