/**
 * Achica una foto en el navegador antes de subirla (las del celular pesan 3–8 MB).
 * Lado mayor máx. 1600 px, WebP (o JPEG si el navegador no sabe hacer WebP).
 */
export async function prepararFoto(archivo: File, lado = 1600): Promise<File> {
  if (!archivo.type.startsWith("image/")) throw new Error("Ese archivo no es una imagen.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error("No se pudo leer la foto. Prueba con JPG o PNG.");
  }
  const escala = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo procesar la foto.");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const comoBlob = (tipo: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, tipo, 0.82));
  let blob = await comoBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await comoBlob("image/jpeg");
  if (!blob) throw new Error("No se pudo preparar la foto.");
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `foto.${ext}`, { type: blob.type });
}
