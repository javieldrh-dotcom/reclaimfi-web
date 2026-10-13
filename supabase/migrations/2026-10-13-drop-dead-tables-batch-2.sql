-- Segunda tanda de limpieza de Fase 3: a diferencia de la primera
-- tanda (2026-10-13-drop-dead-tables-batch.sql), estas 5 tablas si
-- tenian filas, pero se investigo su origen recorriendo TODO el
-- historial de git (no solo el estado actual del codigo) y se
-- confirmo que son datos huerfanos de funcionalidades ya reemplazadas
-- o eliminadas explicitamente, no datos vigentes:
--   investigations (20 filas)      -> sistema de casos duplicado,
--     paralelo a "cases", usado por /investigation antes de unificarse
--     en un unico sistema (ver commit a23a95f: "consolidar el sistema
--     de casos duplicado").
--   apu_catalog_items (39 filas)   -> nombre anterior de la tabla de
--     catalogo de partidas APU, renombrada/migrada a apu_price_catalog
--     (commit 269b7c6 la crea con "datos de ejemplo"; el codigo actual
--     en app/apu/partidas/[projectId]/page.tsx ya consulta
--     apu_price_catalog, no esta).
--   entity_relationships (1 fila)  -> parte de un motor de "intelligence
--     graph" eliminado explicitamente como codigo muerto (commit
--     2471199: "eliminar codigo muerto: supabaseAdmin, supabaseAlerts,
--     graphDataProvider, intelligenceGraph, routes.ts").
--   risk_rules (2 filas), api_rate_limits (16 filas) -> no aparecen en
--     ningun commit del historial de la app; nunca tuvieron codigo que
--     las usara, son datos cargados a mano (pruebas).
--
-- NO incluidas aqui: repomo_calculations e inflation_adjustments. A
-- diferencia de las anteriores, sí contienen calculos reales (no datos
-- de prueba ni duplicados) generados por el trigger ya desactivado en
-- 2026-10-13-drop-repomo-automatic-trigger.sql. Se dejan intactas hasta
-- decidir si vale la pena exportar ese historico antes de borrarlas.
drop table if exists public.investigations;
drop table if exists public.apu_catalog_items;
drop table if exists public.entity_relationships;
drop table if exists public.risk_rules;
drop table if exists public.api_rate_limits;