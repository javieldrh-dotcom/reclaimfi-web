-- Solo lectura: el codigo exacto, tal cual esta hoy en produccion, de la
-- funcion check_period_not_closed() y de los triggers que la usan en
-- journal_entries/journal_lines. Esto es para documentar correctamente
-- 2026-10-12-period-lock-trigger.sql en el repositorio sin adivinar.
select jsonb_pretty(
  jsonb_build_object(
    'funcion', (
      select pg_get_functiondef(oid)
      from pg_proc
      where proname = 'check_period_not_closed'
        and pronamespace = 'public'::regnamespace
    ),
    'triggers', (
      select jsonb_agg(
        jsonb_build_object(
          'tabla', tgrelid::regclass::text,
          'nombre', tgname,
          'definicion', pg_get_triggerdef(oid)
        )
      )
      from pg_trigger
      where tgname like '%period%' and not tgisinternal
    )
  )
) as resultado;docs(schema): consolidar migraciones sueltas en supabase/migrations/

Recupera y documenta en la carpeta unica de migraciones 8 archivos que
habian quedado sueltos en app/lib/supabase/migrations/ (nunca se habian
movido realmente) mas 2 que solo se habian corrido a mano en Supabase sin
dejar registro en el repo. Elimina la carpeta vieja, ya duplicada.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01TTDZ8CZA9sFHH8q6arpVU7