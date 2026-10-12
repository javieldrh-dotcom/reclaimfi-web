-- MIGRACION BASELINE: esquema completo de produccion, generado a partir de
-- un volcado real de information_schema + pg_constraint + pg_indexes +
-- pg_policies (ver Fase 3 de la hoja de ruta 'ReclaimFi a Nivel
-- Profesional'). No es un cambio: documenta tal cual esta hoy el esquema,
-- (ver supabase/migrations/, que hasta ahora solo tenia parches sueltos
-- sobre un esquema base que nunca quedo documentado). Todo el contenido es
-- `if not exists` / se puede correr de nuevo sin romper nada si ya esta
-- aplicado -- pero el proposito de este archivo es documentar, no aplicar
-- (ya esta todo aplicado en produccion).

create table if not exists public.ai_findings (
  id uuid not null default gen_random_uuid(),
  case_id uuid,
  engine text,
  finding text,
  severity text,
  confidence numeric,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.alerts (
  id uuid not null default gen_random_uuid(),
  alert_type text,
  severity text,
  title text,
  description text,
  source_engine text,
  status text,
  created_at timestamp without time zone default now(),
  company_id uuid not null,
  case_id uuid
);

create table if not exists public.aml_policies (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  policy_name text not null,
  description text,
  last_reviewed_date date,
  next_review_date date,
  responsible_person text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.aml_training_records (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  employee_name text not null,
  training_topic text not null,
  training_date date not null,
  certified boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.ap_bills (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  vendor_name text not null,
  bill_number text not null,
  issue_date date not null,
  due_date date not null,
  amount numeric not null,
  status text default 'PENDING'::text,
  journal_entry_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.api_rate_limits (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null,
  window_start timestamp with time zone not null default now(),
  request_count integer not null default 1
);

create table if not exists public.approvals (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  module text,
  record_id uuid,
  requested_by uuid,
  approved_by uuid,
  status text default 'pending'::text,
  created_at timestamp without time zone default now()
);

create table if not exists public.apu_catalog_items (
  id uuid not null default gen_random_uuid(),
  category text not null,
  description text not null,
  default_unit text,
  materials_template jsonb default '[]'::jsonb,
  equipment_template jsonb default '[]'::jsonb,
  labor_template jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  country_code text default 'VE'::text,
  sector text
);

create table if not exists public.apu_financial_qualification (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  patrimonio_bs numeric not null,
  tasa_bcv numeric not null,
  factor numeric default 795.73,
  qualification_usd numeric not null,
  calculated_at timestamp with time zone default now(),
  notes text
);

create table if not exists public.apu_fscl_calculations (
  id uuid not null default gen_random_uuid(),
  apu_project_id uuid,
  work_system text,
  daily_basic_salary numeric not null,
  calendar_days integer not null,
  non_worked_days integer default 0,
  worked_days integer,
  isa_percentage numeric default 0,
  travel_time_amount numeric default 0,
  sub_total_a numeric,
  preaviso_days numeric default 0,
  antiguedad_legal_days numeric default 0,
  antiguedad_contractual_days numeric default 0,
  antiguedad_adicional_days numeric default 0,
  vacaciones_days numeric default 0,
  bono_vacacional_days numeric default 0,
  utilidades_days numeric default 0,
  sub_total_b numeric,
  examenes_pre_empleo numeric default 0,
  epp_amount numeric default 0,
  agua_hielo_amount numeric default 0,
  clinica_amount numeric default 0,
  sub_total_c numeric,
  seguro_social_percentage numeric default 11,
  inces_percentage numeric default 2,
  lph_percentage numeric default 2,
  paro_forzoso_percentage numeric default 2,
  sub_total_terceros numeric,
  total_daily_cost numeric,
  fscl_factor numeric,
  created_at timestamp with time zone default now()
);

create table if not exists public.apu_items (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  procedure_number text,
  project_description text,
  item_number integer,
  description text,
  unit text,
  quantity numeric,
  materials_cost numeric default 0,
  equipment_cost numeric default 0,
  labor_cost numeric default 0,
  admin_percentage numeric default 0,
  profit_percentage numeric default 0,
  unit_price numeric,
  total_offer numeric,
  created_at timestamp with time zone default now()
);

create table if not exists public.apu_partida_equipment (
  id uuid not null default gen_random_uuid(),
  apu_partida_id uuid,
  description text not null,
  unit text,
  quantity numeric not null,
  unit_cost numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.apu_partida_labor (
  id uuid not null default gen_random_uuid(),
  apu_partida_id uuid,
  position_name text not null,
  quantity numeric not null,
  days numeric not null,
  daily_rate numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.apu_partida_materials (
  id uuid not null default gen_random_uuid(),
  apu_partida_id uuid,
  description text not null,
  unit text,
  quantity numeric not null,
  unit_cost numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.apu_partidas (
  id uuid not null default gen_random_uuid(),
  apu_project_id uuid,
  item_number integer not null,
  description text not null,
  unit text,
  quantity numeric not null,
  admin_percentage numeric default 12.5,
  profit_percentage numeric default 15,
  fscl_calculation_id uuid,
  created_at timestamp with time zone default now(),
  code text
);

create table if not exists public.apu_price_catalog (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  category text not null,
  description text not null,
  unit text,
  unit_cost numeric not null default 0,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.apu_price_quotes (
  id uuid not null default gen_random_uuid(),
  catalog_item_id uuid not null,
  supplier_name text not null,
  unit_cost numeric not null default 0,
  quote_date date default CURRENT_DATE,
  is_selected boolean not null default false,
  notes text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.apu_projects (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  procedure_number text not null,
  project_description text,
  contracting_entity text,
  bcv_rate numeric,
  status text default 'DRAFT'::text,
  created_at timestamp with time zone default now(),
  submission_date date
);

create table if not exists public.ar_invoices (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  customer_name text not null,
  invoice_number text not null,
  issue_date date not null,
  due_date date not null,
  amount numeric not null,
  status text default 'PENDING'::text,
  journal_entry_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.arbitrage_signals (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  currency text not null,
  risk_level text not null,
  findings_summary text,
  detected_at timestamp with time zone not null default now()
);

create table if not exists public.audit_chain (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  event_type text not null,
  event_id uuid,
  payload jsonb,
  previous_hash text,
  current_hash text,
  created_at timestamp without time zone default now(),
  user_id uuid,
  module text,
  severity text default 'info'::text
);

create table if not exists public.audit_evidence (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  audit_log_id uuid,
  file_name text,
  file_url text,
  uploaded_by uuid,
  created_at timestamp without time zone default now()
);

create table if not exists public.audit_findings (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  title text,
  description text,
  severity text,
  recommendation text,
  status text default 'open'::text,
  created_at timestamp without time zone default now()
);

create table if not exists public.audit_logs (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  user_id uuid,
  module text not null,
  action text not null,
  record_id uuid,
  previous_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp without time zone default now(),
  case_id uuid
);

create table if not exists public.blockchain_seals (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  document_name text not null,
  document_type text,
  document_hash text not null,
  created_at timestamp with time zone not null default now(),
  created_by uuid,
  previous_hash text,
  chain_hash text not null default ''::text
);

create table if not exists public.blockchain_transactions (
  id uuid not null default gen_random_uuid(),
  tx_hash text,
  wallet_address text,
  blockchain text,
  amount numeric,
  currency text,
  risk_level text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.case_wallet_analyses (
  id uuid not null default gen_random_uuid(),
  case_id uuid not null,
  wallet_address text not null,
  balance_btc numeric,
  tx_count integer,
  risk_level text,
  ofac_sanctioned boolean default false,
  analysis_summary text,
  recommendation text,
  created_at timestamp with time zone not null default now(),
  created_by uuid
);

create table if not exists public.cases (
  id uuid not null default gen_random_uuid(),
  case_code text,
  title text,
  description text,
  case_type text,
  priority text,
  status text,
  risk_level text,
  created_at timestamp without time zone default now(),
  company_id uuid,
  sector text
);

create table if not exists public.chart_of_accounts (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  account_code text not null,
  account_name text not null,
  account_type text not null,
  parent_account_id uuid,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  monetary_type text,
  industry_sector text,
  cash_flow_category text,
  sector text default 'GENERIC'::text,
  is_current boolean default true,
  statement_category text default 'OTHER'::text,
  mayor_folio integer,
  mayor_folio_continuation integer
);

create table if not exists public.companies (
  id uuid not null default gen_random_uuid(),
  name text not null,
  country text,
  owner_id uuid,
  created_at timestamp without time zone default now(),
  industry_sector text,
  subscription_plan text default 'FREE'::text,
  functional_currency text default 'USD'::text,
  tax_id text,
  is_special_taxpayer boolean default false,
  withholding_agent_number text,
  withholding_rate_percentage numeric default 75,
  accounting_convention text default 'REGIONAL_VE'::text,
  default_expense_account_id uuid,
  default_vat_credit_account_id uuid,
  default_vat_withholding_account_id uuid,
  default_islr_withholding_account_id uuid,
  default_ap_account_id uuid,
  default_bank_account_id uuid,
  legal_representative_name text,
  legal_representative_id text,
  legal_representative_position text,
  is_forensic_reconstruction boolean default false,
  reconstruction_case_id uuid,
  share_arbitrage_signals boolean default false
);

create table if not exists public.compliance_filings (
  id uuid not null default gen_random_uuid(),
  requirement_id uuid not null,
  company_id uuid not null,
  filed_date date not null,
  notes text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.compliance_requirements (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  requirement_name text not null,
  regulatory_body text,
  frequency text not null default 'ANNUAL'::text,
  next_due_date date,
  responsible_person text,
  status text not null default 'PENDING'::text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.contact_submissions (
  id uuid not null default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone not null default now(),
  status text not null default 'nuevo'::text
);

create table if not exists public.customer_account_memory (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  customer_tax_id text not null,
  revenue_account_id uuid,
  ar_account_id uuid,
  vat_payable_account_id uuid,
  updated_at timestamp with time zone default now()
);

create table if not exists public.deferred_tax_entries (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  entry_date date not null,
  description text not null,
  temporary_difference_type text,
  amount numeric not null,
  entry_type text,
  journal_entry_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.depreciation_entries (
  id uuid not null default gen_random_uuid(),
  fixed_asset_id uuid,
  period_date date not null,
  monthly_depreciation numeric not null,
  accumulated_depreciation numeric not null,
  book_value numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.employees (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  full_name text not null,
  position text,
  daily_salary numeric not null,
  hire_date date,
  status text default 'ACTIVE'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.entities (
  id uuid not null default gen_random_uuid(),
  entity_name text not null,
  entity_type text,
  risk_level text default 'LOW'::text,
  created_at timestamp without time zone default now(),
  company_id uuid
);

create table if not exists public.entity_relationships (
  id uuid not null default gen_random_uuid(),
  source_entity uuid,
  target_entity uuid,
  relationship_type text,
  risk_level text default 'LOW'::text,
  metadata jsonb,
  created_at timestamp without time zone default now()
);

create table if not exists public.evaluations (
  id uuid not null default gen_random_uuid(),
  wallet text,
  risk text,
  audit_type text,
  priority text,
  case_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.event_ledger (
  id uuid not null,
  event_type text not null,
  table_source text not null,
  operation text not null,
  payload jsonb not null,
  event_hash text not null,
  previous_hash text,
  created_at timestamp without time zone default now(),
  actor text,
  session_id text,
  case_id uuid,
  company_id uuid
);

create table if not exists public.evidences (
  id uuid not null default gen_random_uuid(),
  case_id uuid,
  file_name text,
  file_type text,
  file_path text,
  uploaded_by uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.exchange_rates (
  id uuid not null default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  rate_date date not null,
  rate_value numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.external_api_keys (
  id uuid not null default gen_random_uuid(),
  key_hash text not null,
  partner_name text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  last_used_at timestamp with time zone
);

create table if not exists public.financial_statement_notes (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  note_number integer not null,
  title text not null,
  content text not null,
  period_end date,
  created_at timestamp with time zone default now()
);

create table if not exists public.fiscal_deadlines (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  obligation_name text not null,
  due_day_of_month integer not null,
  notes text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.fiscal_periods (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  period_start date not null,
  period_end date not null,
  status text default 'OPEN'::text,
  closing_entry_id uuid,
  closed_at timestamp with time zone,
  net_result numeric,
  created_at timestamp with time zone default now()
);

create table if not exists public.fixed_assets (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  account_id uuid,
  asset_name text not null,
  acquisition_date date not null,
  acquisition_cost numeric not null,
  useful_life_years numeric not null,
  salvage_value numeric default 0,
  status text default 'ACTIVE'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.forensic_cases (
  id uuid not null default gen_random_uuid(),
  client_name text,
  wallet text,
  blockchain text,
  risk_level text,
  status text,
  notes text,
  created_at timestamp without time zone default now(),
  company_id uuid
);

create table if not exists public.fx_revaluations (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  revaluation_date date not null,
  bcv_rate numeric not null,
  account_id uuid,
  foreign_currency_balance numeric not null,
  old_functional_value numeric not null,
  new_functional_value numeric not null,
  differential numeric not null,
  journal_entry_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.igtf_declarations (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  transaction_date date not null,
  description text not null,
  transaction_amount numeric not null,
  currency text not null,
  igtf_rate numeric not null,
  igtf_amount numeric not null,
  journal_entry_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.inflation_adjustments (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  account_id uuid,
  period_date date not null,
  base_amount numeric not null,
  base_index numeric not null,
  closing_index numeric not null,
  reexpression_factor numeric not null,
  reexpressed_amount numeric not null,
  reexpression_effect numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.inventory_book_entries (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  entry_number integer not null,
  period_end date not null,
  total_assets numeric,
  total_liabilities numeric,
  total_equity numeric,
  inventory_snapshot jsonb,
  balance_sheet_snapshot jsonb,
  created_at timestamp with time zone default now(),
  income_statement_snapshot jsonb,
  cash_flow_snapshot jsonb,
  equity_statement_snapshot jsonb
);

create table if not exists public.inventory_items (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  sku text not null,
  item_name text not null,
  unit text default 'UND'::text,
  valuation_method text default 'WEIGHTED_AVERAGE'::text,
  current_quantity numeric default 0,
  current_avg_cost numeric default 0,
  account_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.inventory_movements (
  id uuid not null default gen_random_uuid(),
  inventory_item_id uuid,
  movement_type text,
  quantity numeric not null,
  unit_cost numeric,
  movement_date date not null,
  reference text,
  resulting_quantity numeric,
  resulting_avg_cost numeric,
  journal_entry_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.investigations (
  id uuid not null default gen_random_uuid(),
  case_id uuid,
  title text,
  description text,
  status text,
  findings jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.islr_declarations (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  fiscal_year integer not null,
  accounting_net_income numeric not null default 0,
  non_deductible_adjustments numeric not null default 0,
  exempt_income numeric not null default 0,
  taxable_net_income numeric not null default 0,
  tax_unit_value numeric not null default 0,
  taxable_income_ut numeric not null default 0,
  islr_tax numeric not null default 0,
  advance_payments numeric not null default 0,
  net_payable numeric not null default 0,
  status text not null default 'FILED'::text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.islr_estimated_declarations (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  fiscal_year integer not null,
  prior_year_net_income numeric not null,
  taxable_base numeric not null,
  tax_unit_value numeric not null,
  taxable_base_ut numeric not null,
  islr_tax numeric not null,
  amount_to_remit numeric not null,
  installments integer default 6,
  installment_amount numeric not null,
  status text default 'DRAFT'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.journal_entries (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  description text,
  entry_date date default now(),
  created_at timestamp without time zone default now(),
  status text default 'ACTIVE'::text,
  voided_at timestamp with time zone,
  void_reason text,
  currency text default 'USD'::text,
  exchange_rate numeric default 1,
  content_hash text,
  previous_hash text,
  entry_number integer,
  reversal_of_entry_id uuid,
  reversed_by_entry_id uuid,
  entry_hash text
);

create table if not exists public.journal_lines (
  id uuid not null default gen_random_uuid(),
  journal_entry_id uuid,
  account_id uuid,
  debit numeric default 0,
  credit numeric default 0
);

create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  title text,
  message text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.ofac_sanctioned_addresses (
  id uuid not null default gen_random_uuid(),
  address text not null,
  asset text not null default 'BTC'::text,
  source text not null default 'OFAC SDN List'::text,
  imported_at timestamp with time zone not null default now()
);

create table if not exists public.page_visits (
  id uuid not null default gen_random_uuid(),
  path text not null,
  visitor_id uuid not null,
  user_id uuid,
  referrer text,
  user_agent text,
  created_at timestamp with time zone not null default now(),
  ip_address text
);

create table if not exists public.payment_methods (
  id uuid not null default gen_random_uuid(),
  method_code text not null,
  method_name text not null,
  account_details text not null,
  account_holder text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists public.payroll_details (
  id uuid not null default gen_random_uuid(),
  payroll_run_id uuid,
  employee_id uuid,
  days_worked numeric not null,
  gross_amount numeric not null,
  social_security numeric default 0,
  other_deductions numeric default 0,
  net_amount numeric not null
);

create table if not exists public.payroll_runs (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  period_start date not null,
  period_end date not null,
  total_gross numeric,
  total_deductions numeric,
  total_net numeric,
  journal_entry_id uuid,
  status text default 'DRAFT'::text,
  created_at timestamp with time zone default now()
);

create table if not exists public.permissions (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.platform_config (
  id text not null,
  maintenance_mode boolean not null default true,
  maintenance_message text,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.price_indices (
  id uuid not null default gen_random_uuid(),
  country_code text not null,
  index_name text not null,
  period_date date not null,
  index_value numeric not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.purchase_book_entries (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  entry_number integer not null,
  entry_date date not null,
  document_type text default 'FACTURA'::text,
  invoice_number text,
  control_number text,
  vendor_name text not null,
  vendor_tax_id text not null,
  is_non_deductible boolean default false,
  is_import boolean default false,
  taxable_base_general numeric default 0,
  taxable_base_reduced numeric default 0,
  taxable_base_additional numeric default 0,
  rate_general numeric default 16,
  rate_reduced numeric default 8,
  rate_additional numeric default 31,
  fiscal_credit numeric default 0,
  withholding_receipt_number text,
  withheld_amount numeric default 0,
  country_code text default 'VE'::text,
  journal_entry_id uuid,
  created_at timestamp with time zone default now(),
  total_document_amount numeric default 0,
  exempt_amount numeric default 0,
  affected_document_number text,
  non_taxable_amount numeric default 0,
  import_taxable_base numeric default 0,
  import_rate numeric default 16,
  import_tax numeric default 0,
  status text default 'ACTIVE'::text,
  void_reason text,
  voided_at timestamp with time zone,
  islr_withheld numeric default 0,
  is_professional_service boolean default false,
  islr_concept_code text default '001'::text,
  is_reversed boolean default false
);

create table if not exists public.reconstruction_requests (
  id uuid not null default gen_random_uuid(),
  case_id uuid not null,
  company_id uuid not null,
  company_name text not null,
  transactions jsonb not null,
  status text not null default 'PENDING'::text,
  requested_by uuid not null,
  approved_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.repomo_calculations (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  period_date date not null,
  monetary_assets numeric not null,
  monetary_liabilities numeric not null,
  monetary_position numeric not null,
  inflation_rate numeric not null,
  repomo_result numeric not null,
  result_type text,
  created_at timestamp with time zone default now()
);

create table if not exists public.resources (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'General'::text,
  file_url text not null,
  file_name text not null,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.risk_alerts (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  journal_entry_id uuid,
  severity text,
  category text,
  score integer,
  description text,
  resolved boolean default false,
  created_at timestamp without time zone default now()
);

create table if not exists public.risk_events (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  entry_id uuid,
  score integer,
  flags text[],
  created_at timestamp without time zone default now(),
  probability numeric default 1,
  impact numeric default 1,
  control_effectiveness numeric default 0
);

create table if not exists public.risk_flags (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  severity text,
  module text,
  description text,
  resolved boolean default false,
  created_at timestamp without time zone default now()
);

create table if not exists public.risk_rules (
  id uuid not null default gen_random_uuid(),
  code text,
  name text,
  severity text,
  score integer,
  is_active boolean default true,
  configuration jsonb,
  created_at timestamp without time zone default now()
);

create table if not exists public.risk_scores (
  id uuid not null default gen_random_uuid(),
  aml_score numeric,
  tax_score numeric,
  operational_score numeric,
  corruption_score numeric,
  cyber_score numeric,
  total_score numeric,
  generated_by text,
  created_at timestamp without time zone default now(),
  entity_id uuid,
  company_id uuid not null,
  case_id uuid
);

create table if not exists public.role_permissions (
  id uuid not null default gen_random_uuid(),
  role_id uuid,
  permission_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.sales_book_entries (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  entry_number integer not null,
  entry_date date not null,
  document_type text default 'FACTURA'::text,
  invoice_number text,
  control_number text,
  customer_name text not null,
  customer_tax_id text not null,
  is_export boolean default false,
  is_exempt boolean default false,
  is_exonerated boolean default false,
  is_not_subject boolean default false,
  taxable_base_general numeric default 0,
  taxable_base_reduced numeric default 0,
  taxable_base_additional numeric default 0,
  rate_general numeric default 16,
  rate_reduced numeric default 8,
  rate_additional numeric default 31,
  fiscal_debit numeric default 0,
  withheld_by_customer numeric default 0,
  country_code text default 'VE'::text,
  journal_entry_id uuid,
  created_at timestamp with time zone default now(),
  non_taxable_amount numeric default 0,
  total_including_vat numeric default 0,
  affected_document_number text,
  status text default 'ACTIVE'::text,
  void_reason text,
  voided_at timestamp with time zone,
  is_reversed boolean default false
);

create table if not exists public.sanctions (
  id uuid not null default gen_random_uuid(),
  entity_name text,
  source text,
  program text,
  risk_level text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.sar_reports (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  entity_involved text not null,
  description text not null,
  detection_date date not null,
  reported_to_authority boolean not null default false,
  report_date date,
  status text not null default 'UNDER_REVIEW'::text,
  created_at timestamp with time zone not null default now(),
  created_by uuid
);

create table if not exists public.situations (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,
  status text not null default 'ABIERTA'::text,
  company_id uuid,
  created_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone
);

create table if not exists public.subscription_plans (
  id uuid not null default gen_random_uuid(),
  plan_code text not null,
  plan_name text not null,
  includes_reclaimfi boolean default false,
  includes_accounting boolean default false,
  includes_apu boolean default false,
  monthly_price_usd numeric not null,
  created_at timestamp with time zone default now(),
  paypal_plan_id text
);

create table if not exists public.subscriptions (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  plan_id uuid,
  payment_method_id uuid,
  status text default 'PENDING_PAYMENT'::text,
  receipt_url text,
  requested_at timestamp with time zone default now(),
  approved_at timestamp with time zone,
  expires_at date
);

create table if not exists public.user_companies (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  company_id uuid,
  role text default 'owner'::text,
  last_active_at timestamp with time zone default now()
);

create table if not exists public.user_role_assignments (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  role_id uuid,
  company_id uuid,
  created_at timestamp with time zone default now()
);

create table if not exists public.user_roles (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.vat_declarations (
  id uuid not null default gen_random_uuid(),
  company_id uuid not null,
  period_start date not null,
  period_end date not null,
  total_sales numeric not null default 0,
  total_purchases numeric not null default 0,
  fiscal_debit numeric not null default 0,
  fiscal_credit numeric not null default 0,
  vat_payable numeric not null default 0,
  status text not null default 'FILED'::text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.vendor_account_memory (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  vendor_tax_id text not null,
  expense_account_id uuid,
  vat_credit_account_id uuid,
  vat_withholding_account_id uuid,
  islr_withholding_account_id uuid,
  ap_account_id uuid,
  used_islr boolean default false,
  updated_at timestamp with time zone default now()
);

create table if not exists public.wallet_addresses (
  id uuid not null default gen_random_uuid(),
  address text,
  blockchain text,
  risk_level text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  company_id uuid
);

create table if not exists public.withholding_summary (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  period_start date not null,
  period_end date not null,
  total_withheld_from_us numeric default 0,
  total_withheld_by_us numeric default 0,
  net_withholding_position numeric default 0,
  created_at timestamp with time zone default now()
);

-- ===== RESTRICCIONES =====
-- -- fase: PRIMARY KEY / UNIQUE --
alter table public.ai_findings drop constraint if exists ai_findings_pkey;
alter table public.ai_findings add constraint ai_findings_pkey PRIMARY KEY (id);
alter table public.alerts drop constraint if exists alerts_pkey;
alter table public.alerts add constraint alerts_pkey PRIMARY KEY (id);
alter table public.aml_policies drop constraint if exists aml_policies_pkey;
alter table public.aml_policies add constraint aml_policies_pkey PRIMARY KEY (id);
alter table public.aml_training_records drop constraint if exists aml_training_records_pkey;
alter table public.aml_training_records add constraint aml_training_records_pkey PRIMARY KEY (id);
alter table public.ap_bills drop constraint if exists ap_bills_pkey;
alter table public.ap_bills add constraint ap_bills_pkey PRIMARY KEY (id);
alter table public.api_rate_limits drop constraint if exists api_rate_limits_pkey;
alter table public.api_rate_limits add constraint api_rate_limits_pkey PRIMARY KEY (id);
alter table public.api_rate_limits drop constraint if exists api_rate_limits_user_id_endpoint_window_start_key;
alter table public.api_rate_limits add constraint api_rate_limits_user_id_endpoint_window_start_key UNIQUE (user_id, endpoint, window_start);
alter table public.approvals drop constraint if exists approvals_pkey;
alter table public.approvals add constraint approvals_pkey PRIMARY KEY (id);
alter table public.apu_catalog_items drop constraint if exists apu_catalog_items_pkey;
alter table public.apu_catalog_items add constraint apu_catalog_items_pkey PRIMARY KEY (id);
alter table public.apu_financial_qualification drop constraint if exists apu_financial_qualification_pkey;
alter table public.apu_financial_qualification add constraint apu_financial_qualification_pkey PRIMARY KEY (id);
alter table public.apu_fscl_calculations drop constraint if exists apu_fscl_calculations_pkey;
alter table public.apu_fscl_calculations add constraint apu_fscl_calculations_pkey PRIMARY KEY (id);
alter table public.apu_items drop constraint if exists apu_items_pkey;
alter table public.apu_items add constraint apu_items_pkey PRIMARY KEY (id);
alter table public.apu_partida_equipment drop constraint if exists apu_partida_equipment_pkey;
alter table public.apu_partida_equipment add constraint apu_partida_equipment_pkey PRIMARY KEY (id);
alter table public.apu_partida_labor drop constraint if exists apu_partida_labor_pkey;
alter table public.apu_partida_labor add constraint apu_partida_labor_pkey PRIMARY KEY (id);
alter table public.apu_partida_materials drop constraint if exists apu_partida_materials_pkey;
alter table public.apu_partida_materials add constraint apu_partida_materials_pkey PRIMARY KEY (id);
alter table public.apu_partidas drop constraint if exists apu_partidas_pkey;
alter table public.apu_partidas add constraint apu_partidas_pkey PRIMARY KEY (id);
alter table public.apu_price_catalog drop constraint if exists apu_price_catalog_pkey;
alter table public.apu_price_catalog add constraint apu_price_catalog_pkey PRIMARY KEY (id);
alter table public.apu_price_quotes drop constraint if exists apu_price_quotes_pkey;
alter table public.apu_price_quotes add constraint apu_price_quotes_pkey PRIMARY KEY (id);
alter table public.apu_projects drop constraint if exists apu_projects_pkey;
alter table public.apu_projects add constraint apu_projects_pkey PRIMARY KEY (id);
alter table public.ar_invoices drop constraint if exists ar_invoices_pkey;
alter table public.ar_invoices add constraint ar_invoices_pkey PRIMARY KEY (id);
alter table public.arbitrage_signals drop constraint if exists arbitrage_signals_pkey;
alter table public.arbitrage_signals add constraint arbitrage_signals_pkey PRIMARY KEY (id);
alter table public.audit_chain drop constraint if exists audit_chain_pkey;
alter table public.audit_chain add constraint audit_chain_pkey PRIMARY KEY (id);
alter table public.audit_evidence drop constraint if exists audit_evidence_pkey;
alter table public.audit_evidence add constraint audit_evidence_pkey PRIMARY KEY (id);
alter table public.audit_findings drop constraint if exists audit_findings_pkey;
alter table public.audit_findings add constraint audit_findings_pkey PRIMARY KEY (id);
alter table public.audit_logs drop constraint if exists audit_logs_pkey;
alter table public.audit_logs add constraint audit_logs_pkey PRIMARY KEY (id);
alter table public.blockchain_seals drop constraint if exists blockchain_seals_pkey;
alter table public.blockchain_seals add constraint blockchain_seals_pkey PRIMARY KEY (id);
alter table public.blockchain_transactions drop constraint if exists blockchain_transactions_pkey;
alter table public.blockchain_transactions add constraint blockchain_transactions_pkey PRIMARY KEY (id);
alter table public.blockchain_transactions drop constraint if exists blockchain_transactions_tx_hash_key;
alter table public.blockchain_transactions add constraint blockchain_transactions_tx_hash_key UNIQUE (tx_hash);
alter table public.case_wallet_analyses drop constraint if exists case_wallet_analyses_pkey;
alter table public.case_wallet_analyses add constraint case_wallet_analyses_pkey PRIMARY KEY (id);
alter table public.cases drop constraint if exists cases_pkey;
alter table public.cases add constraint cases_pkey PRIMARY KEY (id);
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_company_code_unique;
alter table public.chart_of_accounts add constraint chart_of_accounts_company_code_unique UNIQUE (company_id, account_code);
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_pkey;
alter table public.chart_of_accounts add constraint chart_of_accounts_pkey PRIMARY KEY (id);
alter table public.companies drop constraint if exists companies_pkey;
alter table public.companies add constraint companies_pkey PRIMARY KEY (id);
alter table public.compliance_filings drop constraint if exists compliance_filings_pkey;
alter table public.compliance_filings add constraint compliance_filings_pkey PRIMARY KEY (id);
alter table public.compliance_requirements drop constraint if exists compliance_requirements_pkey;
alter table public.compliance_requirements add constraint compliance_requirements_pkey PRIMARY KEY (id);
alter table public.contact_submissions drop constraint if exists contact_submissions_pkey;
alter table public.contact_submissions add constraint contact_submissions_pkey PRIMARY KEY (id);
alter table public.customer_account_memory drop constraint if exists customer_account_memory_company_id_customer_tax_id_key;
alter table public.customer_account_memory add constraint customer_account_memory_company_id_customer_tax_id_key UNIQUE (company_id, customer_tax_id);
alter table public.customer_account_memory drop constraint if exists customer_account_memory_pkey;
alter table public.customer_account_memory add constraint customer_account_memory_pkey PRIMARY KEY (id);
alter table public.deferred_tax_entries drop constraint if exists deferred_tax_entries_pkey;
alter table public.deferred_tax_entries add constraint deferred_tax_entries_pkey PRIMARY KEY (id);
alter table public.depreciation_entries drop constraint if exists depreciation_entries_pkey;
alter table public.depreciation_entries add constraint depreciation_entries_pkey PRIMARY KEY (id);
alter table public.employees drop constraint if exists employees_pkey;
alter table public.employees add constraint employees_pkey PRIMARY KEY (id);
alter table public.entities drop constraint if exists entities_pkey;
alter table public.entities add constraint entities_pkey PRIMARY KEY (id);
alter table public.entity_relationships drop constraint if exists entity_relationships_pkey;
alter table public.entity_relationships add constraint entity_relationships_pkey PRIMARY KEY (id);
alter table public.evaluations drop constraint if exists evaluations_pkey;
alter table public.evaluations add constraint evaluations_pkey PRIMARY KEY (id);
alter table public.event_ledger drop constraint if exists event_ledger_pkey;
alter table public.event_ledger add constraint event_ledger_pkey PRIMARY KEY (id);
alter table public.evidences drop constraint if exists evidences_pkey;
alter table public.evidences add constraint evidences_pkey PRIMARY KEY (id);
alter table public.exchange_rates drop constraint if exists exchange_rates_from_currency_to_currency_rate_date_key;
alter table public.exchange_rates add constraint exchange_rates_from_currency_to_currency_rate_date_key UNIQUE (from_currency, to_currency, rate_date);
alter table public.exchange_rates drop constraint if exists exchange_rates_pkey;
alter table public.exchange_rates add constraint exchange_rates_pkey PRIMARY KEY (id);
alter table public.external_api_keys drop constraint if exists external_api_keys_key_hash_key;
alter table public.external_api_keys add constraint external_api_keys_key_hash_key UNIQUE (key_hash);
alter table public.external_api_keys drop constraint if exists external_api_keys_pkey;
alter table public.external_api_keys add constraint external_api_keys_pkey PRIMARY KEY (id);
alter table public.financial_statement_notes drop constraint if exists financial_statement_notes_pkey;
alter table public.financial_statement_notes add constraint financial_statement_notes_pkey PRIMARY KEY (id);
alter table public.fiscal_deadlines drop constraint if exists fiscal_deadlines_pkey;
alter table public.fiscal_deadlines add constraint fiscal_deadlines_pkey PRIMARY KEY (id);
alter table public.fiscal_periods drop constraint if exists fiscal_periods_pkey;
alter table public.fiscal_periods add constraint fiscal_periods_pkey PRIMARY KEY (id);
alter table public.fixed_assets drop constraint if exists fixed_assets_pkey;
alter table public.fixed_assets add constraint fixed_assets_pkey PRIMARY KEY (id);
alter table public.forensic_cases drop constraint if exists forensic_cases_pkey;
alter table public.forensic_cases add constraint forensic_cases_pkey PRIMARY KEY (id);
alter table public.fx_revaluations drop constraint if exists fx_revaluations_pkey;
alter table public.fx_revaluations add constraint fx_revaluations_pkey PRIMARY KEY (id);
alter table public.igtf_declarations drop constraint if exists igtf_declarations_pkey;
alter table public.igtf_declarations add constraint igtf_declarations_pkey PRIMARY KEY (id);
alter table public.inflation_adjustments drop constraint if exists inflation_adjustments_pkey;
alter table public.inflation_adjustments add constraint inflation_adjustments_pkey PRIMARY KEY (id);
alter table public.inventory_book_entries drop constraint if exists inventory_book_entries_pkey;
alter table public.inventory_book_entries add constraint inventory_book_entries_pkey PRIMARY KEY (id);
alter table public.inventory_items drop constraint if exists inventory_items_pkey;
alter table public.inventory_items add constraint inventory_items_pkey PRIMARY KEY (id);
alter table public.inventory_movements drop constraint if exists inventory_movements_pkey;
alter table public.inventory_movements add constraint inventory_movements_pkey PRIMARY KEY (id);
alter table public.investigations drop constraint if exists investigations_pkey;
alter table public.investigations add constraint investigations_pkey PRIMARY KEY (id);
alter table public.islr_declarations drop constraint if exists islr_declarations_pkey;
alter table public.islr_declarations add constraint islr_declarations_pkey PRIMARY KEY (id);
alter table public.islr_estimated_declarations drop constraint if exists islr_estimated_declarations_pkey;
alter table public.islr_estimated_declarations add constraint islr_estimated_declarations_pkey PRIMARY KEY (id);
alter table public.journal_entries drop constraint if exists journal_entries_pkey;
alter table public.journal_entries add constraint journal_entries_pkey PRIMARY KEY (id);
alter table public.journal_lines drop constraint if exists journal_lines_pkey;
alter table public.journal_lines add constraint journal_lines_pkey PRIMARY KEY (id);
alter table public.notifications drop constraint if exists notifications_pkey;
alter table public.notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table public.ofac_sanctioned_addresses drop constraint if exists ofac_sanctioned_addresses_address_key;
alter table public.ofac_sanctioned_addresses add constraint ofac_sanctioned_addresses_address_key UNIQUE (address);
alter table public.ofac_sanctioned_addresses drop constraint if exists ofac_sanctioned_addresses_pkey;
alter table public.ofac_sanctioned_addresses add constraint ofac_sanctioned_addresses_pkey PRIMARY KEY (id);
alter table public.page_visits drop constraint if exists page_visits_pkey;
alter table public.page_visits add constraint page_visits_pkey PRIMARY KEY (id);
alter table public.payment_methods drop constraint if exists payment_methods_method_code_key;
alter table public.payment_methods add constraint payment_methods_method_code_key UNIQUE (method_code);
alter table public.payment_methods drop constraint if exists payment_methods_pkey;
alter table public.payment_methods add constraint payment_methods_pkey PRIMARY KEY (id);
alter table public.payroll_details drop constraint if exists payroll_details_pkey;
alter table public.payroll_details add constraint payroll_details_pkey PRIMARY KEY (id);
alter table public.payroll_runs drop constraint if exists payroll_runs_pkey;
alter table public.payroll_runs add constraint payroll_runs_pkey PRIMARY KEY (id);
alter table public.permissions drop constraint if exists permissions_name_key;
alter table public.permissions add constraint permissions_name_key UNIQUE (name);
alter table public.permissions drop constraint if exists permissions_pkey;
alter table public.permissions add constraint permissions_pkey PRIMARY KEY (id);
alter table public.platform_config drop constraint if exists platform_config_pkey;
alter table public.platform_config add constraint platform_config_pkey PRIMARY KEY (id);
alter table public.price_indices drop constraint if exists price_indices_country_code_index_name_period_date_key;
alter table public.price_indices add constraint price_indices_country_code_index_name_period_date_key UNIQUE (country_code, index_name, period_date);
alter table public.price_indices drop constraint if exists price_indices_pkey;
alter table public.price_indices add constraint price_indices_pkey PRIMARY KEY (id);
alter table public.purchase_book_entries drop constraint if exists purchase_book_entries_pkey;
alter table public.purchase_book_entries add constraint purchase_book_entries_pkey PRIMARY KEY (id);
alter table public.reconstruction_requests drop constraint if exists reconstruction_requests_pkey;
alter table public.reconstruction_requests add constraint reconstruction_requests_pkey PRIMARY KEY (id);
alter table public.repomo_calculations drop constraint if exists repomo_calculations_pkey;
alter table public.repomo_calculations add constraint repomo_calculations_pkey PRIMARY KEY (id);
alter table public.resources drop constraint if exists resources_pkey;
alter table public.resources add constraint resources_pkey PRIMARY KEY (id);
alter table public.risk_alerts drop constraint if exists risk_alerts_pkey;
alter table public.risk_alerts add constraint risk_alerts_pkey PRIMARY KEY (id);
alter table public.risk_events drop constraint if exists risk_events_pkey;
alter table public.risk_events add constraint risk_events_pkey PRIMARY KEY (id);
alter table public.risk_flags drop constraint if exists risk_flags_pkey;
alter table public.risk_flags add constraint risk_flags_pkey PRIMARY KEY (id);
alter table public.risk_rules drop constraint if exists risk_rules_code_key;
alter table public.risk_rules add constraint risk_rules_code_key UNIQUE (code);
alter table public.risk_rules drop constraint if exists risk_rules_pkey;
alter table public.risk_rules add constraint risk_rules_pkey PRIMARY KEY (id);
alter table public.risk_scores drop constraint if exists risk_scores_pkey;
alter table public.risk_scores add constraint risk_scores_pkey PRIMARY KEY (id);
alter table public.role_permissions drop constraint if exists role_permissions_pkey;
alter table public.role_permissions add constraint role_permissions_pkey PRIMARY KEY (id);
alter table public.role_permissions drop constraint if exists role_permissions_role_id_permission_id_key;
alter table public.role_permissions add constraint role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);
alter table public.sales_book_entries drop constraint if exists sales_book_entries_pkey;
alter table public.sales_book_entries add constraint sales_book_entries_pkey PRIMARY KEY (id);
alter table public.sanctions drop constraint if exists sanctions_pkey;
alter table public.sanctions add constraint sanctions_pkey PRIMARY KEY (id);
alter table public.sar_reports drop constraint if exists sar_reports_pkey;
alter table public.sar_reports add constraint sar_reports_pkey PRIMARY KEY (id);
alter table public.situations drop constraint if exists situations_pkey;
alter table public.situations add constraint situations_pkey PRIMARY KEY (id);
alter table public.subscription_plans drop constraint if exists subscription_plans_pkey;
alter table public.subscription_plans add constraint subscription_plans_pkey PRIMARY KEY (id);
alter table public.subscription_plans drop constraint if exists subscription_plans_plan_code_key;
alter table public.subscription_plans add constraint subscription_plans_plan_code_key UNIQUE (plan_code);
alter table public.subscriptions drop constraint if exists subscriptions_pkey;
alter table public.subscriptions add constraint subscriptions_pkey PRIMARY KEY (id);
alter table public.user_companies drop constraint if exists user_companies_pkey;
alter table public.user_companies add constraint user_companies_pkey PRIMARY KEY (id);
alter table public.user_role_assignments drop constraint if exists user_role_assignments_pkey;
alter table public.user_role_assignments add constraint user_role_assignments_pkey PRIMARY KEY (id);
alter table public.user_role_assignments drop constraint if exists user_role_assignments_user_id_role_id_company_id_key;
alter table public.user_role_assignments add constraint user_role_assignments_user_id_role_id_company_id_key UNIQUE (user_id, role_id, company_id);
alter table public.user_roles drop constraint if exists user_roles_name_key;
alter table public.user_roles add constraint user_roles_name_key UNIQUE (name);
alter table public.user_roles drop constraint if exists user_roles_pkey;
alter table public.user_roles add constraint user_roles_pkey PRIMARY KEY (id);
alter table public.vat_declarations drop constraint if exists vat_declarations_pkey;
alter table public.vat_declarations add constraint vat_declarations_pkey PRIMARY KEY (id);
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_company_id_vendor_tax_id_key;
alter table public.vendor_account_memory add constraint vendor_account_memory_company_id_vendor_tax_id_key UNIQUE (company_id, vendor_tax_id);
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_pkey;
alter table public.vendor_account_memory add constraint vendor_account_memory_pkey PRIMARY KEY (id);
alter table public.wallet_addresses drop constraint if exists wallet_addresses_address_key;
alter table public.wallet_addresses add constraint wallet_addresses_address_key UNIQUE (address);
alter table public.wallet_addresses drop constraint if exists wallet_addresses_pkey;
alter table public.wallet_addresses add constraint wallet_addresses_pkey PRIMARY KEY (id);
alter table public.withholding_summary drop constraint if exists withholding_summary_pkey;
alter table public.withholding_summary add constraint withholding_summary_pkey PRIMARY KEY (id);
-- -- fase: CHECK --
alter table public.ap_bills drop constraint if exists ap_bills_status_check;
alter table public.ap_bills add constraint ap_bills_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'OVERDUE'::text, 'VOIDED'::text])));
alter table public.apu_catalog_items drop constraint if exists apu_catalog_items_category_check;
alter table public.apu_catalog_items add constraint apu_catalog_items_category_check CHECK ((category = ANY (ARRAY['OBRA'::text, 'SERVICIO'::text, 'BIENES'::text])));
alter table public.apu_price_catalog drop constraint if exists apu_price_catalog_category_check;
alter table public.apu_price_catalog add constraint apu_price_catalog_category_check CHECK ((category = ANY (ARRAY['MATERIAL'::text, 'EQUIPMENT'::text, 'LABOR'::text])));
alter table public.apu_projects drop constraint if exists apu_projects_status_check;
alter table public.apu_projects add constraint apu_projects_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'SUBMITTED'::text, 'AWARDED'::text, 'REJECTED'::text])));
alter table public.ar_invoices drop constraint if exists ar_invoices_status_check;
alter table public.ar_invoices add constraint ar_invoices_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'OVERDUE'::text, 'VOIDED'::text])));
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_account_type_check;
alter table public.chart_of_accounts add constraint chart_of_accounts_account_type_check CHECK ((account_type = ANY (ARRAY['ASSET'::text, 'LIABILITY'::text, 'EQUITY'::text, 'REVENUE'::text, 'EXPENSE'::text, 'ORDER_DEBTOR'::text, 'ORDER_CREDITOR'::text])));
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_cash_flow_category_check;
alter table public.chart_of_accounts add constraint chart_of_accounts_cash_flow_category_check CHECK ((cash_flow_category = ANY (ARRAY['OPERATING'::text, 'INVESTING'::text, 'FINANCING'::text])));
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_monetary_type_check;
alter table public.chart_of_accounts add constraint chart_of_accounts_monetary_type_check CHECK ((monetary_type = ANY (ARRAY['MONETARY'::text, 'NON_MONETARY'::text])));
alter table public.deferred_tax_entries drop constraint if exists deferred_tax_entries_entry_type_check;
alter table public.deferred_tax_entries add constraint deferred_tax_entries_entry_type_check CHECK ((entry_type = ANY (ARRAY['ASSET'::text, 'LIABILITY'::text])));
alter table public.employees drop constraint if exists employees_status_check;
alter table public.employees add constraint employees_status_check CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'INACTIVE'::text])));
alter table public.fiscal_deadlines drop constraint if exists fiscal_deadlines_due_day_of_month_check;
alter table public.fiscal_deadlines add constraint fiscal_deadlines_due_day_of_month_check CHECK (((due_day_of_month >= 1) AND (due_day_of_month <= 31)));
alter table public.fiscal_periods drop constraint if exists fiscal_periods_status_check;
alter table public.fiscal_periods add constraint fiscal_periods_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'PENDING_CLOSE'::text, 'CLOSED'::text])));
alter table public.fixed_assets drop constraint if exists fixed_assets_status_check;
alter table public.fixed_assets add constraint fixed_assets_status_check CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'DISPOSED'::text, 'FULLY_DEPRECIATED'::text])));
alter table public.inventory_items drop constraint if exists inventory_items_valuation_method_check;
alter table public.inventory_items add constraint inventory_items_valuation_method_check CHECK ((valuation_method = ANY (ARRAY['FIFO'::text, 'WEIGHTED_AVERAGE'::text])));
alter table public.inventory_movements drop constraint if exists inventory_movements_movement_type_check;
alter table public.inventory_movements add constraint inventory_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['IN'::text, 'OUT'::text])));
alter table public.journal_entries drop constraint if exists journal_entries_status_check;
alter table public.journal_entries add constraint journal_entries_status_check CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'VOIDED'::text])));
alter table public.payroll_runs drop constraint if exists payroll_runs_status_check;
alter table public.payroll_runs add constraint payroll_runs_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'PAID'::text])));
alter table public.repomo_calculations drop constraint if exists repomo_calculations_result_type_check;
alter table public.repomo_calculations add constraint repomo_calculations_result_type_check CHECK ((result_type = ANY (ARRAY['GANANCIA'::text, 'PERDIDA'::text])));
alter table public.situations drop constraint if exists situations_status_check;
alter table public.situations add constraint situations_status_check CHECK ((status = ANY (ARRAY['ABIERTA'::text, 'EN_PROCESO'::text, 'RESUELTA'::text])));
alter table public.situations drop constraint if exists situations_type_check;
alter table public.situations add constraint situations_type_check CHECK ((type = ANY (ARRAY['ERROR_SISTEMA'::text, 'DISPUTA_PAGO'::text, 'PROBLEMA_SUSCRIPCION'::text, 'FUNCIONALIDAD'::text])));
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check CHECK ((status = ANY (ARRAY['PENDING_PAYMENT'::text, 'ACTIVE'::text, 'EXPIRED'::text, 'CANCELLED'::text])));
-- -- fase: FOREIGN KEY --
alter table public.ai_findings drop constraint if exists ai_findings_case_id_fkey;
alter table public.ai_findings add constraint ai_findings_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id);
alter table public.alerts drop constraint if exists alerts_case_id_fkey;
alter table public.alerts add constraint alerts_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id);
alter table public.alerts drop constraint if exists fk_alert_company;
alter table public.alerts add constraint fk_alert_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
alter table public.aml_policies drop constraint if exists aml_policies_company_id_fkey;
alter table public.aml_policies add constraint aml_policies_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.aml_training_records drop constraint if exists aml_training_records_company_id_fkey;
alter table public.aml_training_records add constraint aml_training_records_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.ap_bills drop constraint if exists ap_bills_company_id_fkey;
alter table public.ap_bills add constraint ap_bills_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.ap_bills drop constraint if exists ap_bills_journal_entry_id_fkey;
alter table public.ap_bills add constraint ap_bills_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.apu_financial_qualification drop constraint if exists apu_financial_qualification_company_id_fkey;
alter table public.apu_financial_qualification add constraint apu_financial_qualification_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.apu_fscl_calculations drop constraint if exists apu_fscl_calculations_apu_project_id_fkey;
alter table public.apu_fscl_calculations add constraint apu_fscl_calculations_apu_project_id_fkey FOREIGN KEY (apu_project_id) REFERENCES apu_projects(id);
alter table public.apu_items drop constraint if exists apu_items_company_id_fkey;
alter table public.apu_items add constraint apu_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.apu_partida_equipment drop constraint if exists apu_partida_equipment_apu_partida_id_fkey;
alter table public.apu_partida_equipment add constraint apu_partida_equipment_apu_partida_id_fkey FOREIGN KEY (apu_partida_id) REFERENCES apu_partidas(id);
alter table public.apu_partida_labor drop constraint if exists apu_partida_labor_apu_partida_id_fkey;
alter table public.apu_partida_labor add constraint apu_partida_labor_apu_partida_id_fkey FOREIGN KEY (apu_partida_id) REFERENCES apu_partidas(id);
alter table public.apu_partida_materials drop constraint if exists apu_partida_materials_apu_partida_id_fkey;
alter table public.apu_partida_materials add constraint apu_partida_materials_apu_partida_id_fkey FOREIGN KEY (apu_partida_id) REFERENCES apu_partidas(id);
alter table public.apu_partidas drop constraint if exists apu_partidas_apu_project_id_fkey;
alter table public.apu_partidas add constraint apu_partidas_apu_project_id_fkey FOREIGN KEY (apu_project_id) REFERENCES apu_projects(id);
alter table public.apu_partidas drop constraint if exists apu_partidas_fscl_calculation_id_fkey;
alter table public.apu_partidas add constraint apu_partidas_fscl_calculation_id_fkey FOREIGN KEY (fscl_calculation_id) REFERENCES apu_fscl_calculations(id);
alter table public.apu_price_catalog drop constraint if exists apu_price_catalog_company_id_fkey;
alter table public.apu_price_catalog add constraint apu_price_catalog_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.apu_price_quotes drop constraint if exists apu_price_quotes_catalog_item_id_fkey;
alter table public.apu_price_quotes add constraint apu_price_quotes_catalog_item_id_fkey FOREIGN KEY (catalog_item_id) REFERENCES apu_price_catalog(id) ON DELETE CASCADE;
alter table public.apu_projects drop constraint if exists apu_projects_company_id_fkey;
alter table public.apu_projects add constraint apu_projects_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.ar_invoices drop constraint if exists ar_invoices_company_id_fkey;
alter table public.ar_invoices add constraint ar_invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.ar_invoices drop constraint if exists ar_invoices_journal_entry_id_fkey;
alter table public.ar_invoices add constraint ar_invoices_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.arbitrage_signals drop constraint if exists arbitrage_signals_company_id_fkey;
alter table public.arbitrage_signals add constraint arbitrage_signals_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.audit_evidence drop constraint if exists audit_evidence_audit_log_id_fkey;
alter table public.audit_evidence add constraint audit_evidence_audit_log_id_fkey FOREIGN KEY (audit_log_id) REFERENCES audit_logs(id);
alter table public.audit_logs drop constraint if exists audit_logs_case_id_fkey;
alter table public.audit_logs add constraint audit_logs_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id);
alter table public.blockchain_seals drop constraint if exists blockchain_seals_company_id_fkey;
alter table public.blockchain_seals add constraint blockchain_seals_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.blockchain_seals drop constraint if exists blockchain_seals_created_by_fkey;
alter table public.blockchain_seals add constraint blockchain_seals_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.case_wallet_analyses drop constraint if exists case_wallet_analyses_case_id_fkey;
alter table public.case_wallet_analyses add constraint case_wallet_analyses_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE;
alter table public.case_wallet_analyses drop constraint if exists case_wallet_analyses_created_by_fkey;
alter table public.case_wallet_analyses add constraint case_wallet_analyses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.cases drop constraint if exists cases_company_id_fkey;
alter table public.cases add constraint cases_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_company_id_fkey;
alter table public.chart_of_accounts add constraint chart_of_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_parent_account_id_fkey;
alter table public.chart_of_accounts add constraint chart_of_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id);
alter table public.companies drop constraint if exists companies_default_ap_account_id_fkey;
alter table public.companies add constraint companies_default_ap_account_id_fkey FOREIGN KEY (default_ap_account_id) REFERENCES chart_of_accounts(id);
alter table public.companies drop constraint if exists companies_default_bank_account_id_fkey;
alter table public.companies add constraint companies_default_bank_account_id_fkey FOREIGN KEY (default_bank_account_id) REFERENCES chart_of_accounts(id);
alter table public.companies drop constraint if exists companies_default_expense_account_id_fkey;
alter table public.companies add constraint companies_default_expense_account_id_fkey FOREIGN KEY (default_expense_account_id) REFERENCES chart_of_accounts(id);
alter table public.companies drop constraint if exists companies_default_islr_withholding_account_id_fkey;
alter table public.companies add constraint companies_default_islr_withholding_account_id_fkey FOREIGN KEY (default_islr_withholding_account_id) REFERENCES chart_of_accounts(id);
alter table public.companies drop constraint if exists companies_default_vat_credit_account_id_fkey;
alter table public.companies add constraint companies_default_vat_credit_account_id_fkey FOREIGN KEY (default_vat_credit_account_id) REFERENCES chart_of_accounts(id);
alter table public.companies drop constraint if exists companies_default_vat_withholding_account_id_fkey;
alter table public.companies add constraint companies_default_vat_withholding_account_id_fkey FOREIGN KEY (default_vat_withholding_account_id) REFERENCES chart_of_accounts(id);
alter table public.companies drop constraint if exists companies_reconstruction_case_id_fkey;
alter table public.companies add constraint companies_reconstruction_case_id_fkey FOREIGN KEY (reconstruction_case_id) REFERENCES cases(id) ON DELETE CASCADE;
alter table public.compliance_filings drop constraint if exists compliance_filings_company_id_fkey;
alter table public.compliance_filings add constraint compliance_filings_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.compliance_filings drop constraint if exists compliance_filings_requirement_id_fkey;
alter table public.compliance_filings add constraint compliance_filings_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES compliance_requirements(id) ON DELETE CASCADE;
alter table public.compliance_requirements drop constraint if exists compliance_requirements_company_id_fkey;
alter table public.compliance_requirements add constraint compliance_requirements_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.customer_account_memory drop constraint if exists customer_account_memory_ar_account_id_fkey;
alter table public.customer_account_memory add constraint customer_account_memory_ar_account_id_fkey FOREIGN KEY (ar_account_id) REFERENCES chart_of_accounts(id);
alter table public.customer_account_memory drop constraint if exists customer_account_memory_company_id_fkey;
alter table public.customer_account_memory add constraint customer_account_memory_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.customer_account_memory drop constraint if exists customer_account_memory_revenue_account_id_fkey;
alter table public.customer_account_memory add constraint customer_account_memory_revenue_account_id_fkey FOREIGN KEY (revenue_account_id) REFERENCES chart_of_accounts(id);
alter table public.customer_account_memory drop constraint if exists customer_account_memory_vat_payable_account_id_fkey;
alter table public.customer_account_memory add constraint customer_account_memory_vat_payable_account_id_fkey FOREIGN KEY (vat_payable_account_id) REFERENCES chart_of_accounts(id);
alter table public.deferred_tax_entries drop constraint if exists deferred_tax_entries_company_id_fkey;
alter table public.deferred_tax_entries add constraint deferred_tax_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.deferred_tax_entries drop constraint if exists deferred_tax_entries_journal_entry_id_fkey;
alter table public.deferred_tax_entries add constraint deferred_tax_entries_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.depreciation_entries drop constraint if exists depreciation_entries_fixed_asset_id_fkey;
alter table public.depreciation_entries add constraint depreciation_entries_fixed_asset_id_fkey FOREIGN KEY (fixed_asset_id) REFERENCES fixed_assets(id);
alter table public.employees drop constraint if exists employees_company_id_fkey;
alter table public.employees add constraint employees_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.entities drop constraint if exists fk_entities_company;
alter table public.entities add constraint fk_entities_company FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.entity_relationships drop constraint if exists fk_rel_source;
alter table public.entity_relationships add constraint fk_rel_source FOREIGN KEY (source_entity) REFERENCES entities(id) ON DELETE CASCADE;
alter table public.entity_relationships drop constraint if exists fk_rel_target;
alter table public.entity_relationships add constraint fk_rel_target FOREIGN KEY (target_entity) REFERENCES entities(id) ON DELETE CASCADE;
alter table public.evaluations drop constraint if exists evaluations_case_id_fkey;
alter table public.evaluations add constraint evaluations_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL;
alter table public.event_ledger drop constraint if exists event_ledger_case_id_fkey;
alter table public.event_ledger add constraint event_ledger_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id);
alter table public.evidences drop constraint if exists evidences_case_id_fkey;
alter table public.evidences add constraint evidences_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE;
alter table public.financial_statement_notes drop constraint if exists financial_statement_notes_company_id_fkey;
alter table public.financial_statement_notes add constraint financial_statement_notes_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.fiscal_deadlines drop constraint if exists fiscal_deadlines_company_id_fkey;
alter table public.fiscal_deadlines add constraint fiscal_deadlines_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.fiscal_periods drop constraint if exists fiscal_periods_closing_entry_id_fkey;
alter table public.fiscal_periods add constraint fiscal_periods_closing_entry_id_fkey FOREIGN KEY (closing_entry_id) REFERENCES journal_entries(id);
alter table public.fiscal_periods drop constraint if exists fiscal_periods_company_id_fkey;
alter table public.fiscal_periods add constraint fiscal_periods_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.fixed_assets drop constraint if exists fixed_assets_account_id_fkey;
alter table public.fixed_assets add constraint fixed_assets_account_id_fkey FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);
alter table public.fixed_assets drop constraint if exists fixed_assets_company_id_fkey;
alter table public.fixed_assets add constraint fixed_assets_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.forensic_cases drop constraint if exists forensic_cases_company_id_fkey;
alter table public.forensic_cases add constraint forensic_cases_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.fx_revaluations drop constraint if exists fx_revaluations_account_id_fkey;
alter table public.fx_revaluations add constraint fx_revaluations_account_id_fkey FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);
alter table public.fx_revaluations drop constraint if exists fx_revaluations_company_id_fkey;
alter table public.fx_revaluations add constraint fx_revaluations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.fx_revaluations drop constraint if exists fx_revaluations_journal_entry_id_fkey;
alter table public.fx_revaluations add constraint fx_revaluations_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.igtf_declarations drop constraint if exists igtf_declarations_company_id_fkey;
alter table public.igtf_declarations add constraint igtf_declarations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.igtf_declarations drop constraint if exists igtf_declarations_journal_entry_id_fkey;
alter table public.igtf_declarations add constraint igtf_declarations_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.inflation_adjustments drop constraint if exists inflation_adjustments_account_id_fkey;
alter table public.inflation_adjustments add constraint inflation_adjustments_account_id_fkey FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);
alter table public.inflation_adjustments drop constraint if exists inflation_adjustments_company_id_fkey;
alter table public.inflation_adjustments add constraint inflation_adjustments_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.inventory_book_entries drop constraint if exists inventory_book_entries_company_id_fkey;
alter table public.inventory_book_entries add constraint inventory_book_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.inventory_items drop constraint if exists inventory_items_account_id_fkey;
alter table public.inventory_items add constraint inventory_items_account_id_fkey FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);
alter table public.inventory_items drop constraint if exists inventory_items_company_id_fkey;
alter table public.inventory_items add constraint inventory_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.inventory_movements drop constraint if exists inventory_movements_inventory_item_id_fkey;
alter table public.inventory_movements add constraint inventory_movements_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id);
alter table public.inventory_movements drop constraint if exists inventory_movements_journal_entry_id_fkey;
alter table public.inventory_movements add constraint inventory_movements_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.investigations drop constraint if exists investigations_case_id_fkey;
alter table public.investigations add constraint investigations_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE;
alter table public.islr_declarations drop constraint if exists islr_declarations_company_id_fkey;
alter table public.islr_declarations add constraint islr_declarations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.islr_estimated_declarations drop constraint if exists islr_estimated_declarations_company_id_fkey;
alter table public.islr_estimated_declarations add constraint islr_estimated_declarations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.journal_entries drop constraint if exists journal_entries_reversal_of_entry_id_fkey;
alter table public.journal_entries add constraint journal_entries_reversal_of_entry_id_fkey FOREIGN KEY (reversal_of_entry_id) REFERENCES journal_entries(id);
alter table public.journal_entries drop constraint if exists journal_entries_reversed_by_entry_id_fkey;
alter table public.journal_entries add constraint journal_entries_reversed_by_entry_id_fkey FOREIGN KEY (reversed_by_entry_id) REFERENCES journal_entries(id);
alter table public.journal_lines drop constraint if exists fk_journal_lines_account;
alter table public.journal_lines add constraint fk_journal_lines_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);
alter table public.journal_lines drop constraint if exists journal_lines_account_id_fkey;
alter table public.journal_lines add constraint journal_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id);
alter table public.journal_lines drop constraint if exists journal_lines_journal_entry_id_fkey;
alter table public.journal_lines add constraint journal_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE;
alter table public.page_visits drop constraint if exists page_visits_user_id_fkey;
alter table public.page_visits add constraint page_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.payroll_details drop constraint if exists payroll_details_employee_id_fkey;
alter table public.payroll_details add constraint payroll_details_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
alter table public.payroll_details drop constraint if exists payroll_details_payroll_run_id_fkey;
alter table public.payroll_details add constraint payroll_details_payroll_run_id_fkey FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id);
alter table public.payroll_runs drop constraint if exists payroll_runs_company_id_fkey;
alter table public.payroll_runs add constraint payroll_runs_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.payroll_runs drop constraint if exists payroll_runs_journal_entry_id_fkey;
alter table public.payroll_runs add constraint payroll_runs_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.purchase_book_entries drop constraint if exists purchase_book_entries_company_id_fkey;
alter table public.purchase_book_entries add constraint purchase_book_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.purchase_book_entries drop constraint if exists purchase_book_entries_journal_entry_id_fkey;
alter table public.purchase_book_entries add constraint purchase_book_entries_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.reconstruction_requests drop constraint if exists reconstruction_requests_case_id_fkey;
alter table public.reconstruction_requests add constraint reconstruction_requests_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id);
alter table public.repomo_calculations drop constraint if exists repomo_calculations_company_id_fkey;
alter table public.repomo_calculations add constraint repomo_calculations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.risk_scores drop constraint if exists fk_risk_scores_entity;
alter table public.risk_scores add constraint fk_risk_scores_entity FOREIGN KEY (entity_id) REFERENCES entities(id);
alter table public.risk_scores drop constraint if exists risk_scores_case_id_fkey;
alter table public.risk_scores add constraint risk_scores_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id);
alter table public.role_permissions drop constraint if exists role_permissions_permission_id_fkey;
alter table public.role_permissions add constraint role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id);
alter table public.role_permissions drop constraint if exists role_permissions_role_id_fkey;
alter table public.role_permissions add constraint role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES user_roles(id);
alter table public.sales_book_entries drop constraint if exists sales_book_entries_company_id_fkey;
alter table public.sales_book_entries add constraint sales_book_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.sales_book_entries drop constraint if exists sales_book_entries_journal_entry_id_fkey;
alter table public.sales_book_entries add constraint sales_book_entries_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
alter table public.sar_reports drop constraint if exists sar_reports_company_id_fkey;
alter table public.sar_reports add constraint sar_reports_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.sar_reports drop constraint if exists sar_reports_created_by_fkey;
alter table public.sar_reports add constraint sar_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.situations drop constraint if exists situations_company_id_fkey;
alter table public.situations add constraint situations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.subscriptions drop constraint if exists subscriptions_company_id_fkey;
alter table public.subscriptions add constraint subscriptions_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.subscriptions drop constraint if exists subscriptions_payment_method_id_fkey;
alter table public.subscriptions add constraint subscriptions_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id);
alter table public.subscriptions drop constraint if exists subscriptions_plan_id_fkey;
alter table public.subscriptions add constraint subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
alter table public.user_companies drop constraint if exists user_companies_company_id_fkey;
alter table public.user_companies add constraint user_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.user_role_assignments drop constraint if exists user_role_assignments_company_id_fkey;
alter table public.user_role_assignments add constraint user_role_assignments_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.user_role_assignments drop constraint if exists user_role_assignments_role_id_fkey;
alter table public.user_role_assignments add constraint user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES user_roles(id);
alter table public.user_role_assignments drop constraint if exists user_role_assignments_user_id_fkey;
alter table public.user_role_assignments add constraint user_role_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.vat_declarations drop constraint if exists vat_declarations_company_id_fkey;
alter table public.vat_declarations add constraint vat_declarations_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_ap_account_id_fkey;
alter table public.vendor_account_memory add constraint vendor_account_memory_ap_account_id_fkey FOREIGN KEY (ap_account_id) REFERENCES chart_of_accounts(id);
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_company_id_fkey;
alter table public.vendor_account_memory add constraint vendor_account_memory_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_expense_account_id_fkey;
alter table public.vendor_account_memory add constraint vendor_account_memory_expense_account_id_fkey FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts(id);
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_islr_withholding_account_id_fkey;
alter table public.vendor_account_memory add constraint vendor_account_memory_islr_withholding_account_id_fkey FOREIGN KEY (islr_withholding_account_id) REFERENCES chart_of_accounts(id);
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_vat_credit_account_id_fkey;
alter table public.vendor_account_memory add constraint vendor_account_memory_vat_credit_account_id_fkey FOREIGN KEY (vat_credit_account_id) REFERENCES chart_of_accounts(id);
alter table public.vendor_account_memory drop constraint if exists vendor_account_memory_vat_withholding_account_id_fkey;
alter table public.vendor_account_memory add constraint vendor_account_memory_vat_withholding_account_id_fkey FOREIGN KEY (vat_withholding_account_id) REFERENCES chart_of_accounts(id);
alter table public.wallet_addresses drop constraint if exists wallet_addresses_company_id_fkey;
alter table public.wallet_addresses add constraint wallet_addresses_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);
alter table public.withholding_summary drop constraint if exists withholding_summary_company_id_fkey;
alter table public.withholding_summary add constraint withholding_summary_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id);

-- ===== INDICES (sin contar el indice automatico de cada primary key) =====
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_aml_policies_company ON public.aml_policies USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_aml_training_company ON public.aml_training_records USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS api_rate_limits_user_id_endpoint_window_start_key ON public.api_rate_limits USING btree (user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.api_rate_limits USING btree (user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_apu_partida_equipment_partida ON public.apu_partida_equipment USING btree (apu_partida_id);
CREATE INDEX IF NOT EXISTS idx_apu_partida_labor_partida ON public.apu_partida_labor USING btree (apu_partida_id);
CREATE INDEX IF NOT EXISTS idx_apu_partida_materials_partida ON public.apu_partida_materials USING btree (apu_partida_id);
CREATE INDEX IF NOT EXISTS idx_apu_partidas_apu_project_id ON public.apu_partidas USING btree (apu_project_id);
CREATE INDEX IF NOT EXISTS idx_apu_partidas_project ON public.apu_partidas USING btree (apu_project_id);
CREATE INDEX IF NOT EXISTS idx_apu_price_catalog_company ON public.apu_price_catalog USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_apu_price_catalog_category ON public.apu_price_catalog USING btree (company_id, category);
CREATE INDEX IF NOT EXISTS idx_apu_price_quotes_catalog_item ON public.apu_price_quotes USING btree (catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_apu_projects_company_id ON public.apu_projects USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_signals_company ON public.arbitrage_signals USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_seals_company ON public.blockchain_seals USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_seals_hash ON public.blockchain_seals USING btree (document_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_seals_created ON public.blockchain_seals USING btree (company_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS blockchain_transactions_tx_hash_key ON public.blockchain_transactions USING btree (tx_hash);
CREATE INDEX IF NOT EXISTS idx_tx_hash ON public.blockchain_transactions USING btree (tx_hash);
CREATE INDEX IF NOT EXISTS idx_case_wallet_analyses_case ON public.case_wallet_analyses USING btree (case_id);
CREATE INDEX IF NOT EXISTS idx_cases_code ON public.cases USING btree (case_code);
CREATE INDEX IF NOT EXISTS idx_cases_company_id ON public.cases USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_company_id ON public.chart_of_accounts USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS chart_of_accounts_company_code_unique ON public.chart_of_accounts USING btree (company_id, account_code);
CREATE INDEX IF NOT EXISTS idx_companies_reconstruction_case ON public.companies USING btree (reconstruction_case_id);
CREATE INDEX IF NOT EXISTS idx_compliance_filings_company ON public.compliance_filings USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_req_company ON public.compliance_requirements USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS customer_account_memory_company_id_customer_tax_id_key ON public.customer_account_memory USING btree (company_id, customer_tax_id);
CREATE INDEX IF NOT EXISTS idx_entities_name ON public.entities USING btree (entity_name);
CREATE INDEX IF NOT EXISTS idx_relationship_source ON public.entity_relationships USING btree (source_entity);
CREATE INDEX IF NOT EXISTS idx_relationship_target ON public.entity_relationships USING btree (target_entity);
CREATE INDEX IF NOT EXISTS idx_event_hash ON public.event_ledger USING btree (event_hash);
CREATE INDEX IF NOT EXISTS idx_previous_hash ON public.event_ledger USING btree (previous_hash);
CREATE INDEX IF NOT EXISTS idx_event_type ON public.event_ledger USING btree (event_type);
CREATE UNIQUE INDEX IF NOT EXISTS exchange_rates_from_currency_to_currency_rate_date_key ON public.exchange_rates USING btree (from_currency, to_currency, rate_date);
CREATE UNIQUE INDEX IF NOT EXISTS external_api_keys_key_hash_key ON public.external_api_keys USING btree (key_hash);
CREATE INDEX IF NOT EXISTS idx_islr_declarations_company ON public.islr_declarations USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON public.journal_entries USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS journal_entries_active_entry_number_unique ON public.journal_entries USING btree (company_id, entry_number) WHERE (status = 'ACTIVE'::text);
CREATE INDEX IF NOT EXISTS idx_journal_lines_journal_entry_id ON public.journal_lines USING btree (journal_entry_id);
CREATE UNIQUE INDEX IF NOT EXISTS ofac_sanctioned_addresses_address_key ON public.ofac_sanctioned_addresses USING btree (address);
CREATE INDEX IF NOT EXISTS idx_ofac_addresses ON public.ofac_sanctioned_addresses USING btree (address);
CREATE INDEX IF NOT EXISTS page_visits_created_at_idx ON public.page_visits USING btree (created_at);
CREATE INDEX IF NOT EXISTS page_visits_visitor_id_idx ON public.page_visits USING btree (visitor_id);
CREATE INDEX IF NOT EXISTS page_visits_path_idx ON public.page_visits USING btree (path);
CREATE INDEX IF NOT EXISTS page_visits_ip_created_idx ON public.page_visits USING btree (ip_address, created_at);
CREATE INDEX IF NOT EXISTS page_visits_visitor_created_idx ON public.page_visits USING btree (visitor_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_method_code_key ON public.payment_methods USING btree (method_code);
CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_key ON public.permissions USING btree (name);
CREATE UNIQUE INDEX IF NOT EXISTS price_indices_country_code_index_name_period_date_key ON public.price_indices USING btree (country_code, index_name, period_date);
CREATE INDEX IF NOT EXISTS idx_purchase_book_entries_company_id ON public.purchase_book_entries USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS purchase_book_entries_active_entry_number_unique ON public.purchase_book_entries USING btree (company_id, entry_number) WHERE (status = 'ACTIVE'::text);
CREATE UNIQUE INDEX IF NOT EXISTS risk_rules_code_key ON public.risk_rules USING btree (code);
CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_sales_book_entries_company_id ON public.sales_book_entries USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS sales_book_entries_active_entry_number_unique ON public.sales_book_entries USING btree (company_id, entry_number) WHERE (status = 'ACTIVE'::text);
CREATE INDEX IF NOT EXISTS idx_sar_reports_company ON public.sar_reports USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_plan_code_key ON public.subscription_plans USING btree (plan_code);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON public.user_companies USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON public.user_companies USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_role_assignments_user_id_role_id_company_id_key ON public.user_role_assignments USING btree (user_id, role_id, company_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_name_key ON public.user_roles USING btree (name);
CREATE INDEX IF NOT EXISTS idx_vat_declarations_company ON public.vat_declarations USING btree (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS vendor_account_memory_company_id_vendor_tax_id_key ON public.vendor_account_memory USING btree (company_id, vendor_tax_id);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_addresses_address_key ON public.wallet_addresses USING btree (address);
CREATE INDEX IF NOT EXISTS wallet_addresses_company_id_idx ON public.wallet_addresses USING btree (company_id);

-- ===== ROW LEVEL SECURITY Y POLITICAS =====
alter table public.ai_findings enable row level security;
drop policy if exists "via_case_select" on public.ai_findings;
create policy "via_case_select" on public.ai_findings for select to public using ((EXISTS ( SELECT 1    FROM forensic_cases fc   WHERE ((fc.id = ai_findings.case_id) AND is_company_member(fc.company_id)))));
drop policy if exists "write_admin_auditor_delete" on public.ai_findings;
create policy "write_admin_auditor_delete" on public.ai_findings for delete to public using ((EXISTS ( SELECT 1    FROM forensic_cases fc   WHERE ((fc.id = ai_findings.case_id) AND is_company_member(fc.company_id) AND (get_user_role(fc.company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))))));
drop policy if exists "write_admin_auditor_insert" on public.ai_findings;
create policy "write_admin_auditor_insert" on public.ai_findings for insert to public with check ((EXISTS ( SELECT 1    FROM forensic_cases fc   WHERE ((fc.id = ai_findings.case_id) AND is_company_member(fc.company_id) AND (get_user_role(fc.company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))))));
drop policy if exists "write_admin_auditor_update" on public.ai_findings;
create policy "write_admin_auditor_update" on public.ai_findings for update to public using ((EXISTS ( SELECT 1    FROM forensic_cases fc   WHERE ((fc.id = ai_findings.case_id) AND is_company_member(fc.company_id) AND (get_user_role(fc.company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))))));

alter table public.alerts enable row level security;
drop policy if exists "alerts_delete_own_company" on public.alerts;
create policy "alerts_delete_own_company" on public.alerts for delete to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "alerts_insert_own_company" on public.alerts;
create policy "alerts_insert_own_company" on public.alerts for insert to public with check ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "alerts_isolation" on public.alerts;
create policy "alerts_isolation" on public.alerts for all to public using ((company_id = current_company_id()));
drop policy if exists "alerts_select_own_company" on public.alerts;
create policy "alerts_select_own_company" on public.alerts for select to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "alerts_update_own_company" on public.alerts;
create policy "alerts_update_own_company" on public.alerts for update to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "company_isolation_insert" on public.alerts;
create policy "company_isolation_insert" on public.alerts for insert to public with check ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = alerts.case_id) AND is_company_member(c.company_id)))));
drop policy if exists "company_isolation_select" on public.alerts;
create policy "company_isolation_select" on public.alerts for select to public using ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = alerts.case_id) AND is_company_member(c.company_id)))));

alter table public.aml_policies enable row level security;
drop policy if exists "company_access_aml_policies" on public.aml_policies;
create policy "company_access_aml_policies" on public.aml_policies for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = aml_policies.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = aml_policies.company_id) AND (uc.user_id = auth.uid())))));

alter table public.aml_training_records enable row level security;
drop policy if exists "company_access_aml_training" on public.aml_training_records;
create policy "company_access_aml_training" on public.aml_training_records for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = aml_training_records.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = aml_training_records.company_id) AND (uc.user_id = auth.uid())))));

alter table public.ap_bills enable row level security;
drop policy if exists "company_isolation_select" on public.ap_bills;
create policy "company_isolation_select" on public.ap_bills for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.ap_bills;
create policy "write_admin_contador_delete" on public.ap_bills for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.ap_bills;
create policy "write_admin_contador_insert" on public.ap_bills for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.ap_bills;
create policy "write_admin_contador_update" on public.ap_bills for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.api_rate_limits enable row level security;
drop policy if exists "own_rate_limits" on public.api_rate_limits;
create policy "own_rate_limits" on public.api_rate_limits for all to public using ((user_id = auth.uid()));

alter table public.approvals enable row level security;
drop policy if exists "company_isolation_select" on public.approvals;
create policy "company_isolation_select" on public.approvals for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_contador_delete" on public.approvals;
create policy "write_admin_auditor_contador_delete" on public.approvals for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_auditor_contador_insert" on public.approvals;
create policy "write_admin_auditor_contador_insert" on public.approvals for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_auditor_contador_update" on public.approvals;
create policy "write_admin_auditor_contador_update" on public.approvals for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text, 'CONTADOR'::text]))));

alter table public.apu_catalog_items enable row level security;
drop policy if exists "authenticated_read_apu_catalog" on public.apu_catalog_items;
create policy "authenticated_read_apu_catalog" on public.apu_catalog_items for select to public using ((auth.role() = 'authenticated'::text));

alter table public.apu_financial_qualification enable row level security;
drop policy if exists "company_isolation_select" on public.apu_financial_qualification;
create policy "company_isolation_select" on public.apu_financial_qualification for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.apu_financial_qualification;
create policy "write_admin_contador_delete" on public.apu_financial_qualification for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.apu_financial_qualification;
create policy "write_admin_contador_insert" on public.apu_financial_qualification for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.apu_financial_qualification;
create policy "write_admin_contador_update" on public.apu_financial_qualification for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.apu_fscl_calculations enable row level security;
drop policy if exists "company_isolation_delete" on public.apu_fscl_calculations;
create policy "company_isolation_delete" on public.apu_fscl_calculations for delete to public using ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_fscl_calculations.apu_project_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_insert" on public.apu_fscl_calculations;
create policy "company_isolation_insert" on public.apu_fscl_calculations for insert to public with check ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_fscl_calculations.apu_project_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_select" on public.apu_fscl_calculations;
create policy "company_isolation_select" on public.apu_fscl_calculations for select to public using ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_fscl_calculations.apu_project_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_update" on public.apu_fscl_calculations;
create policy "company_isolation_update" on public.apu_fscl_calculations for update to public using ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_fscl_calculations.apu_project_id) AND is_company_member(ap.company_id)))));

alter table public.apu_items enable row level security;
drop policy if exists "write_admin_contador_delete" on public.apu_items;
create policy "write_admin_contador_delete" on public.apu_items for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.apu_items;
create policy "write_admin_contador_insert" on public.apu_items for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.apu_items;
create policy "write_admin_contador_update" on public.apu_items for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.apu_partida_equipment enable row level security;
drop policy if exists "company_access_apu_partida_equipment" on public.apu_partida_equipment;
create policy "company_access_apu_partida_equipment" on public.apu_partida_equipment for all to public using ((EXISTS ( SELECT 1    FROM ((apu_partidas pa      JOIN apu_projects p ON ((p.id = pa.apu_project_id)))      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((pa.id = apu_partida_equipment.apu_partida_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM ((apu_partidas pa      JOIN apu_projects p ON ((p.id = pa.apu_project_id)))      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((pa.id = apu_partida_equipment.apu_partida_id) AND (uc.user_id = auth.uid())))));
drop policy if exists "company_isolation_delete" on public.apu_partida_equipment;
create policy "company_isolation_delete" on public.apu_partida_equipment for delete to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_equipment.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_insert" on public.apu_partida_equipment;
create policy "company_isolation_insert" on public.apu_partida_equipment for insert to public with check ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_equipment.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_select" on public.apu_partida_equipment;
create policy "company_isolation_select" on public.apu_partida_equipment for select to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_equipment.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_update" on public.apu_partida_equipment;
create policy "company_isolation_update" on public.apu_partida_equipment for update to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_equipment.apu_partida_id) AND is_company_member(ap.company_id)))));

alter table public.apu_partida_labor enable row level security;
drop policy if exists "company_access_apu_partida_labor" on public.apu_partida_labor;
create policy "company_access_apu_partida_labor" on public.apu_partida_labor for all to public using ((EXISTS ( SELECT 1    FROM ((apu_partidas pa      JOIN apu_projects p ON ((p.id = pa.apu_project_id)))      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((pa.id = apu_partida_labor.apu_partida_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM ((apu_partidas pa      JOIN apu_projects p ON ((p.id = pa.apu_project_id)))      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((pa.id = apu_partida_labor.apu_partida_id) AND (uc.user_id = auth.uid())))));
drop policy if exists "company_isolation_delete" on public.apu_partida_labor;
create policy "company_isolation_delete" on public.apu_partida_labor for delete to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_labor.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_insert" on public.apu_partida_labor;
create policy "company_isolation_insert" on public.apu_partida_labor for insert to public with check ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_labor.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_select" on public.apu_partida_labor;
create policy "company_isolation_select" on public.apu_partida_labor for select to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_labor.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_update" on public.apu_partida_labor;
create policy "company_isolation_update" on public.apu_partida_labor for update to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_labor.apu_partida_id) AND is_company_member(ap.company_id)))));

alter table public.apu_partida_materials enable row level security;
drop policy if exists "company_access_apu_partida_materials" on public.apu_partida_materials;
create policy "company_access_apu_partida_materials" on public.apu_partida_materials for all to public using ((EXISTS ( SELECT 1    FROM ((apu_partidas pa      JOIN apu_projects p ON ((p.id = pa.apu_project_id)))      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((pa.id = apu_partida_materials.apu_partida_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM ((apu_partidas pa      JOIN apu_projects p ON ((p.id = pa.apu_project_id)))      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((pa.id = apu_partida_materials.apu_partida_id) AND (uc.user_id = auth.uid())))));
drop policy if exists "company_isolation_delete" on public.apu_partida_materials;
create policy "company_isolation_delete" on public.apu_partida_materials for delete to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_materials.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_insert" on public.apu_partida_materials;
create policy "company_isolation_insert" on public.apu_partida_materials for insert to public with check ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_materials.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_select" on public.apu_partida_materials;
create policy "company_isolation_select" on public.apu_partida_materials for select to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_materials.apu_partida_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_update" on public.apu_partida_materials;
create policy "company_isolation_update" on public.apu_partida_materials for update to public using ((EXISTS ( SELECT 1    FROM (apu_partidas p      JOIN apu_projects ap ON ((ap.id = p.apu_project_id)))   WHERE ((p.id = apu_partida_materials.apu_partida_id) AND is_company_member(ap.company_id)))));

alter table public.apu_partidas enable row level security;
drop policy if exists "company_access_apu_partidas" on public.apu_partidas;
create policy "company_access_apu_partidas" on public.apu_partidas for all to public using ((EXISTS ( SELECT 1    FROM (apu_projects p      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((p.id = apu_partidas.apu_project_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM (apu_projects p      JOIN user_companies uc ON ((uc.company_id = p.company_id)))   WHERE ((p.id = apu_partidas.apu_project_id) AND (uc.user_id = auth.uid())))));
drop policy if exists "company_isolation_delete" on public.apu_partidas;
create policy "company_isolation_delete" on public.apu_partidas for delete to public using ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_partidas.apu_project_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_insert" on public.apu_partidas;
create policy "company_isolation_insert" on public.apu_partidas for insert to public with check ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_partidas.apu_project_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_select" on public.apu_partidas;
create policy "company_isolation_select" on public.apu_partidas for select to public using ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_partidas.apu_project_id) AND is_company_member(ap.company_id)))));
drop policy if exists "company_isolation_update" on public.apu_partidas;
create policy "company_isolation_update" on public.apu_partidas for update to public using ((EXISTS ( SELECT 1    FROM apu_projects ap   WHERE ((ap.id = apu_partidas.apu_project_id) AND is_company_member(ap.company_id)))));

alter table public.apu_price_catalog enable row level security;
drop policy if exists "company_access_apu_price_catalog" on public.apu_price_catalog;
create policy "company_access_apu_price_catalog" on public.apu_price_catalog for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = apu_price_catalog.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = apu_price_catalog.company_id) AND (uc.user_id = auth.uid())))));

alter table public.apu_price_quotes enable row level security;
drop policy if exists "company_access_apu_price_quotes" on public.apu_price_quotes;
create policy "company_access_apu_price_quotes" on public.apu_price_quotes for all to public using ((EXISTS ( SELECT 1    FROM (apu_price_catalog c      JOIN user_companies uc ON ((uc.company_id = c.company_id)))   WHERE ((c.id = apu_price_quotes.catalog_item_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM (apu_price_catalog c      JOIN user_companies uc ON ((uc.company_id = c.company_id)))   WHERE ((c.id = apu_price_quotes.catalog_item_id) AND (uc.user_id = auth.uid())))));

alter table public.apu_projects enable row level security;
drop policy if exists "company_isolation_delete" on public.apu_projects;
create policy "company_isolation_delete" on public.apu_projects for delete to public using (is_company_member(company_id));
drop policy if exists "company_isolation_insert" on public.apu_projects;
create policy "company_isolation_insert" on public.apu_projects for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.apu_projects;
create policy "company_isolation_select" on public.apu_projects for select to public using (is_company_member(company_id));
drop policy if exists "company_isolation_update" on public.apu_projects;
create policy "company_isolation_update" on public.apu_projects for update to public using (is_company_member(company_id));

alter table public.ar_invoices enable row level security;
drop policy if exists "company_isolation_select" on public.ar_invoices;
create policy "company_isolation_select" on public.ar_invoices for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.ar_invoices;
create policy "write_admin_contador_delete" on public.ar_invoices for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.ar_invoices;
create policy "write_admin_contador_insert" on public.ar_invoices for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.ar_invoices;
create policy "write_admin_contador_update" on public.ar_invoices for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.arbitrage_signals enable row level security;
drop policy if exists "company_access_arbitrage_signals" on public.arbitrage_signals;
create policy "company_access_arbitrage_signals" on public.arbitrage_signals for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = arbitrage_signals.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = arbitrage_signals.company_id) AND (uc.user_id = auth.uid())))));

alter table public.audit_chain enable row level security;
drop policy if exists "company_isolation_select" on public.audit_chain;
create policy "company_isolation_select" on public.audit_chain for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_delete" on public.audit_chain;
create policy "write_admin_auditor_delete" on public.audit_chain for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_insert" on public.audit_chain;
create policy "write_admin_auditor_insert" on public.audit_chain for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_update" on public.audit_chain;
create policy "write_admin_auditor_update" on public.audit_chain for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));

alter table public.audit_evidence enable row level security;
drop policy if exists "company_isolation_select" on public.audit_evidence;
create policy "company_isolation_select" on public.audit_evidence for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_delete" on public.audit_evidence;
create policy "write_admin_auditor_delete" on public.audit_evidence for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_insert" on public.audit_evidence;
create policy "write_admin_auditor_insert" on public.audit_evidence for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_update" on public.audit_evidence;
create policy "write_admin_auditor_update" on public.audit_evidence for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));

alter table public.audit_findings enable row level security;
drop policy if exists "company_isolation_select" on public.audit_findings;
create policy "company_isolation_select" on public.audit_findings for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_delete" on public.audit_findings;
create policy "write_admin_auditor_delete" on public.audit_findings for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_insert" on public.audit_findings;
create policy "write_admin_auditor_insert" on public.audit_findings for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_update" on public.audit_findings;
create policy "write_admin_auditor_update" on public.audit_findings for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));

alter table public.audit_logs enable row level security;
drop policy if exists "audit_logs_isolation" on public.audit_logs;
create policy "audit_logs_isolation" on public.audit_logs for all to public using ((company_id = current_company_id()));
drop policy if exists "audit_logs_tenant_isolation" on public.audit_logs;
create policy "audit_logs_tenant_isolation" on public.audit_logs for all to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "company_isolation_select" on public.audit_logs;
create policy "company_isolation_select" on public.audit_logs for select to public using (is_company_member(company_id));
drop policy if exists "tenant_isolation" on public.audit_logs;
create policy "tenant_isolation" on public.audit_logs for all to public using ((company_id = ((auth.jwt() ->> 'company_id'::text))::uuid));

alter table public.blockchain_seals enable row level security;
drop policy if exists "company_access_blockchain_seals" on public.blockchain_seals;
create policy "company_access_blockchain_seals" on public.blockchain_seals for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = blockchain_seals.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = blockchain_seals.company_id) AND (uc.user_id = auth.uid())))));

alter table public.blockchain_transactions enable row level security;
drop policy if exists "authenticated_read" on public.blockchain_transactions;
create policy "authenticated_read" on public.blockchain_transactions for select to public using ((auth.role() = 'authenticated'::text));

alter table public.case_wallet_analyses enable row level security;
drop policy if exists "case_wallet_analyses_insert_own_company" on public.case_wallet_analyses;
create policy "case_wallet_analyses_insert_own_company" on public.case_wallet_analyses for insert to public with check ((EXISTS ( SELECT 1    FROM cases   WHERE ((cases.id = case_wallet_analyses.case_id) AND (cases.company_id IN ( SELECT user_companies.company_id            FROM user_companies           WHERE (user_companies.user_id = auth.uid())))))));
drop policy if exists "case_wallet_analyses_select_own_company" on public.case_wallet_analyses;
create policy "case_wallet_analyses_select_own_company" on public.case_wallet_analyses for select to public using ((EXISTS ( SELECT 1    FROM cases   WHERE ((cases.id = case_wallet_analyses.case_id) AND (cases.company_id IN ( SELECT user_companies.company_id            FROM user_companies           WHERE (user_companies.user_id = auth.uid())))))));

alter table public.cases enable row level security;
drop policy if exists "cases_delete_own_company" on public.cases;
create policy "cases_delete_own_company" on public.cases for delete to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "cases_insert_own_company" on public.cases;
create policy "cases_insert_own_company" on public.cases for insert to public with check ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "cases_select_own_company" on public.cases;
create policy "cases_select_own_company" on public.cases for select to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "cases_update_own_company" on public.cases;
create policy "cases_update_own_company" on public.cases for update to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "company_isolation_delete" on public.cases;
create policy "company_isolation_delete" on public.cases for delete to public using (is_company_member(company_id));
drop policy if exists "company_isolation_insert" on public.cases;
create policy "company_isolation_insert" on public.cases for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.cases;
create policy "company_isolation_select" on public.cases for select to public using (is_company_member(company_id));
drop policy if exists "company_isolation_update" on public.cases;
create policy "company_isolation_update" on public.cases for update to public using (is_company_member(company_id));

alter table public.chart_of_accounts enable row level security;
drop policy if exists "company_isolation_select" on public.chart_of_accounts;
create policy "company_isolation_select" on public.chart_of_accounts for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.chart_of_accounts;
create policy "write_admin_contador_delete" on public.chart_of_accounts for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.chart_of_accounts;
create policy "write_admin_contador_insert" on public.chart_of_accounts for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.chart_of_accounts;
create policy "write_admin_contador_update" on public.chart_of_accounts for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.companies enable row level security;
drop policy if exists "insert_own_company" on public.companies;
create policy "insert_own_company" on public.companies for insert to public with check ((owner_id = auth.uid()));
drop policy if exists "select_own_companies" on public.companies;
create policy "select_own_companies" on public.companies for select to public using ((is_company_member(id) OR (owner_id = auth.uid())));
drop policy if exists "update_own_company" on public.companies;
create policy "update_own_company" on public.companies for update to public using ((is_company_member(id) OR (owner_id = auth.uid()))) with check ((is_company_member(id) OR (owner_id = auth.uid())));

alter table public.compliance_filings enable row level security;
drop policy if exists "company_access_compliance_filings" on public.compliance_filings;
create policy "company_access_compliance_filings" on public.compliance_filings for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = compliance_filings.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = compliance_filings.company_id) AND (uc.user_id = auth.uid())))));

alter table public.compliance_requirements enable row level security;
drop policy if exists "company_access_compliance_req" on public.compliance_requirements;
create policy "company_access_compliance_req" on public.compliance_requirements for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = compliance_requirements.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = compliance_requirements.company_id) AND (uc.user_id = auth.uid())))));

alter table public.contact_submissions enable row level security;
drop policy if exists "admin_read_contact_submissions" on public.contact_submissions;
create policy "admin_read_contact_submissions" on public.contact_submissions for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "public_insert_contact_submissions" on public.contact_submissions;
create policy "public_insert_contact_submissions" on public.contact_submissions for insert to public with check (true);

alter table public.customer_account_memory enable row level security;
drop policy if exists "company_isolation_select" on public.customer_account_memory;
create policy "company_isolation_select" on public.customer_account_memory for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.customer_account_memory;
create policy "write_admin_contador_delete" on public.customer_account_memory for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.customer_account_memory;
create policy "write_admin_contador_insert" on public.customer_account_memory for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.customer_account_memory;
create policy "write_admin_contador_update" on public.customer_account_memory for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.deferred_tax_entries enable row level security;
drop policy if exists "company_isolation_select" on public.deferred_tax_entries;
create policy "company_isolation_select" on public.deferred_tax_entries for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.deferred_tax_entries;
create policy "write_admin_contador_delete" on public.deferred_tax_entries for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.deferred_tax_entries;
create policy "write_admin_contador_insert" on public.deferred_tax_entries for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.deferred_tax_entries;
create policy "write_admin_contador_update" on public.deferred_tax_entries for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.depreciation_entries enable row level security;
drop policy if exists "company_isolation_select" on public.depreciation_entries;
create policy "company_isolation_select" on public.depreciation_entries for select to public using ((EXISTS ( SELECT 1    FROM fixed_assets fa   WHERE ((fa.id = depreciation_entries.fixed_asset_id) AND is_company_member(fa.company_id)))));
drop policy if exists "write_admin_contador_delete" on public.depreciation_entries;
create policy "write_admin_contador_delete" on public.depreciation_entries for delete to public using ((EXISTS ( SELECT 1    FROM fixed_assets p   WHERE ((p.id = depreciation_entries.fixed_asset_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_insert" on public.depreciation_entries;
create policy "write_admin_contador_insert" on public.depreciation_entries for insert to public with check ((EXISTS ( SELECT 1    FROM fixed_assets p   WHERE ((p.id = depreciation_entries.fixed_asset_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_update" on public.depreciation_entries;
create policy "write_admin_contador_update" on public.depreciation_entries for update to public using ((EXISTS ( SELECT 1    FROM fixed_assets p   WHERE ((p.id = depreciation_entries.fixed_asset_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));

alter table public.employees enable row level security;
drop policy if exists "company_isolation_select" on public.employees;
create policy "company_isolation_select" on public.employees for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.employees;
create policy "write_admin_contador_delete" on public.employees for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.employees;
create policy "write_admin_contador_insert" on public.employees for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.employees;
create policy "write_admin_contador_update" on public.employees for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.entities enable row level security;
drop policy if exists "company_isolation_delete" on public.entities;
create policy "company_isolation_delete" on public.entities for delete to public using (is_company_member(company_id));
drop policy if exists "company_isolation_insert" on public.entities;
create policy "company_isolation_insert" on public.entities for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.entities;
create policy "company_isolation_select" on public.entities for select to public using (is_company_member(company_id));
drop policy if exists "company_isolation_update" on public.entities;
create policy "company_isolation_update" on public.entities for update to public using (is_company_member(company_id));
drop policy if exists "entities_isolation" on public.entities;
create policy "entities_isolation" on public.entities for all to public using ((company_id = current_company_id()));

alter table public.entity_relationships enable row level security;
drop policy if exists "authenticated_read" on public.entity_relationships;
create policy "authenticated_read" on public.entity_relationships for select to public using ((auth.role() = 'authenticated'::text));

alter table public.evaluations enable row level security;
drop policy if exists "company_isolation_insert" on public.evaluations;
create policy "company_isolation_insert" on public.evaluations for insert to public with check ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = evaluations.case_id) AND is_company_member(c.company_id)))));
drop policy if exists "company_isolation_select" on public.evaluations;
create policy "company_isolation_select" on public.evaluations for select to public using ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = evaluations.case_id) AND is_company_member(c.company_id)))));

alter table public.event_ledger enable row level security;
drop policy if exists "event_ledger_select_own_company" on public.event_ledger;
create policy "event_ledger_select_own_company" on public.event_ledger for select to public using (((case_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM cases   WHERE ((cases.id = event_ledger.case_id) AND (cases.company_id IN ( SELECT user_companies.company_id            FROM user_companies           WHERE (user_companies.user_id = auth.uid()))))))));
drop policy if exists "event_ledger_select_own_company_direct" on public.event_ledger;
create policy "event_ledger_select_own_company_direct" on public.event_ledger for select to public using (((company_id IS NOT NULL) AND (company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid())))));

alter table public.evidences enable row level security;
drop policy if exists "evidences_delete_admin_auditor" on public.evidences;
create policy "evidences_delete_admin_auditor" on public.evidences for delete to public using ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = evidences.case_id) AND is_company_member(c.company_id) AND (get_user_role(c.company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))))));
drop policy if exists "evidences_select_own_company" on public.evidences;
create policy "evidences_select_own_company" on public.evidences for select to public using ((EXISTS ( SELECT 1    FROM cases   WHERE ((cases.id = evidences.case_id) AND (cases.company_id IN ( SELECT user_companies.company_id            FROM user_companies           WHERE (user_companies.user_id = auth.uid())))))));
drop policy if exists "evidences_update_admin_auditor" on public.evidences;
create policy "evidences_update_admin_auditor" on public.evidences for update to public using ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = evidences.case_id) AND is_company_member(c.company_id) AND (get_user_role(c.company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))))));
drop policy if exists "evidences_write_admin_auditor" on public.evidences;
create policy "evidences_write_admin_auditor" on public.evidences for insert to public with check ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = evidences.case_id) AND is_company_member(c.company_id) AND (get_user_role(c.company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))))));

alter table public.exchange_rates enable row level security;
drop policy if exists "authenticated_read" on public.exchange_rates;
create policy "authenticated_read" on public.exchange_rates for select to public using ((auth.role() = 'authenticated'::text));

alter table public.external_api_keys enable row level security;

alter table public.financial_statement_notes enable row level security;
drop policy if exists "company_isolation_select" on public.financial_statement_notes;
create policy "company_isolation_select" on public.financial_statement_notes for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.financial_statement_notes;
create policy "write_admin_contador_delete" on public.financial_statement_notes for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.financial_statement_notes;
create policy "write_admin_contador_insert" on public.financial_statement_notes for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.financial_statement_notes;
create policy "write_admin_contador_update" on public.financial_statement_notes for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.fiscal_deadlines enable row level security;
drop policy if exists "delete_admin_contador" on public.fiscal_deadlines;
create policy "delete_admin_contador" on public.fiscal_deadlines for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "read_all_roles" on public.fiscal_deadlines;
create policy "read_all_roles" on public.fiscal_deadlines for select to public using (is_company_member(company_id));
drop policy if exists "update_admin_contador" on public.fiscal_deadlines;
create policy "update_admin_contador" on public.fiscal_deadlines for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador" on public.fiscal_deadlines;
create policy "write_admin_contador" on public.fiscal_deadlines for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.fiscal_periods enable row level security;
drop policy if exists "company_isolation_select" on public.fiscal_periods;
create policy "company_isolation_select" on public.fiscal_periods for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.fiscal_periods;
create policy "write_admin_contador_delete" on public.fiscal_periods for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.fiscal_periods;
create policy "write_admin_contador_insert" on public.fiscal_periods for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.fiscal_periods;
create policy "write_admin_contador_update" on public.fiscal_periods for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.fixed_assets enable row level security;
drop policy if exists "company_isolation_select" on public.fixed_assets;
create policy "company_isolation_select" on public.fixed_assets for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.fixed_assets;
create policy "write_admin_contador_delete" on public.fixed_assets for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.fixed_assets;
create policy "write_admin_contador_insert" on public.fixed_assets for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.fixed_assets;
create policy "write_admin_contador_update" on public.fixed_assets for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.forensic_cases enable row level security;
drop policy if exists "company_isolation_select" on public.forensic_cases;
create policy "company_isolation_select" on public.forensic_cases for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_delete" on public.forensic_cases;
create policy "write_admin_auditor_delete" on public.forensic_cases for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_insert" on public.forensic_cases;
create policy "write_admin_auditor_insert" on public.forensic_cases for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_update" on public.forensic_cases;
create policy "write_admin_auditor_update" on public.forensic_cases for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));

alter table public.fx_revaluations enable row level security;
drop policy if exists "company_isolation_select" on public.fx_revaluations;
create policy "company_isolation_select" on public.fx_revaluations for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.fx_revaluations;
create policy "write_admin_contador_delete" on public.fx_revaluations for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.fx_revaluations;
create policy "write_admin_contador_insert" on public.fx_revaluations for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.fx_revaluations;
create policy "write_admin_contador_update" on public.fx_revaluations for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.igtf_declarations enable row level security;
drop policy if exists "company_isolation_select" on public.igtf_declarations;
create policy "company_isolation_select" on public.igtf_declarations for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.igtf_declarations;
create policy "write_admin_contador_delete" on public.igtf_declarations for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.igtf_declarations;
create policy "write_admin_contador_insert" on public.igtf_declarations for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.igtf_declarations;
create policy "write_admin_contador_update" on public.igtf_declarations for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.inflation_adjustments enable row level security;
drop policy if exists "company_isolation_delete" on public.inflation_adjustments;
create policy "company_isolation_delete" on public.inflation_adjustments for delete to public using (is_company_member(company_id));
drop policy if exists "company_isolation_insert" on public.inflation_adjustments;
create policy "company_isolation_insert" on public.inflation_adjustments for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.inflation_adjustments;
create policy "company_isolation_select" on public.inflation_adjustments for select to public using (is_company_member(company_id));
drop policy if exists "company_isolation_update" on public.inflation_adjustments;
create policy "company_isolation_update" on public.inflation_adjustments for update to public using (is_company_member(company_id));

alter table public.inventory_book_entries enable row level security;
drop policy if exists "company_isolation_insert" on public.inventory_book_entries;
create policy "company_isolation_insert" on public.inventory_book_entries for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.inventory_book_entries;
create policy "company_isolation_select" on public.inventory_book_entries for select to public using (is_company_member(company_id));

alter table public.inventory_items enable row level security;
drop policy if exists "company_isolation_select" on public.inventory_items;
create policy "company_isolation_select" on public.inventory_items for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.inventory_items;
create policy "write_admin_contador_delete" on public.inventory_items for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.inventory_items;
create policy "write_admin_contador_insert" on public.inventory_items for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.inventory_items;
create policy "write_admin_contador_update" on public.inventory_items for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.inventory_movements enable row level security;
drop policy if exists "company_isolation_select" on public.inventory_movements;
create policy "company_isolation_select" on public.inventory_movements for select to public using ((EXISTS ( SELECT 1    FROM inventory_items ii   WHERE ((ii.id = inventory_movements.inventory_item_id) AND is_company_member(ii.company_id)))));
drop policy if exists "write_admin_contador_delete" on public.inventory_movements;
create policy "write_admin_contador_delete" on public.inventory_movements for delete to public using ((EXISTS ( SELECT 1    FROM inventory_items p   WHERE ((p.id = inventory_movements.inventory_item_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_insert" on public.inventory_movements;
create policy "write_admin_contador_insert" on public.inventory_movements for insert to public with check ((EXISTS ( SELECT 1    FROM inventory_items p   WHERE ((p.id = inventory_movements.inventory_item_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_update" on public.inventory_movements;
create policy "write_admin_contador_update" on public.inventory_movements for update to public using ((EXISTS ( SELECT 1    FROM inventory_items p   WHERE ((p.id = inventory_movements.inventory_item_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));

alter table public.investigations enable row level security;
drop policy if exists "company_isolation_insert" on public.investigations;
create policy "company_isolation_insert" on public.investigations for insert to public with check ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = investigations.case_id) AND is_company_member(c.company_id)))));
drop policy if exists "company_isolation_select" on public.investigations;
create policy "company_isolation_select" on public.investigations for select to public using ((EXISTS ( SELECT 1    FROM cases c   WHERE ((c.id = investigations.case_id) AND is_company_member(c.company_id)))));

alter table public.islr_declarations enable row level security;
drop policy if exists "company_access_islr_declarations" on public.islr_declarations;
create policy "company_access_islr_declarations" on public.islr_declarations for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = islr_declarations.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = islr_declarations.company_id) AND (uc.user_id = auth.uid())))));

alter table public.islr_estimated_declarations enable row level security;
drop policy if exists "company_isolation_insert" on public.islr_estimated_declarations;
create policy "company_isolation_insert" on public.islr_estimated_declarations for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.islr_estimated_declarations;
create policy "company_isolation_select" on public.islr_estimated_declarations for select to public using (is_company_member(company_id));

alter table public.journal_entries enable row level security;
drop policy if exists "company_isolation_select" on public.journal_entries;
create policy "company_isolation_select" on public.journal_entries for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.journal_entries;
create policy "write_admin_contador_delete" on public.journal_entries for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.journal_entries;
create policy "write_admin_contador_insert" on public.journal_entries for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.journal_entries;
create policy "write_admin_contador_update" on public.journal_entries for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.journal_lines enable row level security;
drop policy if exists "company_isolation_select" on public.journal_lines;
create policy "company_isolation_select" on public.journal_lines for select to public using ((EXISTS ( SELECT 1    FROM journal_entries je   WHERE ((je.id = journal_lines.journal_entry_id) AND is_company_member(je.company_id)))));
drop policy if exists "write_admin_contador_delete" on public.journal_lines;
create policy "write_admin_contador_delete" on public.journal_lines for delete to public using ((EXISTS ( SELECT 1    FROM journal_entries p   WHERE ((p.id = journal_lines.journal_entry_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_insert" on public.journal_lines;
create policy "write_admin_contador_insert" on public.journal_lines for insert to public with check ((EXISTS ( SELECT 1    FROM journal_entries p   WHERE ((p.id = journal_lines.journal_entry_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_update" on public.journal_lines;
create policy "write_admin_contador_update" on public.journal_lines for update to public using ((EXISTS ( SELECT 1    FROM journal_entries p   WHERE ((p.id = journal_lines.journal_entry_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));

alter table public.notifications enable row level security;
drop policy if exists "own_notifications" on public.notifications;
create policy "own_notifications" on public.notifications for all to public using ((user_id = auth.uid()));

alter table public.ofac_sanctioned_addresses enable row level security;
drop policy if exists "read_ofac_authenticated" on public.ofac_sanctioned_addresses;
create policy "read_ofac_authenticated" on public.ofac_sanctioned_addresses for select to public using ((auth.role() = 'authenticated'::text));

alter table public.page_visits enable row level security;

alter table public.payment_methods enable row level security;
drop policy if exists "authenticated_read_payment_methods" on public.payment_methods;
create policy "authenticated_read_payment_methods" on public.payment_methods for select to public using ((auth.role() = 'authenticated'::text));

alter table public.payroll_details enable row level security;
drop policy if exists "company_isolation_select" on public.payroll_details;
create policy "company_isolation_select" on public.payroll_details for select to public using ((EXISTS ( SELECT 1    FROM payroll_runs pr   WHERE ((pr.id = payroll_details.payroll_run_id) AND is_company_member(pr.company_id)))));
drop policy if exists "write_admin_contador_delete" on public.payroll_details;
create policy "write_admin_contador_delete" on public.payroll_details for delete to public using ((EXISTS ( SELECT 1    FROM payroll_runs p   WHERE ((p.id = payroll_details.payroll_run_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_insert" on public.payroll_details;
create policy "write_admin_contador_insert" on public.payroll_details for insert to public with check ((EXISTS ( SELECT 1    FROM payroll_runs p   WHERE ((p.id = payroll_details.payroll_run_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));
drop policy if exists "write_admin_contador_update" on public.payroll_details;
create policy "write_admin_contador_update" on public.payroll_details for update to public using ((EXISTS ( SELECT 1    FROM payroll_runs p   WHERE ((p.id = payroll_details.payroll_run_id) AND is_company_member(p.company_id) AND (get_user_role(p.company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))))));

alter table public.payroll_runs enable row level security;
drop policy if exists "company_isolation_select" on public.payroll_runs;
create policy "company_isolation_select" on public.payroll_runs for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.payroll_runs;
create policy "write_admin_contador_delete" on public.payroll_runs for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.payroll_runs;
create policy "write_admin_contador_insert" on public.payroll_runs for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.payroll_runs;
create policy "write_admin_contador_update" on public.payroll_runs for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.permissions enable row level security;
drop policy if exists "authenticated_read" on public.permissions;
create policy "authenticated_read" on public.permissions for select to public using ((auth.role() = 'authenticated'::text));

alter table public.platform_config enable row level security;
drop policy if exists "platform_config_public_read" on public.platform_config;
create policy "platform_config_public_read" on public.platform_config for select to anon, authenticated using (true);

alter table public.price_indices enable row level security;
drop policy if exists "authenticated_full_access" on public.price_indices;
create policy "authenticated_full_access" on public.price_indices for all to public using ((auth.role() = 'authenticated'::text));

alter table public.purchase_book_entries enable row level security;
drop policy if exists "company_isolation_select" on public.purchase_book_entries;
create policy "company_isolation_select" on public.purchase_book_entries for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.purchase_book_entries;
create policy "write_admin_contador_delete" on public.purchase_book_entries for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.purchase_book_entries;
create policy "write_admin_contador_insert" on public.purchase_book_entries for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.purchase_book_entries;
create policy "write_admin_contador_update" on public.purchase_book_entries for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.reconstruction_requests enable row level security;
drop policy if exists "reconstruction_requests_insert" on public.reconstruction_requests;
create policy "reconstruction_requests_insert" on public.reconstruction_requests for insert to public with check (is_company_member(company_id));
drop policy if exists "reconstruction_requests_select" on public.reconstruction_requests;
create policy "reconstruction_requests_select" on public.reconstruction_requests for select to public using (is_company_member(company_id));
drop policy if exists "reconstruction_requests_update" on public.reconstruction_requests;
create policy "reconstruction_requests_update" on public.reconstruction_requests for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.repomo_calculations enable row level security;
drop policy if exists "company_isolation_delete" on public.repomo_calculations;
create policy "company_isolation_delete" on public.repomo_calculations for delete to public using (is_company_member(company_id));
drop policy if exists "company_isolation_insert" on public.repomo_calculations;
create policy "company_isolation_insert" on public.repomo_calculations for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.repomo_calculations;
create policy "company_isolation_select" on public.repomo_calculations for select to public using (is_company_member(company_id));
drop policy if exists "company_isolation_update" on public.repomo_calculations;
create policy "company_isolation_update" on public.repomo_calculations for update to public using (is_company_member(company_id));

alter table public.resources enable row level security;
drop policy if exists "delete_resources_owner_only" on public.resources;
create policy "delete_resources_owner_only" on public.resources for delete to public using ((auth.uid() = 'a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a'::uuid));
drop policy if exists "read_resources_authenticated" on public.resources;
create policy "read_resources_authenticated" on public.resources for select to public using ((auth.role() = 'authenticated'::text));
drop policy if exists "update_resources_owner_only" on public.resources;
create policy "update_resources_owner_only" on public.resources for update to public using ((auth.uid() = 'a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a'::uuid));
drop policy if exists "write_resources_owner_only" on public.resources;
create policy "write_resources_owner_only" on public.resources for insert to public with check ((auth.uid() = 'a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a'::uuid));

alter table public.risk_alerts enable row level security;
drop policy if exists "company_isolation_select" on public.risk_alerts;
create policy "company_isolation_select" on public.risk_alerts for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_delete" on public.risk_alerts;
create policy "write_admin_auditor_delete" on public.risk_alerts for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_insert" on public.risk_alerts;
create policy "write_admin_auditor_insert" on public.risk_alerts for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_update" on public.risk_alerts;
create policy "write_admin_auditor_update" on public.risk_alerts for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));

alter table public.risk_events enable row level security;
drop policy if exists "company_isolation_select" on public.risk_events;
create policy "company_isolation_select" on public.risk_events for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_delete" on public.risk_events;
create policy "write_admin_auditor_delete" on public.risk_events for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_insert" on public.risk_events;
create policy "write_admin_auditor_insert" on public.risk_events for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_update" on public.risk_events;
create policy "write_admin_auditor_update" on public.risk_events for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));

alter table public.risk_flags enable row level security;
drop policy if exists "company_isolation_select" on public.risk_flags;
create policy "company_isolation_select" on public.risk_flags for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_auditor_delete" on public.risk_flags;
create policy "write_admin_auditor_delete" on public.risk_flags for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_insert" on public.risk_flags;
create policy "write_admin_auditor_insert" on public.risk_flags for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));
drop policy if exists "write_admin_auditor_update" on public.risk_flags;
create policy "write_admin_auditor_update" on public.risk_flags for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'AUDITOR'::text]))));

alter table public.risk_rules enable row level security;
drop policy if exists "authenticated_read" on public.risk_rules;
create policy "authenticated_read" on public.risk_rules for select to public using ((auth.role() = 'authenticated'::text));

alter table public.risk_scores enable row level security;
drop policy if exists "risk_scores_isolation" on public.risk_scores;
create policy "risk_scores_isolation" on public.risk_scores for all to public using ((company_id = current_company_id()));

alter table public.role_permissions enable row level security;
drop policy if exists "authenticated_read" on public.role_permissions;
create policy "authenticated_read" on public.role_permissions for select to public using ((auth.role() = 'authenticated'::text));

alter table public.sales_book_entries enable row level security;
drop policy if exists "company_isolation_select" on public.sales_book_entries;
create policy "company_isolation_select" on public.sales_book_entries for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.sales_book_entries;
create policy "write_admin_contador_delete" on public.sales_book_entries for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.sales_book_entries;
create policy "write_admin_contador_insert" on public.sales_book_entries for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.sales_book_entries;
create policy "write_admin_contador_update" on public.sales_book_entries for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.sanctions enable row level security;
drop policy if exists "authenticated_read" on public.sanctions;
create policy "authenticated_read" on public.sanctions for select to public using ((auth.role() = 'authenticated'::text));

alter table public.sar_reports enable row level security;
drop policy if exists "company_access_sar_reports" on public.sar_reports;
create policy "company_access_sar_reports" on public.sar_reports for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = sar_reports.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = sar_reports.company_id) AND (uc.user_id = auth.uid())))));

alter table public.situations enable row level security;
drop policy if exists "owner_only_situations" on public.situations;
create policy "owner_only_situations" on public.situations for all to public using ((auth.uid() = 'a56f197e-a532-4d3c-9f08-5b5b3a4d7b7a'::uuid));

alter table public.subscription_plans enable row level security;
drop policy if exists "authenticated_read_plans" on public.subscription_plans;
create policy "authenticated_read_plans" on public.subscription_plans for select to public using ((auth.role() = 'authenticated'::text));

alter table public.subscriptions enable row level security;
drop policy if exists "company_isolation_delete" on public.subscriptions;
create policy "company_isolation_delete" on public.subscriptions for delete to public using (is_company_member(company_id));
drop policy if exists "company_isolation_insert" on public.subscriptions;
create policy "company_isolation_insert" on public.subscriptions for insert to public with check (is_company_member(company_id));
drop policy if exists "company_isolation_select" on public.subscriptions;
create policy "company_isolation_select" on public.subscriptions for select to public using (is_company_member(company_id));
drop policy if exists "company_isolation_update" on public.subscriptions;
create policy "company_isolation_update" on public.subscriptions for update to public using (is_company_member(company_id));

alter table public.user_companies enable row level security;
drop policy if exists "Allow users to read their own companies" on public.user_companies;
create policy "Allow users to read their own companies" on public.user_companies for select to public using ((auth.uid() = user_id));
drop policy if exists "Users can read their own companies" on public.user_companies;
create policy "Users can read their own companies" on public.user_companies for select to public using ((auth.uid() = user_id));
drop policy if exists "insert_own_membership" on public.user_companies;
create policy "insert_own_membership" on public.user_companies for insert to public with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = user_companies.company_id) AND (c.owner_id = auth.uid()))))));
drop policy if exists "select_own_membership" on public.user_companies;
create policy "select_own_membership" on public.user_companies for select to public using ((user_id = auth.uid()));
drop policy if exists "update_own_membership" on public.user_companies;
create policy "update_own_membership" on public.user_companies for update to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

alter table public.user_role_assignments enable row level security;
drop policy if exists "delete_admin_only_roles" on public.user_role_assignments;
create policy "delete_admin_only_roles" on public.user_role_assignments for delete to public using (is_company_admin(company_id));
drop policy if exists "read_own_company_roles" on public.user_role_assignments;
create policy "read_own_company_roles" on public.user_role_assignments for select to public using (is_company_member(company_id));
drop policy if exists "update_admin_only_roles" on public.user_role_assignments;
create policy "update_admin_only_roles" on public.user_role_assignments for update to public using (is_company_admin(company_id));
drop policy if exists "write_admin_only_roles" on public.user_role_assignments;
create policy "write_admin_only_roles" on public.user_role_assignments for insert to public with check (is_company_admin(company_id));

alter table public.user_roles enable row level security;
drop policy if exists "authenticated_can_read_roles" on public.user_roles;
create policy "authenticated_can_read_roles" on public.user_roles for select to public using ((auth.role() = 'authenticated'::text));

alter table public.vat_declarations enable row level security;
drop policy if exists "company_access_vat_declarations" on public.vat_declarations;
create policy "company_access_vat_declarations" on public.vat_declarations for all to public using ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = vat_declarations.company_id) AND (uc.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1    FROM user_companies uc   WHERE ((uc.company_id = vat_declarations.company_id) AND (uc.user_id = auth.uid())))));

alter table public.vendor_account_memory enable row level security;
drop policy if exists "company_isolation_select" on public.vendor_account_memory;
create policy "company_isolation_select" on public.vendor_account_memory for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.vendor_account_memory;
create policy "write_admin_contador_delete" on public.vendor_account_memory for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.vendor_account_memory;
create policy "write_admin_contador_insert" on public.vendor_account_memory for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.vendor_account_memory;
create policy "write_admin_contador_update" on public.vendor_account_memory for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));

alter table public.wallet_addresses enable row level security;
drop policy if exists "wallet_addresses_insert_own_company" on public.wallet_addresses;
create policy "wallet_addresses_insert_own_company" on public.wallet_addresses for insert to public with check ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));
drop policy if exists "wallet_addresses_select_own_company" on public.wallet_addresses;
create policy "wallet_addresses_select_own_company" on public.wallet_addresses for select to public using ((company_id IN ( SELECT user_companies.company_id    FROM user_companies   WHERE (user_companies.user_id = auth.uid()))));

alter table public.withholding_summary enable row level security;
drop policy if exists "company_isolation_select" on public.withholding_summary;
create policy "company_isolation_select" on public.withholding_summary for select to public using (is_company_member(company_id));
drop policy if exists "write_admin_contador_delete" on public.withholding_summary;
create policy "write_admin_contador_delete" on public.withholding_summary for delete to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_insert" on public.withholding_summary;
create policy "write_admin_contador_insert" on public.withholding_summary for insert to public with check ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));
drop policy if exists "write_admin_contador_update" on public.withholding_summary;
create policy "write_admin_contador_update" on public.withholding_summary for update to public using ((is_company_member(company_id) AND (get_user_role(company_id) = ANY (ARRAY['ADMIN'::text, 'CONTADOR'::text]))));