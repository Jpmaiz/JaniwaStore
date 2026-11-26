import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import SubirPrenda from "@/components/SubirPrenda";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subir prenda · Janiwa", robots: { index: false } };

export default async function SubirPage() {
  await requireAdmin();
  return <SubirPrenda />;
}
