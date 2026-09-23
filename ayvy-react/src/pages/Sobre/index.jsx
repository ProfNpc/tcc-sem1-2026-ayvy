import { useEffect } from "react";
import Footer from "../../components/Footer";
import TeamMemberRow from "../../components/TeamMemberRow";
import useExternalStylesOnce from "../../hooks/useExternalStylesOnce";
import { SOBRE_FONT_HREFS } from "../../utils/sobrePageStyles";
import "./style.css";

const TEAM = [
  {
    imageSrc: "/assets/img/heloisa3.jpeg",
    imageAlt: "Heloisa",
    name: "Heloisa",
    role: "Gerente de Back-end",
    reversed: false,
    bio: "Responsável pela criação das APIs do sistema, assegurando a comunicação eficiente entre o Front-End e o banco de dados. Atuou também na organização e estruturação da lógica da aplicação, contribuindo para o desempenho, escalabilidade e funcionamento adequado do sistema.",
  },
  {
    imageSrc: "/assets/img/gui1.jpeg",
    imageAlt: "Guilherme",
    name: "Guilherme",
    role: "Gerente do Banco de Dados",
    reversed: true,
    bio: "Responsável pelo desenvolvimento do banco de dados do projeto, participando da definição da arquitetura, da estruturação e da organização das informações, além de zelar pela consistência, confiabilidade e segurança dos dados. Contribuiu para a criação de uma base eficiente, garantindo o bom desempenho do sistema e o suporte adequado às funcionalidades da aplicação.",
  },
  {
    imageSrc: "/assets/img/leticia1.jpeg",
    imageAlt: "Leticia",
    name: "Leticia",
    role: "Gerente de Documentação e Processos do Mobile",
    reversed: false,
    bio: "Responsável pela organização, elaboração e revisão da documentação do projeto, garantindo clareza e padronização das informações. Atuou também no apoio ao desenvolvimento do Front-End do aplicativo mobile, contribuindo na criação de interfaces e na melhoria da experiência do usuário. Também é responsável pela organização e melhoria dos processos do aplicativo mobile.",
  },
  {
    imageSrc: "/assets/img/emilly2.jpeg",
    imageAlt: "Emilly",
    name: "Emilly",
    role: "Gerente de Front-end",
    reversed: true,
    bio: "Responsável por impulsionar o desenvolvimento da plataforma AYVY, unindo técnica e design para criar interfaces que saltam aos olhos. Atua diretamente na construção de sistemas inteligentes, focando sempre em entregar uma navegação fluida, visual moderno e uma experiência que faça sentido para quem usa.",
  },
];

export default function Sobre() {
  useExternalStylesOnce(SOBRE_FONT_HREFS);

  useEffect(() => {
    const nodes = document.querySelectorAll(".sobre-reveal");
    if (!nodes.length || typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="sobre-page">
      <header className="nu-hero">
        <img
          className="nu-hero__bg"
          src="/assets/img/img-curta-ayvy.jpeg"
          alt=""
          aria-hidden
        />
        <div className="nu-hero__wash" />
        <div className="nu-hero__inner">
          <p className="nu-kicker">Sobre a AYVY</p>
          <h1 className="nu-hero__title">
            Crescer
            <br />
            juntos.
          </h1>
          <p className="nu-hero__lead">
            Visibilidade e suporte para quem está começando a subir.
          </p>
          <a className="nu-hero__scroll" href="#historia">
            Conheça nossa história
            <span aria-hidden>↓</span>
          </a>
        </div>
      </header>

      <section className="nu-band sobre-reveal" aria-label="Manifesto">
        <p className="nu-band__text">
          Assim como a hera, acreditamos no potencial de quem está começando.
        </p>
      </section>

      <section className="nu-story" id="historia">
        <div className="nu-story__wrap sobre-reveal">
          <p className="nu-kicker nu-kicker--purple">Origem do nome</p>
          <h2 className="nu-title">Conheça a história da AYVY</h2>
          <div className="nu-story__cols">
            <p>
              O nome Ayvy nasce da inspiração na palavra “ivy”, que em inglês significa
              hera — uma planta marcada pela sua força silenciosa, capacidade de
              adaptação e crescimento constante. Mesmo começando pequena, a hera
              encontra caminhos, se fixa com firmeza e alcança grandes alturas,
              independentemente dos obstáculos ao redor.
            </p>
            <p>
              Essa essência traduz exatamente o propósito da Ayvy. Acreditamos no
              potencial de crescimento dos pequenos empreendedores que enfrentam
              limitações de estrutura, visibilidade e recursos no ambiente digital.
            </p>
            <p>
              Nosso objetivo é ser o suporte que sustenta esse crescimento: direção,
              estratégias e ferramentas para negócios sólidos e sustentáveis. A Ayvy
              não é apenas uma marca — é um ponto de apoio. Porque não importa onde
              você começa; importa até onde você pode chegar com o suporte certo.
            </p>
          </div>
        </div>
      </section>

      <section className="nu-purpose sobre-reveal">
        <div className="nu-purpose__inner">
          <p className="nu-kicker">Nosso propósito</p>
          <h2>
            Ser o suporte que
            <br />
            sustenta o crescimento.
          </h2>
          <p>
            Oferecemos direção e ferramentas para que cada negócio crie raízes
            fortes no digital e conquiste novos espaços.
          </p>
        </div>
      </section>

      <section className="nu-team" id="equipe">
        <header className="nu-team__head sobre-reveal">
          <p className="nu-kicker nu-kicker--purple">Quem faz acontecer</p>
          <h2 className="nu-title">Conheça nossa equipe</h2>
          <p className="nu-team__sub">
            As pessoas por trás da plataforma e suas principais atividades.
          </p>
        </header>

        <div className="nu-team__list">
          {TEAM.map((m) => (
            <div className="sobre-reveal" key={m.name}>
              <TeamMemberRow
                reversed={m.reversed}
                imageSrc={m.imageSrc}
                imageAlt={m.imageAlt}
                name={`${m.name} — ${m.role}`}
              >
                <p>{m.bio}</p>
              </TeamMemberRow>
            </div>
          ))}
        </div>
      </section>

      <section className="nu-group sobre-reveal">
        <figure className="nu-group__figure">
          <img src="/assets/img/foto-equipe-ayvy.jpeg" alt="Equipe AYVY reunida" />
          <figcaption>
            <strong>Equipe AYVY reunida</strong>
            <span>Colaboradores extras: José Neto e Pedro Talles</span>
          </figcaption>
        </figure>
      </section>

      <Footer />
    </div>
  );
}
