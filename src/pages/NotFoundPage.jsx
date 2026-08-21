import { FaArrowLeft } from "react-icons/fa6";

export default function NotFoundPage({ onBack }) {
  return (
    <section className="not-found page-width">
      <span className="not-found__code">404 / PERFIL NO DISPONIBLE</span>
      <div>
        <h1>No encontramos este especialista.</h1>
        <p>
          El enlace puede haber cambiado o el perfil ya no forma parte del
          directorio.
        </p>
        <button className="primary-button" type="button" onClick={onBack}>
          <FaArrowLeft /> Volver al directorio
        </button>
      </div>
    </section>
  );
}
