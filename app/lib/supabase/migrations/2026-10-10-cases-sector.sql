-- Clasificacion ligera de los casos de auditoria financiera por sector,
-- para separar en el dashboard los casos del sector petrolero/PDVSA de
-- las auditorias municipales y de los casos corporativos generales. No es
-- un modulo nuevo, es solo una columna de filtrado sobre "cases" (los
-- casos BLOCKCHAIN no usan este campo).
alter table public.cases
  add column if not exists sector text;

comment on column public.cases.sector is
  'Clasificacion opcional para casos no-BLOCKCHAIN: PETROLERO, MUNICIPAL o CORPORATIVO. Null para casos sin clasificar o de tipo BLOCKCHAIN.';