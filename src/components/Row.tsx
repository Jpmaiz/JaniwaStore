/** Fila estilo directorio telefónico: ETIQUETA ........ VALOR */
export default function Row({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`row ${className ?? ""}`}>
      <span>{label}</span>
      <span className="leader" aria-hidden="true" />
      <span>{value}</span>
    </div>
  );
}
