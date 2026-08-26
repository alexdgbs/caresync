import { useCallback, useEffect, useState } from "react";
import AdminConfirmationDialog from "../components/account/AdminConfirmationDialog";
import { ADMIN_DIALOGS } from "../components/account/adminDialogs";
import { accountApi } from "../services/accountApi";
import { SOCKET_URL } from "../services/apiConfig";
import { connectAuthenticatedSocket } from "../services/socketClient";

const date = (value) =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const APPOINTMENT = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};
const APPLICATION = {
  draft: "Borrador",
  submitted: "En revisión",
  changes_requested: "Requiere cambios",
  approved: "Aprobada",
  rejected: "Rechazada",
  withdrawn: "Retirada",
};
const DOCUMENTS = [
  { type: "identity", label: "Identificación oficial" },
  { type: "professional_license", label: "Cédula profesional" },
  {
    type: "specialty_license",
    label: "Cédula de especialidad",
    optional: true,
  },
];

let googleCredentialHandler;
let googleInitialized = false;

function GoogleLoginButton({ auth, setStatus, setBusy }) {
  const [ready, setReady] = useState(Boolean(window.google?.accounts?.id));
  useEffect(() => {
    if (ready) return undefined;
    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    const handleLoad = () => setReady(true);
    script?.addEventListener("load", handleLoad);
    return () => script?.removeEventListener("load", handleLoad);
  }, [ready]);
  const buttonRef = useCallback(
    (element) => {
      if (!element) return;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
      if (!clientId || !ready || !window.google?.accounts?.id) return;
      googleCredentialHandler = async ({ credential }) => {
        setBusy(true);
        setStatus("");
        try {
          await auth.googleLogin(credential);
        } catch (error) {
          setStatus(error.message);
        } finally {
          setBusy(false);
        }
      };
      if (!googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => googleCredentialHandler?.(response),
        });
        googleInitialized = true;
      }
      element.replaceChildren();
      const width = Math.min(360, Math.max(240, element.clientWidth));
      window.google.accounts.id.renderButton(element, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width,
        locale: "es",
      });
    },
    [auth, ready, setBusy, setStatus],
  );
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID)
    return (
      <p className="form-status auth-status">
        Configura el Client ID de Google para iniciar sesión.
      </p>
    );
  return <div className="google-login-button" ref={buttonRef} />;
}

function AuthForm({ auth }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="account-auth page-width">
      <div className="account-auth__intro">
        <span className="eyebrow">Tu cuenta CareSync</span>
        <h1>Tu salud, en un solo lugar.</h1>
        <p>
          Consulta tus citas, administra tu perfil y mantén tu información
          médica organizada.
        </p>
      </div>
      <div className="google-auth-panel">
        <header>
          <span>Acceso seguro</span>
          <h2>Inicia sesión</h2>
          <p>Usa tu cuenta de Google para continuar.</p>
        </header>
        <GoogleLoginButton
          auth={auth}
          setStatus={setStatus}
          setBusy={setBusy}
        />
        {busy && (
          <p className="form-status auth-status" role="status">
            Conectando con Google…
          </p>
        )}
        {status && (
          <p className="form-status auth-status" role="status">
            {status}
          </p>
        )}
        <small className="google-auth-panel__privacy">
          CareSync sólo recibe tu nombre, correo e identificador de cuenta.
        </small>
      </div>
    </section>
  );
}

function MedicalApplicationPanel({ auth }) {
  const [application, setApplication] = useState(null);
  const [open, setOpen] = useState(false);
  const [dismissedDecision, setDismissedDecision] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [form, setForm] = useState({
    legalName: auth.user.nombre,
    professionalLicense: "",
    specialty: "",
    specialtyLicense: "",
    phone: "",
    location: "",
  });
  const load = useCallback(
    () =>
      accountApi
        .myMedicalApplication()
        .then(({ application: current }) => {
          setApplication(current);
          if (current) {
            setForm({
              legalName: current.legalName,
              professionalLicense: current.professionalLicense,
              specialty: current.specialty,
              specialtyLicense: current.specialtyLicense || "",
              phone: current.phone || "",
              location: current.location || "",
            });
            setOpen(["draft", "changes_requested"].includes(current.status));
          }
        })
        .catch((error) => setMessage(error.message)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await accountApi.saveMedicalApplication(form);
      setApplication(result.application);
      setMessage("Datos guardados. Adjunta tus documentos.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const upload = async (type, file) => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await accountApi.uploadMedicalDocument(type, file);
      setApplication(result.application);
      setMessage("Documento guardado de forma privada.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const removeDocument = async (type) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await accountApi.deleteMedicalDocument(type);
      setApplication(result.application);
      setMessage("Documento eliminado.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const discard = async () => {
    if (!application) return;
    setBusy(true);
    setMessage("");
    try {
      await accountApi.discardMedicalApplication();
      setApplication(null);
      setForm({
        legalName: auth.user.nombre,
        professionalLicense: "",
        specialty: "",
        specialtyLicense: "",
        phone: "",
        location: "",
      });
      setOpen(false);
      setConfirmDiscard(false);
      setMessage("Solicitud y documentos eliminados de forma permanente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    try {
      const result = await accountApi.submitMedicalApplication();
      setApplication(result.application);
      setOpen(false);
      setMessage("Solicitud enviada para revisión.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  if (
    !application &&
    auth.user.medicalDecision?.status === "rejected" &&
    !dismissedDecision
  )
    return (
      <div className="decision-followup">
        <ApplicationDecision
          application={{
            status: "rejected",
            reviewNote: auth.user.medicalDecision.note,
          }}
        />
        <button
          className="secondary-button"
          onClick={() => {
            setDismissedDecision(true);
            setOpen(true);
          }}
        >
          Iniciar una nueva solicitud
        </button>
      </div>
    );
  if (
    application &&
    !["draft", "changes_requested"].includes(application.status)
  )
    return <ApplicationDecision application={application} />;
  return (
    <section className="application-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Profesionales</span>
          <h2>Solicita tu perfil médico</h2>
          <p>Validaremos tu información contra el registro oficial.</p>
        </div>
        {open ? (
          <button className="secondary-button" onClick={() => setOpen(false)}>
            Ocultar formulario
          </button>
        ) : (
          <button className="secondary-button" onClick={() => setOpen(true)}>
            {application ? "Continuar solicitud" : "Iniciar solicitud"}
          </button>
        )}
      </div>
      {application?.reviewNote && (
        <p className="review-note">
          <strong>Cambios solicitados:</strong> {application.reviewNote}
        </p>
      )}
      {!open && message && (
        <p className="form-status application-form-status" role="status">
          {message}
        </p>
      )}
      {open && (
        <>
          <form className="medical-form" onSubmit={save}>
            <Field
              label="Nombre legal"
              required
              value={form.legalName}
              set={(value) => setForm({ ...form, legalName: value })}
              pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.' -]+"
              title="Usa únicamente letras"
              maxLength={120}
            />
            <Field
              label="Cédula profesional"
              required
              value={form.professionalLicense}
              set={(value) =>
                setForm({
                  ...form,
                  professionalLicense: value.replace(/\D/g, ""),
                })
              }
              inputMode="numeric"
              pattern="[0-9]+"
              title="Usa únicamente números"
              maxLength={30}
            />
            <Field
              label="Especialidad"
              required
              value={form.specialty}
              set={(value) =>
                setForm({ ...form, specialty: value.replace(/[0-9]/g, "") })
              }
              pattern="[^0-9]+"
              title="La especialidad no puede contener números"
              maxLength={100}
            />
            <Field
              label="Cédula de especialidad"
              value={form.specialtyLicense}
              set={(value) =>
                setForm({ ...form, specialtyLicense: value.replace(/\D/g, "") })
              }
              inputMode="numeric"
              pattern="[0-9]*"
              title="Usa únicamente números"
              maxLength={30}
            />
            <Field
              label="Teléfono celular (México)"
              value={form.phone}
              set={(value) =>
                setForm({
                  ...form,
                  phone: value.replace(/\D/g, "").slice(0, 10),
                })
              }
              inputMode="numeric"
              pattern="[0-9]{10}"
              title="Ingresa exactamente 10 números, sin espacios"
              maxLength={10}
            />
            <Field
              label="Consultorio o ciudad"
              value={form.location}
              set={(value) => setForm({ ...form, location: value })}
            />
            <button className="primary-button" disabled={busy}>
              {busy
                ? "Guardando…"
                : application
                  ? "Actualizar información"
                  : "Guardar y continuar"}
            </button>
          </form>
          {message && (
            <p className="form-status application-form-status" role="status">
              {message}
            </p>
          )}
          {application && (
            <div className="document-upload">
              <h3>Documentos privados</h3>
              <p className="field-help">
                Identificación y cédula profesional son obligatorias. La imagen
                o PDF de la cédula de especialidad sólo se solicita si
                capturaste ese número.
              </p>
              {DOCUMENTS.filter(
                (document) =>
                  !document.optional || application.specialtyLicense,
              ).map((document) => {
                const saved = application.documents.find(
                  (item) => item.type === document.type,
                );
                return (
                  <div className="document-upload__row" key={document.type}>
                    <label>
                      <span>
                        {document.label}
                        <small>
                          {saved ? saved.name : "PDF, JPG o PNG · máximo 5 MB"}
                        </small>
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={busy}
                        onChange={(e) =>
                          upload(document.type, e.target.files[0])
                        }
                      />
                      <strong>{saved ? "Reemplazar" : "Adjuntar"}</strong>
                    </label>
                    {saved && (
                      <button
                        className="document-remove"
                        type="button"
                        disabled={busy}
                        onClick={() => removeDocument(document.type)}
                      >
                        Quitar archivo
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                className="primary-button"
                disabled={busy}
                onClick={submit}
              >
                Enviar a revisión
              </button>
            </div>
          )}
          {application && (
            <div className="application-actions">
              <button
                type="button"
                onClick={() => setConfirmDiscard(true)}
                disabled={busy}
              >
                Eliminar solicitud
              </button>
              <small>
                Elimina permanentemente de la base de datos el borrador y todos
                sus archivos. Si sólo quieres continuar después, usa “Ocultar
                formulario”.
              </small>
            </div>
          )}
        </>
      )}
      <AdminConfirmationDialog
        type={confirmDiscard ? "discard" : null}
        busy={busy}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={discard}
      />
    </section>
  );
}
function Field({ label, value, set, required = false, ...inputProps }) {
  return (
    <label>
      {label}
      {!required && <small>Opcional</small>}
      <input
        required={required}
        value={value}
        onChange={(e) => set(e.target.value)}
        {...inputProps}
      />
    </label>
  );
}

function ApplicationDecision({ application }) {
  const title =
    application.status === "approved"
      ? "Tu solicitud fue aprobada"
      : application.status === "rejected"
        ? "Tu solicitud no fue aprobada"
        : application.status === "withdrawn"
          ? "Tu perfil fue retirado"
          : "Tu solicitud está en revisión";
  return (
    <section className="application-summary">
      <div>
        <span className="eyebrow">Verificación médica</span>
        <h2>{title}</h2>
      </div>
      <span
        className={`application-badge application-badge--${application.status}`}
      >
        {APPLICATION[application.status]}
      </span>
      {application.reviewNote && (
        <p>
          <strong>Mensaje de revisión:</strong> {application.reviewNote}
        </p>
      )}
      <small>
        {application.status === "submitted"
          ? "Compararemos tus datos con el Registro Nacional de Profesionistas."
          : application.status === "approved"
            ? "Tu perfil profesional ya está activo."
            : application.status === "withdrawn"
              ? "Tu cuenta continúa activa como paciente."
              : "Puedes consultar el motivo indicado por el equipo de revisión."}
      </small>
    </section>
  );
}

function DoctorVerificationStatus() {
  const [application, setApplication] = useState(null);
  useEffect(() => {
    accountApi
      .myMedicalApplication()
      .then(({ application: current }) => setApplication(current))
      .catch(() => {});
  }, []);
  return application?.status === "approved" ? (
    <ApplicationDecision application={application} />
  ) : null;
}

function AccountSettings({ auth }) {
  const [form, setForm] = useState({
    nombre: auth.user.nombre,
    telefono: auth.user.telefono || "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await auth.updateProfile(form);
      setMessage("Cuenta actualizada.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    setForm({ nombre: auth.user.nombre, telefono: auth.user.telefono || "" });
  }, [auth.user.nombre, auth.user.telefono]);
  return (
    <section className="settings-panel">
      <header>
        <span className="eyebrow">Mi cuenta</span>
        <h2>Datos personales</h2>
        <p>
          {auth.user.role === "doctor"
            ? "El nombre profesional proviene de tu verificación médica."
            : "El correo de acceso no cambia desde aquí."}
        </p>
      </header>
      <form className="settings-grid" onSubmit={save}>
        <label>
          {auth.user.role === "doctor"
            ? "Nombre profesional verificado"
            : "Nombre"}
          <input
            disabled={auth.user.role === "doctor"}
            required
            minLength="2"
            maxLength="80"
            pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.' -]+"
            title="Usa únicamente letras"
            value={form.nombre}
            onChange={(event) =>
              setForm({ ...form, nombre: event.target.value })
            }
          />
        </label>
        <label>
          Teléfono celular (México)
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            title="Ingresa los 10 números, sin espacios"
            maxLength="10"
            value={form.telefono}
            onChange={(event) =>
              setForm({
                ...form,
                telefono: event.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
          />
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? "Guardando…" : "Guardar cuenta"}
        </button>
        {message && <small role="status">{message}</small>}
      </form>
    </section>
  );
}

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];
const DEFAULT_SCHEDULE_RANGE = { from: 1, to: 5, start: "09:00", end: "14:00" };
const dayPosition = (day) => DAYS.findIndex((item) => item.value === day);
const rulesToRanges = (rules = []) => {
  const sorted = [...rules].sort(
    (a, b) => dayPosition(a.day) - dayPosition(b.day),
  );
  const ranges = [];
  for (const rule of sorted) {
    const previous = ranges.at(-1);
    if (
      previous &&
      previous.start === rule.start &&
      previous.end === rule.end &&
      dayPosition(rule.day) === dayPosition(previous.to) + 1
    )
      previous.to = rule.day;
    else
      ranges.push({
        from: rule.day,
        to: rule.day,
        start: rule.start,
        end: rule.end,
      });
  }
  return ranges;
};
const rangesToRules = (ranges) =>
  ranges.flatMap((range) => {
    const from = dayPosition(range.from);
    const to = dayPosition(range.to);
    if (from < 0 || to < from) return [];
    return DAYS.slice(from, to + 1).map((day) => ({
      day: day.value,
      start: range.start,
      end: range.end,
    }));
  });
function ScheduleSettings() {
  const [schedule, setSchedule] = useState({
    duration: 45,
    timezoneOffset: -new Date().getTimezoneOffset(),
    ranges: [DEFAULT_SCHEDULE_RANGE],
    blockedDates: [],
  });
  const [blockedDate, setBlockedDate] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    accountApi
      .mySchedule()
      .then((result) => {
        const saved = rulesToRanges(result.rules);
        setSchedule({
          ...result,
          ranges: [saved[0] || DEFAULT_SCHEDULE_RANGE],
        });
      })
      .catch((error) => setMessage(error.message));
  }, []);
  const updateRange = (index, field, value) =>
    setSchedule((current) => ({
      ...current,
      ranges: current.ranges.map((range, position) => {
        if (position !== index) return range;
        const next = {
          ...range,
          [field]: ["from", "to"].includes(field) ? Number(value) : value,
        };
        if (field === "from" && dayPosition(next.to) < dayPosition(next.from))
          next.to = next.from;
        return next;
      }),
    }));
  const addBlockedDate = () => {
    if (!blockedDate || schedule.blockedDates.includes(blockedDate)) return;
    setSchedule((current) => ({
      ...current,
      blockedDates: [...current.blockedDates, blockedDate].sort(),
    }));
    setBlockedDate("");
  };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await accountApi.updateSchedule({
        duration: schedule.duration,
        blockedDates: schedule.blockedDates,
        rules: rangesToRules(schedule.ranges),
        timezoneOffset: -new Date().getTimezoneOffset(),
      });
      setSchedule({ ...result, ranges: rulesToRanges(result.rules) });
      setMessage("Agenda actualizada.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  const range = schedule.ranges[0];
  return (
    <section className="settings-panel schedule-settings">
      <header>
        <span className="eyebrow">Agenda</span>
        <h2>Horario semanal</h2>
        <p>
          Define tu rango habitual. Las horas disponibles se generan
          automáticamente.
        </p>
      </header>
      <form onSubmit={save}>
        <label className="duration-field">
          Duración de consulta
          <select
            value={schedule.duration}
            onChange={(event) =>
              setSchedule({ ...schedule, duration: Number(event.target.value) })
            }
          >
            {[15, 30, 45, 60, 90].map((value) => (
              <option key={value} value={value}>
                {value} minutos
              </option>
            ))}
          </select>
        </label>
        <div className="schedule-rules">
          <div className="schedule-rule schedule-rule--single">
            <label>
              De
              <select
                value={range.from}
                onChange={(event) => updateRange(0, "from", event.target.value)}
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              A
              <select
                value={range.to}
                onChange={(event) => updateRange(0, "to", event.target.value)}
              >
                {DAYS.slice(dayPosition(range.from)).map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Abre
              <input
                type="time"
                value={range.start}
                onChange={(event) =>
                  updateRange(0, "start", event.target.value)
                }
              />
            </label>
            <label>
              Cierra
              <input
                type="time"
                value={range.end}
                onChange={(event) => updateRange(0, "end", event.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="blocked-dates">
          <h3>Excepciones</h3>
          <p>
            Bloquea únicamente fechas en las que no atenderás, como vacaciones o
            días festivos.
          </p>
          <div>
            <input
              aria-label="Fecha no disponible"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={blockedDate}
              onChange={(event) => setBlockedDate(event.target.value)}
            />
            <button type="button" onClick={addBlockedDate}>
              Bloquear fecha
            </button>
          </div>
          {schedule.blockedDates.length > 0 && (
            <ul>
              {schedule.blockedDates.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSchedule((current) => ({
                        ...current,
                        blockedDates: current.blockedDates.filter(
                          (dateItem) => dateItem !== item,
                        ),
                      }))
                    }
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="primary-button" disabled={busy}>
          {busy ? "Guardando…" : "Guardar agenda"}
        </button>
        {message && <small role="status">{message}</small>}
      </form>
    </section>
  );
}

function PracticeSettings({ doctorId }) {
  const [form, setForm] = useState({
    price: "",
    description: "",
    phone: "",
    location: "",
    languages: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    accountApi
      .doctorProfile(doctorId)
      .then((doctor) =>
        setForm({
          price: doctor.precio || "",
          description: doctor.descripcion || "",
          phone: doctor.telefono || "",
          location: doctor.ubicacion || "",
          languages: (doctor.idiomas || []).join(", "),
        }),
      )
      .catch(() => {});
  }, [doctorId]);
  const field = (name) => (event) =>
    setForm({ ...form, [name]: event.target.value });
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await accountApi.updateDoctorProfile({
        ...form,
        price: Number(form.price),
        languages: form.languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setMessage("Perfil profesional actualizado.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="settings-panel">
      <header>
        <span className="eyebrow">Perfil profesional</span>
        <h2>Información pública</h2>
        <p>La cédula y especialidad requieren revisión administrativa.</p>
      </header>
      <form className="settings-grid professional-settings" onSubmit={save}>
        <label>
          Precio en MXN
          <input
            type="number"
            min="0"
            max="100000"
            step="1"
            required
            value={form.price}
            onChange={field("price")}
          />
        </label>
        <label>
          Teléfono de consulta (México)
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            title="Ingresa los 10 números, sin espacios"
            maxLength="10"
            value={form.phone}
            onChange={(event) =>
              setForm({
                ...form,
                phone: event.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
          />
        </label>
        <label>
          Consultorio o ciudad
          <input
            maxLength="160"
            value={form.location}
            onChange={field("location")}
          />
        </label>
        <label>
          Idiomas, separados por coma
          <input value={form.languages} onChange={field("languages")} />
        </label>
        <label className="wide">
          Descripción profesional
          <textarea
            maxLength="500"
            value={form.description}
            onChange={field("description")}
          />
        </label>
        <button className="primary-button" disabled={busy}>
          {busy ? "Guardando…" : "Guardar perfil"}
        </button>
        {message && <small role="status">{message}</small>}
      </form>
    </section>
  );
}

function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [audit, setAudit] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [dialogValue, setDialogValue] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [dialogBusy, setDialogBusy] = useState(false);
  const load = useCallback(
    () =>
      accountApi
        .medicalApplications()
        .then(({ applications }) => {
          setItems(applications);
          setSelected(
            (current) =>
              applications.find((item) => item.id === current?.id) ||
              applications[0] ||
              null,
          );
        })
        .catch((error) => setMessage(error.message)),
    [],
  );
  useEffect(() => {
    load();
    if (!SOCKET_URL) return undefined;
    let socket;
    let active = true;
    connectAuthenticatedSocket()
      .then((connected) => {
        if (!active) return connected.disconnect();
        socket = connected;
        socket.on("solicitud_medica_actualizada", load);
      })
      .catch(() => {});
    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [load]);
  useEffect(() => {
    if (selected)
      accountApi
        .applicationAudit(selected.id)
        .then(({ events }) => setAudit(events));
    else setAudit([]);
  }, [selected]);
  const review = async (status) => {
    try {
      await accountApi.reviewMedicalApplication(selected.id, {
        status,
        reviewNote: note,
      });
      setNote("");
      setMessage("Decisión registrada.");
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const openDialog = (type) => {
    setDialog(type);
    setDialogValue(ADMIN_DIALOGS[type].initial || "");
    setDialogError("");
  };
  const closeDialog = () => {
    if (!dialogBusy) {
      setDialog(null);
      setDialogValue("");
      setDialogError("");
    }
  };
  const confirmDialog = async () => {
    if (dialog === "erase" && dialogValue !== "ELIMINAR") {
      setDialogError("Escribe ELIMINAR exactamente para continuar.");
      return;
    }
    if (dialog === "withdraw" && !dialogValue.trim()) {
      setDialogError("Escribe el motivo de la baja.");
      return;
    }
    setDialogBusy(true);
    setDialogError("");
    try {
      if (dialog === "withdraw")
        await accountApi.withdrawDoctor(selected.id, dialogValue.trim());
      else if (dialog === "erase")
        await accountApi.eraseDoctorData(selected.id, dialogValue);
      else await accountApi.deleteMedicalApplication(selected.id);
      setDialog(null);
      setDialogValue("");
      setSelected(null);
      setMessage("");
      await load();
    } catch (error) {
      setDialogError(error.message);
    } finally {
      setDialogBusy(false);
    }
  };
  return (
    <div className="admin-layout">
      <aside>
        <h2>Solicitudes</h2>
        {items.map((item) => (
          <button
            className={selected?.id === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setSelected(item)}
          >
            <strong>{item.legalName}</strong>
            <span>{APPLICATION[item.status]}</span>
          </button>
        ))}
        {!items.length && <p>No hay solicitudes.</p>}
      </aside>
      <section className="application-review">
        {selected && (
          <>
            <header>
              <div>
                <span className="eyebrow">Revisión profesional</span>
                <h2>{selected.legalName}</h2>
              </div>
              <span
                className={`application-badge application-badge--${selected.status}`}
              >
                {APPLICATION[selected.status]}
              </span>
            </header>
            <dl>
              <Info term="Cédula" value={selected.professionalLicense} />
              <Info term="Especialidad" value={selected.specialty} />
              <Info term="Correo" value={selected.applicant?.email} />
              <Info
                term="Ubicación"
                value={selected.location || "Sin registrar"}
              />
            </dl>
            <div className="review-documents">
              <h3>Documentos</h3>
              {selected.documents.map((document) => (
                <button
                  key={document.id}
                  onClick={() =>
                    accountApi.openMedicalDocument(selected.id, document.id)
                  }
                >
                  {DOCUMENTS.find((item) => item.type === document.type)?.label}
                  <span>Abrir</span>
                </button>
              ))}
            </div>
            {["submitted", "changes_requested"].includes(selected.status) && (
              <div className="review-actions">
                <label>
                  Nota de revisión
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Obligatoria al pedir cambios o rechazar"
                  />
                </label>
                <div>
                  <button onClick={() => review("changes_requested")}>
                    Pedir cambios
                  </button>
                  <button onClick={() => review("rejected")}>Rechazar</button>
                  <button
                    className="primary-button"
                    onClick={() => review("approved")}
                  >
                    Aprobar perfil
                  </button>
                </div>
              </div>
            )}
            <div className="audit-log">
              <h3>Historial</h3>
              {audit.map((event) => (
                <p key={event.id}>
                  <time>{date(event.createdAt)}</time>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <span>{event.actor?.nombre}</span>
                </p>
              ))}
            </div>
            {selected.status === "approved" && (
              <div className="danger-zone">
                <div>
                  <strong>Retirar del directorio</strong>
                  <span>Oculta el perfil y cancela sus citas futuras.</span>
                </div>
                <button type="button" onClick={() => openDialog("withdraw")}>
                  Retirar perfil
                </button>
              </div>
            )}
            {selected.status === "withdrawn" && (
              <div className="danger-zone danger-zone--critical">
                <div>
                  <strong>Eliminar datos profesionales</strong>
                  <span>
                    Acción irreversible. Las citas conservarán únicamente una
                    referencia anónima.
                  </span>
                </div>
                <button type="button" onClick={() => openDialog("erase")}>
                  Eliminar datos
                </button>
              </div>
            )}
            {selected.status === "rejected" && (
              <div className="danger-zone">
                <div>
                  <strong>Eliminar solicitud</strong>
                  <span>Borra también documentos e historial.</span>
                </div>
                <button type="button" onClick={() => openDialog("remove")}>
                  Eliminar definitivamente
                </button>
              </div>
            )}
          </>
        )}
      </section>
      {message && <p className="form-status">{message}</p>}
      <AdminConfirmationDialog
        type={dialog}
        value={dialogValue}
        error={dialogError}
        busy={dialogBusy}
        onValue={setDialogValue}
        onClose={closeDialog}
        onConfirm={confirmDialog}
      />
    </div>
  );
}
function Info({ term, value }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AppointmentList({ items, title, mode, onUpdate }) {
  return (
    <section className="appointments-list">
      <h2>{title}</h2>
      {items.length ? (
        items.map((item) => {
          const active = !["cancelled", "completed"].includes(item.status);
          const patientCanCancel =
            new Date(item.slot?.startsAt).getTime() - Date.now() >=
            24 * 60 * 60 * 1000;
          return (
            <article key={item.id}>
              <div>
                <strong>
                  {mode === "practice"
                    ? item.patient?.nombre
                    : item.doctor?.nombre}
                </strong>
                <span>
                  {mode === "practice"
                    ? item.patient?.email
                    : item.doctor?.especialidad}
                </span>
                <time>{date(item.slot?.startsAt)}</time>
                {mode === "personal" && active && !patientCanCancel && (
                  <small>Para cancelar, contacta al consultorio.</small>
                )}
              </div>
              <span
                className={`appointment-status appointment-status--${item.status}`}
              >
                {APPOINTMENT[item.status]}
              </span>
              {mode === "practice" && item.status === "pending" && (
                <button onClick={() => onUpdate(item.id, "confirmed")}>
                  Confirmar
                </button>
              )}
              {active && (mode === "practice" || patientCanCancel) && (
                <button onClick={() => onUpdate(item.id, "cancelled")}>
                  Cancelar
                </button>
              )}
              {mode === "practice" && item.status === "confirmed" && (
                <button onClick={() => onUpdate(item.id, "completed")}>
                  Completar
                </button>
              )}
            </article>
          );
        })
      ) : (
        <p className="empty-state">No hay citas en esta sección.</p>
      )}
      <p className="cancellation-policy">
        Los pacientes pueden cancelar en línea hasta 24 horas antes.
      </p>
    </section>
  );
}

function Dashboard({ auth }) {
  const [appointments, setAppointments] = useState({
    personal: [],
    practice: [],
  });
  const [status, setStatus] = useState("");
  const load = useCallback(
    () =>
      auth.user.role === "admin"
        ? Promise.resolve()
        : accountApi
            .appointments()
            .then(setAppointments)
            .catch((error) => setStatus(error.message)),
    [auth.user.role],
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!SOCKET_URL) return undefined;
    let socket;
    let active = true;
    connectAuthenticatedSocket()
      .then((connected) => {
        if (!active) return connected.disconnect();
        socket = connected;
        socket.on("cita_actualizada", load);
        socket.on("solicitud_medica_actualizada", auth.refresh);
      })
      .catch(() => {});
    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [load, auth.refresh]);
  const update = async (id, next) => {
    try {
      await accountApi.updateAppointment(id, next);
      load();
    } catch (error) {
      setStatus(error.message);
    }
  };
  return (
    <section className="dashboard page-width">
      {auth.loginNotice && (
        <p className="login-notice" role="status">
          {auth.loginNotice}
        </p>
      )}
      <header>
        <div>
          <span className="eyebrow">
            {auth.user.role === "doctor"
              ? "Panel médico"
              : auth.user.role === "admin"
                ? "Administración"
                : "Mis citas"}
          </span>
          <h1>Hola, {auth.user.nombre}.</h1>
        </div>
      </header>
      <div className="dashboard-session">
        <span>{auth.user.email}</span>
        <button className="text-button" onClick={auth.logout}>
          Cerrar sesión
        </button>
      </div>
      {auth.user.role === "admin" ? (
        <AdminDashboard />
      ) : (
        <>
          <div className="dashboard-intro">
            <p>
              {auth.user.role === "doctor"
                ? "También puedes consultar a otro especialista desde tu cuenta."
                : "Elige un especialista y consulta sus horarios disponibles."}
            </p>
            <a className="primary-button" href="/#directorio">
              Buscar especialista
            </a>
          </div>
          <AccountSettings auth={auth} />
          {auth.user.role === "patient" && (
            <MedicalApplicationPanel auth={auth} />
          )}
          {auth.user.role === "doctor" && (
            <>
              <DoctorVerificationStatus />
              <PracticeSettings doctorId={auth.user.doctorId} />
              <ScheduleSettings />
            </>
          )}
          <AppointmentList
            items={appointments.personal}
            title="Mis consultas"
            mode="personal"
            onUpdate={update}
          />
          {auth.user.role === "doctor" && (
            <AppointmentList
              items={appointments.practice}
              title="Citas de mis pacientes"
              mode="practice"
              onUpdate={update}
            />
          )}
        </>
      )}
      {status && <p className="form-status">{status}</p>}
    </section>
  );
}

export default function AccountPage({ auth }) {
  return auth.user ? <Dashboard auth={auth} /> : <AuthForm auth={auth} />;
}
