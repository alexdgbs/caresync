import {
  FaCalendarCheck,
  FaMagnifyingGlass,
  FaUserCheck,
} from "react-icons/fa6";
const steps = [
  {
    icon: <FaMagnifyingGlass />,
    number: "01",
    title: "Busca",
    text: "Filtra por nombre, especialidad o zona.",
  },
  {
    icon: <FaUserCheck />,
    number: "02",
    title: "Compara",
    text: "Revisa experiencia, costo y valoraciones.",
  },
  {
    icon: <FaCalendarCheck />,
    number: "03",
    title: "Contacta",
    text: "Solicita una cita con el especialista.",
  },
];
export default function CareSteps() {
  return (
    <section className="care-steps" id="metodo">
      <div className="page-width">
        <header className="section-heading">
          <span className="eyebrow">Cómo funciona</span>
          <h2>Tres pasos. Sin ruido.</h2>
          <p>Información clara para decidir mejor.</p>
        </header>
        <div className="steps-grid">
          {steps.map((s) => (
            <article className="step-card" key={s.number}>
              <div className="step-icon">{s.icon}</div>
              <span className="step-number">{s.number}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
