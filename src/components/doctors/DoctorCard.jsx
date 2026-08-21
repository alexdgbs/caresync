import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { FaArrowRight, FaCheck, FaHeart, FaLocationDot } from "react-icons/fa6";
import RatingStars from "./RatingStars";
import {
  doctorInitials,
  doctorPrice,
  doctorRating,
} from "./doctorPresentation";

export default function DoctorCard({
  doctor,
  onSelect,
  onCompare,
  onRate,
  isOwnProfile = false,
  isCompared = false,
  index = 0,
}) {
  const storageKey = `favorito-${doctor._id}`;
  const [saved, setSaved] = useState(
    () => localStorage.getItem(storageKey) === "true",
  );
  const [ratingStatus, setRatingStatus] = useState("");
  const toggleSaved = () => {
    const next = !saved;
    setSaved(next);
    localStorage.setItem(storageKey, String(next));
    window.dispatchEvent(
      new CustomEvent("caresync:favorite", {
        detail: { id: doctor._id, saved: next },
      }),
    );
  };
  const initials = doctorInitials(doctor.nombre);
  const { count: ratingCount, average } = doctorRating(doctor);
  const formattedPrice = doctorPrice(doctor);
  const submitRating = async (value) => {
    setRatingStatus("");
    try {
      await onRate(doctor._id, value);
    } catch (error) {
      setRatingStatus(error.message);
    }
  };
  return (
    <Motion.article
      className="doctor-card doctor-card--text"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.12) }}
    >
      <div className="doctor-card__identity">
        <span className="doctor-monogram" aria-hidden="true">
          {initials}
        </span>
        <div>
          <span className="specialty">{doctor.especialidad}</span>
          <h3>{doctor.nombre}</h3>
        </div>
        <div className="doctor-card__actions">
          <button
            className={`quiet-action ${saved ? "is-saved" : ""}`}
            type="button"
            onClick={toggleSaved}
            aria-label={saved ? "Quitar de favoritos" : "Agregar a favoritos"}
            title={saved ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <FaHeart />
            <span>{saved ? "Favorito" : "Guardar"}</span>
          </button>
          <button
            className={`compare-text ${isCompared ? "is-active" : ""}`}
            type="button"
            onClick={() => onCompare(doctor)}
          >
            {isCompared ? (
              <>
                <FaCheck /> En comparación
              </>
            ) : (
              "Comparar"
            )}
          </button>
        </div>
      </div>
      <div className="doctor-card__facts">
        <div>
          <span>Valoración</span>
          <div className="doctor-card__meta">
            <RatingStars
              value={isOwnProfile ? average : doctor.myRating || 0}
              interactive={!isOwnProfile}
              onChange={submitRating}
              label={
                isOwnProfile
                  ? `Valoración de ${doctor.nombre}`
                  : `Valorar a ${doctor.nombre}`
              }
            />
            <small>
              {isOwnProfile
                ? "Tu perfil público"
                : ratingStatus ||
                  (ratingCount
                    ? `${average.toFixed(1)} · ${ratingCount} ${ratingCount === 1 ? "valoración" : "valoraciones"}`
                    : "Sé la primera persona en valorar")}
            </small>
          </div>
        </div>
        <div>
          <span>Ubicación</span>
          <p className="location">
            <FaLocationDot /> {doctor.ubicacion || "Por confirmar"}
          </p>
        </div>
        <div>
          <span>Disponibilidad</span>
          <p className="availability">
            <i /> {doctor.disponibilidad || "Consultar"}
          </p>
        </div>
      </div>
      <div className="doctor-card__summary">
        <p>{doctor.descripcion || "Consulta su perfil profesional."}</p>
        <div>
          <span>
            <small>Consulta particular</small>
            <strong>{formattedPrice}</strong>
          </span>
          <button
            type="button"
            className="card-link"
            onClick={() => onSelect(doctor)}
          >
            {isOwnProfile ? "Ver mi perfil" : "Ver perfil"} <FaArrowRight />
          </button>
        </div>
      </div>
    </Motion.article>
  );
}
