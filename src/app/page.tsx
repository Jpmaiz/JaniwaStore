import Marca from "@/components/Marca";

/** Portada provisoria: aquí irá la tienda pública (Fase 3) */
export default function Inicio() {
  return (
    <main className="auth-shell">
      <div className="portada">
        <Marca subtitulo="PRODUCTOS DE EE. UU. EN BOLIVIA" grande />
        <div className="cf-rule" aria-hidden="true" style={{ width: "100%" }} />
        <p className="portada-texto">La tienda abre muy pronto.</p>
        <p className="small muted">COCHABAMBA · BOLIVIA</p>
      </div>
    </main>
  );
}
