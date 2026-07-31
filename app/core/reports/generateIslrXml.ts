interface IslrDetalle {
  rifRetenido: string;
  numeroFactura: string;
  numeroControl: string;
  codigoConcepto: string;
  fechaOperacion: string;
  montoOperacion: number;
  porcentajeRetencion: number;
  montoRetenido: number;
}

function esc(v: string) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function generateIslrXml(rifAgente: string, ejercicio: string, periodo: string, detalles: IslrDetalle[]) {
  const items = detalles.map((d) => `  <DetalleDeclaracion>
    <RifSujetoRetenido>${esc(d.rifRetenido)}</RifSujetoRetenido>
    <TipoOperacion>1</TipoOperacion>
    <CodigoConceptoRetencion>${esc(d.codigoConcepto)}</CodigoConceptoRetencion>
    <NumeroFactura>${esc(d.numeroFactura)}</NumeroFactura>
    <NumeroControl>${esc(d.numeroControl)}</NumeroControl>
    <FechaOperacion>${esc(d.fechaOperacion)}</FechaOperacion>
    <MontoTotalPagoAbono>${d.montoOperacion.toFixed(2)}</MontoTotalPagoAbono>
    <PorcentajeRetencion>${d.porcentajeRetencion.toFixed(2)}</PorcentajeRetencion>
    <MontoTotalRetenido>${d.montoRetenido.toFixed(2)}</MontoTotalRetenido>
  </DetalleDeclaracion>`).join("\n");

  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<TransmisionDeclaracionesSalariosOtrasRetenciones>
  <Encabezado>
    <RifAgenteRetencion>${esc(rifAgente)}</RifAgenteRetencion>
    <Ejercicio>${esc(ejercicio)}</Ejercicio>
    <TipoDeclaracion>O</TipoDeclaracion>
  </Encabezado>
${items}
</TransmisionDeclaracionesSalariosOtrasRetenciones>`;

  return xml;
}