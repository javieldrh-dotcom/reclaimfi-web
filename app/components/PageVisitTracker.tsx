"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "rf_visitor_id";

// Montado una sola vez en app/layout.tsx. Registra cada navegacion (carga
// inicial + cambios de ruta del lado del cliente) como una visita, para el
// control de trafico del Panel del Propietario (/admin). No renderiza
// nada visible.
//
// visitor_id: un UUID anonimo que se genera una sola vez por navegador y
// se persiste en localStorage, para poder estimar visitantes unicos sin
// pedir inicio de sesion. Si localStorage no esta disponible (ventana
// privada, bloqueo de sitio, etc.) se usa un UUID de memoria para esa
// carga de pagina y simplemente no se cuenta como el mismo visitante la
// siguiente vez -- no es critico, es solo una estimacion de trafico.
function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export default function PageVisitTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visitorIdRef.current) {
      visitorIdRef.current = getOrCreateVisitorId();
    }

    // Best-effort: un fallo al registrar la visita nunca debe afectar la
    // navegacion del usuario, por eso es un fetch suelto con catch vacio
    // en vez de algo que bloquee el render.
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        visitor_id: visitorIdRef.current,
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
