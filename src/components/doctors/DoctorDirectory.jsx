import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaHeart,
  FaMagnifyingGlass,
  FaStar,
  FaXmark,
} from "react-icons/fa6";
import DoctorCard from "./DoctorCard";

export default function DoctorDirectory({
  doctors,
  loading,
  error,
  onSelectDoctor,
  rateDoctor,
  auth,
}) {
  const [query, setQuery] = useState("");
  const [compared, setCompared] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteOwnerId, setFavoriteOwnerId] = useState(null);
  const accountUserId = auth.user?.id || null;
  const accountFavoritesKey = [...(auth.user?.favoriteDoctorIds || [])]
    .sort()
    .join(",");
  const syncAccountFavorites = auth.syncFavorites;
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return doctors.filter(
      (doctor) =>
        (!favoritesOnly || favoriteIds.has(doctor._id)) &&
        (!q ||
          `${doctor.nombre} ${doctor.especialidad} ${doctor.ubicacion || ""}`
            .toLocaleLowerCase("es")
            .includes(q)),
    );
  }, [doctors, query, favoritesOnly, favoriteIds]);
  useEffect(() => {
    const listener = ({ detail }) =>
      setFavoriteIds((current) => {
        const next = new Set(current);
        detail.saved ? next.add(detail.id) : next.delete(detail.id);
        return next;
      });
    window.addEventListener("caresync:favorite", listener);
    return () => window.removeEventListener("caresync:favorite", listener);
  }, []);
  useEffect(() => {
    const localIds = doctors
      .filter(
        (doctor) => localStorage.getItem(`favorito-${doctor._id}`) === "true",
      )
      .map((doctor) => doctor._id);
    const merged = new Set([
      ...localIds,
      ...accountFavoritesKey.split(",").filter(Boolean),
    ]);
    for (const id of merged) localStorage.setItem(`favorito-${id}`, "true");
    setFavoriteIds(merged);
    setFavoriteOwnerId(accountUserId);
  }, [doctors, accountUserId, accountFavoritesKey]);
  useEffect(() => {
    if (accountUserId && favoriteOwnerId === accountUserId)
      syncAccountFavorites([...favoriteIds]).catch(() => {});
  }, [accountUserId, syncAccountFavorites, favoriteIds, favoriteOwnerId]);
  const toggleCompare = (doctor) =>
    setCompared((current) =>
      current.some((item) => item._id === doctor._id)
        ? current.filter((item) => item._id !== doctor._id)
        : current.length < 3
          ? [...current, doctor]
          : current,
    );
  return (
    <section className="directory" id="directorio">
      <div className="page-width">
        <header className="directory-intro">
          <div>
            <span className="eyebrow">Directorio independiente</span>
            <h2>Encuentra a tu especialista</h2>
          </div>
          <p>Compara perfiles claros, sin posiciones pagadas.</p>
        </header>
        <div className="directory-search">
          <FaMagnifyingGlass />
          <label>
            <span className="sr-only">Buscar especialista</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca por médico, especialidad o zona"
              autoComplete="off"
            />
          </label>
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
              <FaXmark />
            </button>
          )}
          <span className="search-count">{filtered.length} resultados</span>
        </div>
        <div className="favorite-filter">
          <button
            type="button"
            className={favoritesOnly ? "is-active" : ""}
            onClick={() => setFavoritesOnly((current) => !current)}
            aria-pressed={favoritesOnly}
          >
            <FaHeart /> Mis favoritos <span>{favoriteIds.size}</span>
          </button>
          <small>
            {auth.user ? (
              "Sincronizados con tu cuenta."
            ) : (
              <>
                Guardado en este dispositivo.{" "}
                <a href="/cuenta">Inicia sesión para sincronizar</a>.
              </>
            )}
          </small>
        </div>
        {error && (
          <div className="notice" role="status">
            {error}
          </div>
        )}
        {loading ? (
          <div className="loading-state">
            <span className="spinner" /> Cargando especialistas…
          </div>
        ) : filtered.length ? (
          <div className="doctor-list">
            {filtered.map((doctor, index) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                index={index}
                onSelect={onSelectDoctor}
                onCompare={toggleCompare}
                onRate={rateDoctor}
                isOwnProfile={auth.user?.doctorId === doctor._id}
                isCompared={compared.some((item) => item._id === doctor._id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FaStar />
            <h3>No encontramos coincidencias</h3>
            <p>Prueba con otro nombre, especialidad o zona.</p>
          </div>
        )}
      </div>
      {compared.length > 0 && (
        <div className="compare-tray" aria-live="polite">
          <div>
            <span>Comparador</span>
            <strong>{compared.length} de 3 especialistas</strong>
          </div>
          <div className="compare-people">
            {compared.map((doctor) => (
              <span key={doctor._id}>
                {doctor.nombre.replace(/^(Dra?\.)\s/, "").split(" ")[0]}{" "}
                <button
                  onClick={() => toggleCompare(doctor)}
                  aria-label={`Quitar a ${doctor.nombre}`}
                >
                  <FaXmark />
                </button>
              </span>
            ))}
          </div>
          <button
            className="compare-action"
            disabled={compared.length < 2}
            onClick={() => setShowComparison(true)}
          >
            Comparar ahora
          </button>
        </div>
      )}
      {showComparison && (
        <div
          className="comparison-backdrop"
          role="presentation"
          onMouseDown={() => setShowComparison(false)}
        >
          <section
            className="comparison-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">Decide con contexto</span>
                <h2 id="comparison-title">Comparar especialistas</h2>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                aria-label="Cerrar comparación"
              >
                <FaXmark />
              </button>
            </header>
            <div className="comparison-table">
              <div className="comparison-labels">
                <span>Especialista</span>
                <span>Descripción</span>
                <span>Valoración</span>
                <span>Disponibilidad</span>
                <span>Consulta</span>
                <span>Ubicación</span>
                <span>Modalidad</span>
                <span />
              </div>
              {compared.map((doctor) => {
                const count = Math.max(0, Number(doctor.ratingCount) || 0);
                const average = count ? Number(doctor.promedio) || 0 : 0;
                const price = Number(doctor.precio);
                return (
                  <div className="comparison-column" key={doctor._id}>
                    <span className="comparison-doctor">
                      <strong>{doctor.nombre}</strong>
                      <small>{doctor.especialidad}</small>
                    </span>
                    <span>{doctor.descripcion || "Por confirmar"}</span>
                    <span>
                      {count ? (
                        <>
                          <b>{average.toFixed(1)}</b> / 5 · {count}{" "}
                          {count === 1 ? "valoración" : "valoraciones"}
                        </>
                      ) : (
                        "Sin valoraciones"
                      )}
                    </span>
                    <span className="comparison-positive">
                      {doctor.disponibilidad ? (
                        <>
                          <FaCheck /> {doctor.disponibilidad}
                        </>
                      ) : (
                        "Por confirmar"
                      )}
                    </span>
                    <span>
                      {price > 0
                        ? new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                            maximumFractionDigits: 0,
                          }).format(price)
                        : "Por confirmar"}
                    </span>
                    <span>{doctor.ubicacion || "Por confirmar"}</span>
                    <span>Consulta particular</span>
                    <button onClick={() => onSelectDoctor(doctor)}>
                      Ver perfil
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
