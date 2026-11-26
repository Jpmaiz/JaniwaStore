import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { cargarAnunciosAdmin } from "@/lib/datos";
import Anuncios from "@/components/Anuncios";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Anuncios · Janiwa", robots: { index: false } };

export default async function AnunciosPage() {
  await requireAdmin();
  const { anuncios, error } = await cargarAnunciosAdmin();
  return <Anuncios anuncios={anuncios} error={error} />;
}
