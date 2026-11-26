import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Corre antes de /admin y /login:
 *  - renueva la sesión (cookies) de Supabase
 *  - si no hay sesión, /admin manda al login
 * La comprobación de que eres el admin se repite en cada página y acción del servidor.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const enAdmin = request.nextUrl.pathname.startsWith("/admin");

  if (!url || !clave) {
    return enAdmin ? NextResponse.redirect(new URL("/login", request.url)) : respuesta;
  }

  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (enAdmin && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
