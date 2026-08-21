import { useEffect, useMemo, useState } from "react";
import { accountApi } from "../../services/accountApi";
import { SOCKET_URL } from "../../services/apiConfig";
import { connectPublicSocket } from "../../services/socketClient";

const formatSlot = (value) =>
  new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
const formatDay = (value) =>
  new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
const formatTime = (value) =>
  new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function AppointmentPicker({ doctor, auth }) {
  const [slots, setSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    const load = () =>
      accountApi
        .slots(doctor._id)
        .then(setSlots)
        .catch(() => setSlots([]));
    load();
    if (!SOCKET_URL) return undefined;
    const socket = connectPublicSocket();
    socket.on("agenda_actualizada", ({ doctorId }) => {
      if (doctorId === doctor._id) load();
    });
    return () => socket.disconnect();
  }, [doctor._id]);
  const grouped = useMemo(
    () =>
      slots.reduce((result, slot) => {
        const key = new Date(slot.startsAt).toLocaleDateString("en-CA");
        if (!result[key]) result[key] = [];
        result[key].push(slot);
        return result;
      }, {}),
    [slots],
  );
  const days = useMemo(() => Object.entries(grouped), [grouped]);
  useEffect(() => {
    if (!selectedDay || !grouped[selectedDay]) {
      setSelectedDay(days[0]?.[0] || "");
      setSelected("");
    }
  }, [days, grouped, selectedDay]);
  const requestAppointment = async () => {
    if (!auth.user) {
      window.history.pushState({}, "", "/cuenta");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }
    if (auth.user.role === "admin") {
      setStatus("La cuenta administrativa no puede solicitar citas.");
      return;
    }
    if (auth.user.doctorId === doctor._id) {
      setStatus("No puedes agendar una cita contigo mismo.");
      return;
    }
    if (!selected) {
      setStatus("Selecciona un horario.");
      return;
    }
    try {
      await accountApi.createAppointment({ slotId: selected });
      setSlots((current) =>
        current.map((slot) =>
          slot._id === selected ? { ...slot, status: "booked" } : slot,
        ),
      );
      setSelected("");
      setStatus("Solicitud enviada. El médico debe confirmarla.");
    } catch (error) {
      setStatus(error.message);
    }
  };
  const daySlots = grouped[selectedDay] || [];
  const dayAvailable = daySlots.some((slot) => slot.status === "open");
  return (
    <div className="appointment-picker">
      <span>
        Agenda · consultas de {doctor.appointmentDuration || 45} minutos
      </span>
      {slots.length ? (
        <>
          <div className="date-strip" aria-label="Fechas disponibles">
            {days.map(([day, currentSlots]) => {
              const openCount = currentSlots.filter(
                (slot) => slot.status === "open",
              ).length;
              return (
                <button
                  type="button"
                  className={selectedDay === day ? "active" : ""}
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setSelected("");
                    setStatus("");
                  }}
                >
                  <strong>
                    {new Intl.DateTimeFormat("es-MX", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    }).format(new Date(currentSlots[0].startsAt))}
                  </strong>
                  <small>
                    {openCount
                      ? `${openCount} ${openCount === 1 ? "horario" : "horarios"}`
                      : "Completo"}
                  </small>
                </button>
              );
            })}
          </div>
          <div className="selected-date">
            <header>
              <strong>{daySlots[0] && formatDay(daySlots[0].startsAt)}</strong>
              <div className="slot-legend">
                <span>
                  <i />
                  Disponible
                </span>
                <span>
                  <i />
                  Ocupado
                </span>
              </div>
            </header>
            <div className="slot-list">
              {daySlots.map((slot) => {
                const occupied = slot.status === "booked";
                return (
                  <button
                    type="button"
                    disabled={occupied}
                    className={`${selected === slot._id ? "active" : ""} ${occupied ? "occupied" : ""}`}
                    key={slot._id}
                    onClick={() => setSelected(slot._id)}
                    aria-label={`${formatSlot(slot.startsAt)}${occupied ? ", ocupado" : ""}`}
                  >
                    {formatTime(slot.startsAt)}
                  </button>
                );
              })}
            </div>
          </div>
          {dayAvailable && (
            <button
              className="primary-button"
              type="button"
              onClick={requestAppointment}
            >
              {auth.user ? "Solicitar cita" : "Inicia sesión para agendar"}
            </button>
          )}
        </>
      ) : (
        <p>No hay horarios publicados por ahora.</p>
      )}
      {status && <small role="status">{status}</small>}
    </div>
  );
}
