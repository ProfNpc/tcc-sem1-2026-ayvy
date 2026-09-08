// Função para alterar o placeholder do documento baseado no tipo de usuário
function mudarDoc() {
  const isLojista = document.getElementById("lojista").checked;
  const inputDoc = document.getElementById("documento");
  if (inputDoc) {
    inputDoc.placeholder = isLojista ? "CNPJ da Empresa" : "CPF";
    inputDoc.maxLength = isLojista ? 14 : 11;
  }
}

// Função para buscar CEP via API ViaCEP
async function buscarCEP() {
  const cep = document.getElementById("cep").value.replace(/\D/g, "");
  if (cep.length !== 8) return;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (!data.erro) {
      document.getElementById("logradouro").value = data.logradouro || "";
      document.getElementById("bairro").value = data.bairro || "";
      document.getElementById("cidade").value = data.localidade || "";
      document.getElementById("estado").value = data.uf || "";
    } else {
      alert("CEP não encontrado!");
    }
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    alert("Erro ao buscar CEP. Tente novamente.");
  }
}

// Animação de entrada do container
setTimeout(() => {
  const el = document.querySelector(".container");
  if (!el) return;

  el.style.display = "block";
  el.style.opacity = "0";
  el.style.transform = "translateY(15px)";
  el.style.transition = "opacity 500ms ease, transform 500ms ease";

  void el.offsetWidth;

  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
}, 100);
