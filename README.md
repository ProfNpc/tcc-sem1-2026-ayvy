# Ayvy TCC (2026) — organização do projeto

Este repositório contém:

- **`frontend/`**: site estático (HTML/CSS/JS) do projeto AYVY.
- **`Back/ayvy/`**: backend Java (Spring Boot) já configurado (porta padrão: `8012`), atualmente com entidades JPA e sem endpoints REST implementados.

## Estrutura do `frontend/`

- **Páginas (raiz do `frontend/`)**
  - `index.html` (home)
  - `login.html`
  - `cadastro.html`
  - `esqueci-senha.html`
  - `ranking.html`
  - `sobre.html`
- **Assets**
  - `frontend/assets/css/`: estilos
  - `frontend/assets/js/`: scripts
  - `frontend/assets/img/`: imagens
  - `frontend/assets/components/`: componentes HTML (partials)

## Como rodar o front localmente

Por ser estático, o ideal é subir um servidor simples (para evitar problemas de caminho e CORS).

Opção 1 (Python 3):

```bash
cd frontend
python3 -m http.server 5500
```

Depois acesse `http://localhost:5500/` ou `http://localhost:5500/index.html`.

cd back 
./mvnw spring-boot:run

para trocar de branch 
git switch corrigido

!!!!!!!!!!!!!!!!  e para puxar o commit de uma para outra   !!!!!!!!!!!!!!!!
git switch main <caso não esteja no main, voltar para ele>
git log --oneline <para ver o endereço do ultimo commit>
git switch corrigido  
git cherry-pick d23adc5 <coloca aqui o endereço do ultimo commit>
git push