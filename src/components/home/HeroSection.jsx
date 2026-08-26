export default function HeroSection() {
  return (
    <section className="hero" id="inicio">
      <div className="hero__content page-width">
        <div className="hero__masthead">
          <div className="hero__copy">
            <p className="hero__kicker">Directorio médico independiente</p>
            <h1>Tu salud merece una elección informada.</h1>
          </div>
          <aside className="hero__guide" aria-label="Información disponible">
            <p>En cada perfil puedes revisar</p>
            <ul>
              <li>Cédula y experiencia profesional</li>
              <li>Opiniones de pacientes</li>
              <li>Disponibilidad y costo de consulta</li>
            </ul>
          </aside>
        </div>
        <div className="hero__footer">
          <p className="hero__intro">
            Compara especialistas sin anuncios ni posiciones pagadas.
          </p>
          <div className="hero__actions">
            <a className="primary-button" href="#directorio">
              Ver especialistas
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
