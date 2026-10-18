-- Auditoria de politicas RLS pedida por Javiel (17-oct-2026). Dos hallazgos
-- reales, el mismo tipo de problema que ya rompio chart_of_accounts antes:
-- una tabla que la UI escribe/lee con el cliente normal (anon key + sesion,
-- NO service_role) termina sin acceso real porque su politica RLS depende
-- de algo que nunca se cumple, o le falta una restriccion de rol.

-- ============================================================
-- 1) risk_scores: su UNICA politica depende de current_company_id(),
--    una funcion que no existe en ningun lado de este repo (no hay
--    set_config, ni JWT custom claim, ni RPC que la alimente -- el
--    patron real de multi-tenencia aqui es is_company_member()/
--    user_companies). Si esa funcion siempre devuelve NULL, esta
--    tabla queda inaccesible para todo el mundo con el cliente normal:
--    app/core/eventHandlers/risk.handler.ts:25 (insert) fallaria con
--    "new row violates row-level security policy", y
--    app/reports/[caseId]/page.tsx:103 (select) siempre devolveria 0
--    filas en silencio (sin error, el "Score Total" del reporte se ve
--    vacio).
--
--    Fix: se AGREGA una politica adicional con el patron real que ya
--    usan ~9 tablas similares (aml_policies, blockchain_seals,
--    islr_declarations, etc: cualquier miembro de la empresa, sin
--    restriccion de rol -- risk_scores se genera automaticamente por
--    el event bus, no por una accion manual de "ADMIN/CONTADOR"). NO
--    se elimina la politica vieja "risk_scores_isolation" por si
--    current_company_id() si esta en uso para algo que no vimos en el
--    codigo (ej. un dashboard externo) -- Postgres combina varias
--    politicas permisivas con OR, asi que esta se suma, no reemplaza.
drop policy if exists "company_access_risk_scores" on public.risk_scores;
create policy "company_access_risk_scores" on public.risk_scores for all to public
  using (
    exists (select 1 from public.user_companies uc where uc.company_id = risk_scores.company_id and uc.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.user_companies uc where uc.company_id = risk_scores.company_id and uc.user_id = auth.uid())
  );

-- ============================================================
-- 2) payroll_loans: a diferencia de sus tablas hermanas del mismo
--    flujo de nomina (payroll_runs, payroll_details), que exigen rol
--    ADMIN/CONTADOR para insert/update, payroll_loans (prestamos y
--    anticipos a empleados, con saldo) deja escribir a CUALQUIER
--    miembro de la empresa sin importar su rol. Es la misma tabla que
--    guarda montos/saldos de dinero -- se alinea con el resto de
--    nomina.
drop policy if exists "insert_own_company_payroll_loans" on public.payroll_loans;
create policy "insert_own_company_payroll_loans" on public.payroll_loans
  for insert with check (
    is_company_member(company_id) and (get_user_role(company_id) = any (array['ADMIN'::text, 'CONTADOR'::text]))
  );

drop policy if exists "update_own_company_payroll_loans" on public.payroll_loans;
create policy "update_own_company_payroll_loans" on public.payroll_loans
  for update using (
    is_company_member(company_id) and (get_user_role(company_id) = any (array['ADMIN'::text, 'CONTADOR'::text]))
  );
-- select_own_company_payroll_loans no se toca -- ver/consultar los
-- prestamos (ej. en el recibo de pago) si debe quedar abierto a
-- cualquier miembro, igual que antes.