"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /command-center y /dashboard eran dos paginas distintas con el mismo
// nombre "Command Center". Se fusionaron en una sola (/dashboard). Esta
// ruta se deja viva solo como redirect, para no romper enlaces guardados
// o escritos a mano (ej. /command-center?tab=cases sigue funcionando,
// solo que ahora abre /dashboard?tab=cases).
export default function CommandCenterRedirect() {
  const router = useRouter();

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    router.replace("/dashboard" + (tab ? "?tab=" + tab : ""));
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
      Redirigiendo...
    </div>
  );
}