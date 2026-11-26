/** Logo de Janiwa: El pensador + nombre. Sin link (para login y portada). */
export default function Marca({ subtitulo = "COMPRA / VENTA", grande = false }: { subtitulo?: string; grande?: boolean }) {
  return (
    <div className={`lockup ${grande ? "lockup-grande" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={233} height={320} />
      <span className="lockup-text">
        <span className="lockup-name">Janiwa</span>
        <span className="lockup-sub">{subtitulo}</span>
      </span>
    </div>
  );
}
