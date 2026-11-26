import { paginaGenero } from "@/lib/paginaGenero";

export const revalidate = 60;
const { metadata, Pagina, rutas } = paginaGenero("mujer");
export const generateMetadata = metadata;
export const generateStaticParams = rutas;
export default Pagina;
