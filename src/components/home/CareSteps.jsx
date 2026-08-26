import {
  FaCalendarCheck,
  FaMagnifyingGlass,
  FaUserCheck,
} from "react-icons/fa6";
const steps = [
  {
    icon: <FaMagnifyingGlass />,
    title: "Busca",
    text: "Filtra por nombre, especialidad o zona.",
  },
  {
    icon: <FaUserCheck />,
    title: "Compara",
    text: "Revisa experiencia, costo y valoraciones.",
  },
  {
    icon: <FaCalendarCheck />,
    title: "Contacta",
    text: "Solicita una cita con el especialista.",
  },
];
export default function CareSteps() {
  return (
    <section className="care-steps" id="metodo">
      <div className="page-width">
        <header className="section-heading">
          <span className="eyebrow">Cómo elegir</span>
          <p>Busca por especialidad, compara perfiles y contacta directamente.</p>
        </header>
        <div className="steps-grid">
          {steps.map((s) => (
            <article className="step-card" key={s.title}>
              <div className="step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
