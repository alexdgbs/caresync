import { useState } from "react";
import {
  FaCertificate,
  FaCopy,
  FaLanguage,
  FaLocationDot,
  FaMoneyBillWave,
  FaPhone,
  FaUserDoctor,
} from "react-icons/fa6";
import RatingStars from "./RatingStars";
import {
  doctorInitials,
  doctorPrice,
  doctorRating,
} from "./doctorPresentation";
import AppointmentPicker from "../appointments/AppointmentPicker";

export default function DoctorProfile({
  doctor,
  onRate,
  onComment,
  onUpdateComment,
  onDeleteComment,
  auth,
}) {
  const [rating, setRating] = useState(doctor.myRating || 0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingText, setEditingText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const [commentActionStatus, setCommentActionStatus] = useState("");
  const submitRating = async (value) => {
    const previous = rating;
    setRating(value);
    setStatus("");
    try {
      await onRate(doctor._id, value);
      setStatus(
        value ? "Tu valoración fue guardada." : "Tu valoración fue eliminada.",
      );
    } catch (error) {
      setRating(previous);
      setStatus(error.message);
    }
  };
  const submitComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setStatus("");
    try {
      await onComment(doctor._id, comment.trim());
      setComment("");
      setStatus("Tu comentario fue enviado.");
    } catch (error) {
      setStatus(error.message);
    }
  };
  const saveComment = async (event) => {
    event.preventDefault();
    if (!editingText.trim()) return;
    setCommentActionStatus("");
    try {
      await onUpdateComment(doctor._id, editingCommentId, editingText.trim());
      setEditingCommentId("");
      setEditingText("");
      setCommentActionStatus("Comentario actualizado.");
    } catch (error) {
      setCommentActionStatus(error.message);
    }
  };
  const removeComment = async (commentId) => {
    setCommentActionStatus("");
    try {
      await onDeleteComment(doctor._id, commentId);
      setDeletingCommentId("");
      setCommentActionStatus("Comentario eliminado.");
    } catch (error) {
      setCommentActionStatus(error.message);
    }
  };
  const shareProfile = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(url);
      else {
        const input = document.createElement("textarea");
        input.value = url;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("COPY_FAILED");
      }
      setShareStatus("Enlace copiado");
      window.setTimeout(() => setShareStatus(""), 2200);
    } catch {
      setShareStatus("No se pudo copiar");
    }
  };
  const initials = doctorInitials(doctor.nombre);
  const { count: ratingCount, average } = doctorRating(doctor);
  const formattedPrice = doctorPrice(doctor, "Precio por confirmar");
  const isOwnProfile = auth.user?.doctorId === doctor._id;
  const openAccount = () => {
    window.history.pushState({}, "", "/cuenta");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const renderComment = (item, index) => (
    <div className="review" key={item._id || index}>
      <span className="review-avatar">
        {(item.nombre || "U")[0].toUpperCase()}
      </span>
      <div className="review-content">
        <header>
          <strong>{item.nombre || "Usuario"}</strong>
          {item.isMine && (
            <div className="comment-actions">
              {editingCommentId !== item._id && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCommentId(item._id);
                    setEditingText(item.texto);
                    setDeletingCommentId("");
                    setCommentActionStatus("");
                  }}
                >
                  Editar
                </button>
              )}
              {deletingCommentId === item._id ? (
                <>
                  <span>¿Eliminar?</span>
                  <button
                    className="danger-text"
                    type="button"
                    onClick={() => removeComment(item._id)}
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCommentId("")}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDeletingCommentId(item._id);
                    setEditingCommentId("");
                    setCommentActionStatus("");
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </header>
        {editingCommentId === item._id ? (
          <form className="review-edit-form" onSubmit={saveComment}>
            <textarea
              value={editingText}
              onChange={(event) => setEditingText(event.target.value)}
              rows="3"
              maxLength="800"
              required
            />
            <div>
              <button type="submit">Guardar</button>
              <button
                type="button"
                onClick={() => {
                  setEditingCommentId("");
                  setEditingText("");
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <p>{item.texto}</p>
        )}
      </div>
    </div>
  );
  return (
    <article className="profile-card profile-card--editorial">
      <header className="profile-hero">
        <div
          className="profile-portrait profile-monogram"
          aria-label={`Iniciales de ${doctor.nombre}`}
        >
          <strong>{initials}</strong>
          <span>Especialista CareSync</span>
        </div>
        <div className="profile-title">
          <div className="profile-badges">
            <span className="specialty">{doctor.especialidad}</span>
            {doctor.verificationStatus === "verified" && (
              <span className="verified-badge">Perfil verificado</span>
            )}
          </div>
          <h1>{doctor.nombre}</h1>
          <p>{doctor.descripcion}</p>
          <div className="profile-rating">
            <RatingStars value={average} />
            <span>
              {ratingCount
                ? `${average.toFixed(1)} · ${ratingCount} ${ratingCount === 1 ? "valoración" : "valoraciones"}`
                : "Sin valoraciones"}
            </span>
            <button
              className="share-profile"
              type="button"
              onClick={shareProfile}
            >
              <FaCopy />
              {shareStatus || "Copiar"}
            </button>
          </div>
        </div>
      </header>
      {isOwnProfile ? (
        <section className="profile-owner-panel">
          <div>
            <span className="eyebrow">Vista pública</span>
            <h2>Este es tu perfil</h2>
            <p>
              Así te encuentran los pacientes. Administra tus datos y horarios
              desde tu cuenta.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={openAccount}
          >
            Administrar perfil
          </button>
        </section>
      ) : (
        <aside className="appointment-brief">
          <div className="appointment-summary">
            <span>Consulta particular</span>
            <strong>{formattedPrice}</strong>
            <button
              className="text-button"
              type="button"
              onClick={() => setShowContact((current) => !current)}
            >
              {showContact ? "Ocultar contacto" : "Ver contacto"}
            </button>
            {showContact && (
              <div className="contact-reveal">
                <strong>{doctor.telefono || "Contacto no disponible"}</strong>
              </div>
            )}
          </div>
          <AppointmentPicker doctor={doctor} auth={auth} />
        </aside>
      )}
      <div className="profile-body">
        <section className="credentials">
          <header>
            <span className="eyebrow">Información</span>
            <h2>Perfil profesional</h2>
          </header>
          <div className="detail-list">
            <div className="detail-item">
              <span className="detail-icon">
                <FaCertificate />
              </span>
              <div>
                <small>Cédula profesional</small>
                <p>{doctor.cedula}</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">
                <FaUserDoctor />
              </span>
              <div>
                <small>Especialidad</small>
                <p>{doctor.especialidad}</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">
                <FaLocationDot />
              </span>
              <div>
                <small>Consultorio</small>
                <p>{doctor.ubicacion || "Ubicación por confirmar"}</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">
                <FaPhone />
              </span>
              <div>
                <small>Contacto</small>
                <p>{doctor.telefono || "Mediante CareSync"}</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">
                <FaLanguage />
              </span>
              <div>
                <small>Idiomas</small>
                <p>
                  {doctor.idiomas?.length
                    ? doctor.idiomas.join(" · ")
                    : "Español"}
                </p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">
                <FaMoneyBillWave />
              </span>
              <div>
                <small>Modalidad</small>
                <p>Consulta particular</p>
              </div>
            </div>
          </div>
          <div className="data-provenance">
            <div>
              <span>Verificación</span>
              <strong>Revisado por CareSync</strong>
            </div>
            <div>
              <span>Actualizado</span>
              <strong>
                {doctor.updatedAt
                  ? new Intl.DateTimeFormat("es-MX", {
                      dateStyle: "medium",
                    }).format(new Date(doctor.updatedAt))
                  : "Perfil verificado"}
              </strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>
                <i /> Perfil verificado
              </strong>
            </div>
          </div>
        </section>
        <aside className="patient-voice">
          <section>
            <span className="eyebrow">Experiencias</span>
            <h2>Lo que dicen sus pacientes</h2>
            <div className="review-list">
              {(doctor.comentarios || []).length ? (
                [...doctor.comentarios].reverse().map(renderComment)
              ) : (
                <p className="muted">Aún no hay comentarios.</p>
              )}
            </div>
            {commentActionStatus && (
              <p className="form-status" role="status">
                {commentActionStatus}
              </p>
            )}
          </section>
          {!isOwnProfile && (
            <>
              <div className="your-rating">
                <h3>¿Cómo fue tu experiencia?</h3>
                <p>Tu opinión ayuda a otros pacientes.</p>
                <RatingStars
                  value={rating}
                  interactive
                  onChange={submitRating}
                  label="Tu valoración"
                />
              </div>
              <form className="review-form" onSubmit={submitComment}>
                <h3>Compartir una opinión</h3>
                <p className="review-identity">
                  {auth.user
                    ? `Publicarás como ${auth.user.nombre}.`
                    : "Inicia sesión para publicar."}
                </p>
                <label>
                  Comentario
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows="4"
                    maxLength="800"
                    required
                  />
                </label>
                <button className="primary-button" type="submit">
                  Publicar opinión
                </button>
                {status && (
                  <p className="form-status" role="status">
                    {status}
                  </p>
                )}
              </form>
            </>
          )}
        </aside>
      </div>
    </article>
  );
}
