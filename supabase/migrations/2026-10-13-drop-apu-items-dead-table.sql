-- apu_items nunca llego a tener un flujo de aplicacion que la usara: no
-- hay ningun .select/.insert/.update/.delete contra ella en app/, solo
-- existia en el esquema (confirmado por busqueda exhaustiva en el
-- codigo durante la auditoria de Fase 3). El modulo APU real usa
-- apu_fscl_calculations y las tablas relacionadas, no esta.
-- Se elimina para no dejar una tabla fantasma con RLS y FKs que nadie
-- mantiene ni usa.
drop table if exists public.apu_items;
