import { ABOUT_SECTIONS } from "../../data/siteContent";
export default function AboutSection() {
  return (
    <section className="about-section" id="acerca">
      <div className="page-width">
        <header className="about-section__intro">
          <span className="eyebrow">Nuestros criterios</span>
          <h2>Información para decidir</h2>
          <p>Perfiles útiles, sin ruido ni posiciones pagadas.</p>
        </header>
        <div className="about-grid">
          {ABOUT_SECTIONS.map((item, index) => (
            <article key={item.id}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
