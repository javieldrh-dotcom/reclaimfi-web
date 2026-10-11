// Fase 4 de la hoja de ruta: hash SHA-256 de verificacion de integridad
// para los reportes exportables (auditoria forense, contabilidad NISR
// 4410, presupuesto APU). Se calcula sobre una serializacion canonica
// (JSON con las llaves ordenadas, para que el mismo contenido siempre
// produzca el mismo hash) de los DATOS que alimentan el reporte, no
// sobre los bytes del PDF/DOCX final -- hashear el archivo renderizado
// crearia una dependencia circular (el archivo tendria que incluir el
// hash de si mismo) y ademas los bytes de un PDF/DOCX varian entre
// ejecuciones por metadatos internos (timestamps, IDs de fuente) aunque
// el contenido sea identico. Lo que importa para la cadena de custodia
// es poder verificar despues que los DATOS que se declararon en el
// momento de exportar no fueron alterados, y eso es exactamente lo que
// certifica este hash.
//
// Usa Web Crypto (SubtleCrypto), disponible en el navegador sin
// dependencias nuevas.
function sortKeysDeep(value: any): any {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc: Record<string, any>, key) => {
        acc[key] = sortKeysDeep(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export async function hashReportData(data: unknown): Promise<string> {
  const canonicalJson = JSON.stringify(sortKeysDeep(data));
  const encoded = new TextEncoder().encode(canonicalJson);
  const digestBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digestBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
