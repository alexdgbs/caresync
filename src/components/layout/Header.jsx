import { useEffect, useState } from "react";
import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem("caresync-theme");
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export default function Header({ user }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.background =
      theme === "dark" ? "#0f211d" : "#f7f9f8";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0f211d" : "#f7f9f8");
    localStorage.setItem("caresync-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const isDark = theme === "dark";

  return (
    <>
      <header className="site-header">
        <div className="header-inner page-width">
          <a className="brand" href="/" aria-label="CareSync, inicio">
            CareSync
          </a>
          <nav className="desktop-nav" aria-label="Navegación principal">
            <a href="/#metodo">Cómo funciona</a>
            <a href="/#acerca">Nosotros</a>
          </nav>
          <div className="header-actions">
            <div className="header-desktop-actions">
              <a className="nav-contact" href="/#directorio">
                Encontrar médico
              </a>
              <a className="account-link" href="/cuenta">
                {user ? "Mi cuenta" : "Ingresar"}
              </a>
            </div>
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={
                isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
              title={isDark ? "Modo claro" : "Modo oscuro"}
            >
              {isDark ? <FiSun /> : <FiMoon />}
            </button>
            <button
              className="mobile-menu-toggle"
              type="button"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="mobile-menu-layer" id="mobile-navigation">
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="mobile-navigation" aria-label="Navegación móvil">
            <span className="mobile-navigation__label">Navegación</span>
            <div className="mobile-navigation__links">
              <a href="/#directorio" onClick={() => setMenuOpen(false)}>
                <small>01</small>
                <span>Encontrar médico</span>
              </a>
              <a href="/#metodo" onClick={() => setMenuOpen(false)}>
                <small>02</small>
                <span>Cómo funciona</span>
              </a>
              <a href="/#acerca" onClick={() => setMenuOpen(false)}>
                <small>03</small>
                <span>Nosotros</span>
              </a>
              <a href="/cuenta" onClick={() => setMenuOpen(false)}>
                <small>04</small>
                <span>{user ? "Mi cuenta" : "Ingresar"}</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
