export function parseDoctorQuery(input = {}) {
  const specialty =
    typeof input.especialidad === "string"
      ? input.especialidad.trim().slice(0, 60)
      : "";
  const search = typeof input.q === "string" ? input.q.trim().slice(0, 80) : "";
  const parsedLimit = Number.parseInt(input.limit, 10);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 100)
    : 50;
  return { specialty, search, limit };
}

export function validateRating(input = {}) {
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  return {
    valid:
      Boolean(userId) &&
      Number.isInteger(input.estrellas) &&
      input.estrellas >= 1 &&
      input.estrellas <= 5,
    userId,
    stars: input.estrellas,
  };
}

export function validateComment(input = {}) {
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  const name = typeof input.nombre === "string" ? input.nombre.trim() : "";
  const text = typeof input.texto === "string" ? input.texto.trim() : "";
  return {
    valid:
      Boolean(userId && name && text) &&
      name.length <= 80 &&
      text.length <= 800,
    userId,
    name,
    text,
  };
}
