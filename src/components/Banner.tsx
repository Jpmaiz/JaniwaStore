import Link from "next/link";
import type { Anuncio } from "@/lib/types";

type Datos = Pick<Anuncio, "titulo" | "texto" | "imagen_url" | "boton" | "enlace">;

/** Un anuncio de portada: foto a todo el ancho con título y botón */
export function Banner({ a, prioridad = false }: { a: Datos; prioridad?: boolean }) {
  const externo = a.enlace?.startsWith("https://");
  return (
    <article className="banner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.imagen_url} alt="" loading={prioridad ? "eager" : "lazy"} />
      <div className="banner-txt">
        <h2>{a.titulo}</h2>
        {a.texto && <p>{a.texto}</p>}
        {a.enlace &&
          (externo ? (
            <a className="btn btn-primary" href={a.enlace} target="_blank" rel="noreferrer">
              {a.boton ?? "VER MÁS"} ↗
            </a>
          ) : (
            <Link className="btn btn-primary" href={a.enlace}>
              {a.boton ?? "VER MÁS"} →
            </Link>
          ))}
      </div>
    </article>
  );
}

/** Banners de la portada; si hay varios, se deslizan de lado */
export default function Banners({ anuncios }: { anuncios: Datos[] }) {
  if (!anuncios.length) return null;
  return (
    <section className={`banners${anuncios.length > 1 ? " banners-varios" : ""}`} aria-label="Anuncios">
      {anuncios.map((a, i) => (
        <Banner key={`${a.imagen_url}-${i}`} a={a} prioridad={i === 0} />
      ))}
    </section>
  );
}
