import { FaArrowRight, FaCircleCheck, FaShieldHeart } from "react-icons/fa6";

export default function HeroSection({ doctorCount }) {
  return (
    <section className="hero" id="inicio">
      <div className="page-width hero-index">
        <span>CARE / 01</span>
        <span>DIRECTORIO MÉDICO INDEPENDIENTE</span>
        <span>MÉXICO · 2026</span>
      </div>
      <div className="hero__content page-width">
        <div className="hero__copy">
          <span className="eyebrow">
            <i /> Profesionales verificados
          </span>
          <h1>Elige con confianza.</h1>
          <p>Compara experiencia, disponibilidad y valoraciones reales.</p>
          <div className="hero__actions">
            <a className="primary-button" href="#directorio">
              Ver especialistas <FaArrowRight />
            </a>
            <span>
              <FaShieldHeart /> Sin posiciones pagadas
            </span>
          </div>
        </div>
        <aside className="hero-ledger">
          <div className="ledger-head">
            <span>CareSync</span>
            <span>Directorio activo</span>
          </div>
          <div className="ledger-number">
            <strong>{String(doctorCount).padStart(2, "0")}</strong>
            <span>
              especialistas
              <br />
              disponibles
            </span>
          </div>
          <div className="ledger-list">
            <p>
              <FaCircleCheck />
              <span>
                <strong>Identidad</strong> Cédula visible
              </span>
            </p>
            <p>
              <FaCircleCheck />
              <span>
                <strong>Valoraciones</strong> Actualizadas en tiempo real
              </span>
            </p>
            <p>
              <FaCircleCheck />
              <span>
                <strong>Comparación</strong> Perfiles lado a lado
              </span>
            </p>
          </div>
          <a href="#metodo">
            Cómo funciona <FaArrowRight />
          </a>
        </aside>
      </div>
    </section>
  );
}
