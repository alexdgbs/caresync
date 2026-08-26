const STATUS_LABELS = {
  connected: "Tiempo real conectado",
  connecting: "Conectando…",
  disconnected: "Sin conexión en tiempo real",
};

export default function Footer({ realtimeStatus = "disconnected" }) {
  return (
    <footer className="site-footer site-footer--compact">
      <div className="page-width footer-main-compact">
        <div className="footer-brand">
          <a className="brand" href="/">
            CareSync
          </a>
          <p>Información médica para decidir con contexto.</p>
        </div>
        <nav aria-label="Navegación del pie de página">
          <a href="/#directorio">Directorio</a>
          <a href="/#metodo">Cómo funciona</a>
          <a href="/#acerca">Criterios</a>
        </nav>
      </div>
      <div className="page-width footer-bottom">
        <span>© {new Date().getFullYear()} CareSync</span>
        <span>Información médica para decidir con contexto.</span>
        <span className={`system-status system-status--${realtimeStatus}`}>
          <i /> {STATUS_LABELS[realtimeStatus]}
        </span>
      </div>
    </footer>
  );
}
