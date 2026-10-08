// Formula unica de costeo de una partida APU (Analisis de Precio Unitario).
//
// Antes esta misma formula estaba copiada y pegada en 3 lugares distintos
// (pantalla de Partidas, generador del PDF de oferta, y la adjudicacion del
// proyecto). Al corregirse el factor FSCL en dos de esas copias y olvidarse
// en la tercera, el monto comprometido contablemente al adjudicar un
// proyecto quedaba por debajo del monto realmente ofertado. Esta funcion
// centraliza el calculo para que una correccion futura aplique en todas
// partes a la vez.
export interface CostLineItem {
  quantity?: number | null;
  unit_cost?: number | null;
}

export interface LaborLineItem {
  quantity?: number | null;
  days?: number | null;
  daily_rate?: number | null;
}

export interface PartidaCostResult {
  materialsCost: number;
  equipmentCost: number;
  laborCost: number;
  directCost: number;
  admin: number;
  profit: number;
  unitPrice: number;
  total: number;
  factor: number;
}

export function calcPartidaCost(
  materials: CostLineItem[] | null | undefined,
  equipment: CostLineItem[] | null | undefined,
  labor: LaborLineItem[] | null | undefined,
  fsclFactor: number | null | undefined,
  adminPercentage: number | null | undefined,
  profitPercentage: number | null | undefined,
  quantity: number | null | undefined
): PartidaCostResult {
  const factor = fsclFactor || 1;
  const materialsCost = (materials ?? []).reduce((s, m) => s + (m.quantity || 0) * (m.unit_cost || 0), 0);
  const equipmentCost = (equipment ?? []).reduce((s, e) => s + (e.quantity || 0) * (e.unit_cost || 0), 0);
  const laborCost = (labor ?? []).reduce((s, l) => s + (l.quantity || 0) * (l.days || 0) * (l.daily_rate || 0) * factor, 0);
  const directCost = materialsCost + equipmentCost + laborCost;
  const admin = directCost * ((adminPercentage || 0) / 100);
  const profit = directCost * ((profitPercentage || 0) / 100);
  const unitPrice = directCost + admin + profit;
  const total = unitPrice * (quantity || 0);
  return { materialsCost, equipmentCost, laborCost, directCost, admin, profit, unitPrice, total, factor };
}
