"use client";

import { useActionState } from "react";
import { iniciarSesion } from "@/app/auth-actions";

export default function LoginForm({ next }: { next: string }) {
  const [estado, accion, entrando] = useActionState(iniciarSesion, null);
  return (
    <form action={accion} className="form">
      <input type="hidden" name="next" value={next} />
      <label className="field">
        <span>CORREO</span>
        <input name="email" type="email" autoComplete="email" required autoFocus />
      </label>
      <label className="field">
        <span>CONTRASEÑA</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {estado?.error && (
        <p className="error" role="alert">
          {estado.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={entrando} style={{ marginTop: 6 }}>
        {entrando ? "ENTRANDO…" : "ENTRAR"}
      </button>
    </form>
  );
}
