import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authConfigurado, usuarioAdmin } from "@/lib/auth";
import Marca from "@/components/Marca";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ingresar · Janiwa", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await usuarioAdmin()) redirect("/admin");
  const { next } = await searchParams;
  const destino = next?.startsWith("/admin") ? next : "/admin";

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Marca subtitulo="PANEL DE ADMINISTRACIÓN" />
        <div className="cf-rule" aria-hidden="true" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ fontSize: 30 }}>Ingresar</h2>
          <p className="small muted">SOLO PARA EL ADMINISTRADOR</p>
        </div>
        {!authConfigurado() && (
          <p className="notice">
            Falta configurar el login: agrega SUPABASE_PUBLISHABLE_KEY y ADMIN_EMAILS en .env.local (mira .env.example).
          </p>
        )}
        <LoginForm next={destino} />
      </div>
    </main>
  );
}
