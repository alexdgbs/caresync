export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "CareSync API",
    version: "1.1.0",
    description: "API de directorio, verificación profesional y citas médicas",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/health": {
      get: {
        summary: "Estado del servicio",
        responses: { 200: { description: "Servicio disponible" } },
      },
    },
    "/medicos": {
      get: {
        summary: "Lista especialistas verificados",
        responses: { 200: { description: "Directorio disponible" } },
      },
    },
    "/medicos/{id}": {
      get: {
        summary: "Obtiene un especialista",
        responses: {
          200: { description: "Perfil encontrado" },
          404: { description: "Perfil inexistente" },
        },
      },
    },
    "/medicos/{id}/valorar": {
      post: {
        summary: "Valora después de una cita completada",
        responses: {
          200: { description: "Valoración guardada" },
          403: { description: "Cita completada requerida" },
        },
      },
    },
    "/medicos/{id}/comentarios/{commentId}": {
      patch: {
        summary: "Edita el comentario de la cuenta autenticada",
        responses: {
          200: { description: "Comentario actualizado" },
          403: { description: "Autor requerido" },
        },
      },
      delete: {
        summary: "Elimina el comentario de la cuenta autenticada",
        responses: {
          204: { description: "Comentario eliminado" },
          403: { description: "Autor requerido" },
        },
      },
    },
    "/medicos/me/profile": {
      patch: {
        summary:
          "Actualiza la información pública del perfil médico verificado",
        responses: {
          200: { description: "Perfil actualizado" },
          403: { description: "Rol médico requerido" },
        },
      },
    },
    "/auth/me": {
      patch: {
        summary: "Actualiza los datos de la cuenta autenticada",
        responses: {
          200: { description: "Cuenta actualizada" },
          401: { description: "Sesión requerida" },
        },
      },
    },
    "/auth/google": {
      post: {
        summary: "Valida una credencial de Google y crea una sesión segura",
        responses: {
          200: { description: "Sesión iniciada" },
          401: { description: "Credencial inválida" },
        },
      },
    },
    "/appointments": {
      get: {
        summary: "Separa consultas personales y citas de la práctica médica",
        responses: { 200: { description: "Listas personal y practice" } },
      },
      post: {
        summary: "Solicita una cita como paciente o médico",
        responses: {
          201: { description: "Solicitud creada" },
          400: { description: "No se permite agendar consigo mismo" },
          409: { description: "Horario ocupado" },
        },
      },
    },
    "/appointments/schedule/me": {
      get: {
        summary: "Consulta la agenda semanal del médico",
        responses: { 200: { description: "Agenda configurada" } },
      },
      put: {
        summary: "Actualiza reglas semanales, duración y fechas bloqueadas",
        responses: {
          200: { description: "Agenda actualizada" },
          400: { description: "Reglas inválidas" },
          409: { description: "La agenda dejaría fuera citas activas" },
        },
      },
    },
    "/medical-applications/me": {
      get: {
        summary: "Consulta la solicitud médica de la cuenta",
        responses: { 200: { description: "Solicitud actual" } },
      },
      put: {
        summary: "Guarda una solicitud médica",
        responses: { 200: { description: "Borrador guardado" } },
      },
    },
    "/medical-applications/me/submit": {
      post: {
        summary: "Envía una solicitud médica a revisión",
        responses: {
          200: { description: "Solicitud enviada" },
          400: { description: "Faltan documentos" },
        },
      },
    },
    "/medical-applications": {
      get: {
        summary: "Lista solicitudes para revisión administrativa",
        responses: {
          200: { description: "Solicitudes disponibles" },
          403: { description: "Rol administrativo requerido" },
        },
      },
    },
    "/medical-applications/{id}/review": {
      patch: {
        summary: "Registra una decisión administrativa",
        responses: {
          200: { description: "Decisión registrada" },
          409: { description: "Solicitud no revisable" },
        },
      },
    },
    "/medical-applications/{id}": {
      delete: {
        summary: "Elimina una solicitud rechazada, sus documentos y auditoría",
        responses: {
          204: { description: "Solicitud eliminada" },
          409: { description: "La solicitud no está rechazada" },
        },
      },
    },
    "/medical-applications/{id}/doctor": {
      delete: {
        summary:
          "Retira un perfil médico activo del directorio y cancela su agenda futura",
        responses: {
          200: { description: "Perfil retirado" },
          409: { description: "El perfil no está activo" },
        },
      },
    },
    "/medical-applications/{id}/personal-data": {
      delete: {
        summary:
          "Elimina irreversiblemente los datos profesionales tras retirar el perfil",
        responses: {
          204: {
            description:
              "Datos eliminados; referencias históricas anonimizadas",
          },
          400: { description: "Confirmación requerida" },
          409: { description: "Primero debe retirarse el perfil" },
        },
      },
    },
  },
};
