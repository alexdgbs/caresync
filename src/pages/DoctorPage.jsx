import { motion as Motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa6";
import DoctorProfile from "../components/doctors/DoctorProfile";

export default function DoctorPage({
  doctor,
  onBack,
  onRate,
  onComment,
  onUpdateComment,
  onDeleteComment,
  auth,
}) {
  return (
    <Motion.div
      className="profile-page page-width"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <nav className="profile-breadcrumb" aria-label="Ruta de navegación">
        <button onClick={onBack}>
          <FaArrowLeft /> Directorio
        </button>
        <span>/</span>
        <span>{doctor.especialidad}</span>
        <span>/</span>
        <strong>{doctor.nombre}</strong>
      </nav>
      <DoctorProfile
        doctor={doctor}
        onRate={onRate}
        onComment={onComment}
        onUpdateComment={onUpdateComment}
        onDeleteComment={onDeleteComment}
        auth={auth}
      />
    </Motion.div>
  );
}
