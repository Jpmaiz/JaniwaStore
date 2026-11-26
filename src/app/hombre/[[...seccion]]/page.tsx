import { paginaGenero } from "@/lib/paginaGenero";

export const revalidate = 60;
const { metadata, Pagina, rutas } = paginaGenero("hombre");
export const generateMetadata = metadata;
export const generateStaticParams = rutas;
export default Pagina;
