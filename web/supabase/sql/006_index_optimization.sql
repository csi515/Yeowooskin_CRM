-- 인덱스 최적화
-- 데이터가 많이 쌓이는 테이블들의 조회 성능 향상을 위한 인덱스 추가

-- points_ledger 인덱스 최적화 (이미 일부 있지만 추가 최적화)
create index if not exists idx_points_ledger_customer_created on public.points_ledger(customer_id, created_at desc);
create index if not exists idx_points_ledger_owner_created on public.points_ledger(owner_id, created_at desc);

-- customer_product_ledger 인덱스 (테이블이 존재하는 경우)
create index if not exists idx_customer_product_ledger_customer_product on public.customer_product_ledger(customer_product_id, created_at desc);
create index if not exists idx_customer_product_ledger_created on public.customer_product_ledger(created_at desc);
create index if not exists idx_customer_product_ledger_created_by on public.customer_product_ledger(created_by) where created_by is not null;

-- treatment_records 인덱스 최적화
create index if not exists idx_treatment_records_customer_date on public.treatment_records(customer_id, treatment_date desc);
create index if not exists idx_treatment_records_branch_date on public.treatment_records(branch_id, treatment_date desc) where branch_id is not null;
create index if not exists idx_treatment_records_appointment on public.treatment_records(appointment_id) where appointment_id is not null;

-- treatment_program_sessions 인덱스 최적화
create index if not exists idx_treatment_program_sessions_program_date on public.treatment_program_sessions(program_id, session_date desc);
create index if not exists idx_treatment_program_sessions_date on public.treatment_program_sessions(session_date desc);

-- transactions 인덱스 최적화
create index if not exists idx_transactions_branch_date on public.transactions(branch_id, transaction_date desc) where branch_id is not null;
create index if not exists idx_transactions_customer_date on public.transactions(customer_id, transaction_date desc) where customer_id is not null;
create index if not exists idx_transactions_date on public.transactions(transaction_date desc);

-- appointments 인덱스 최적화
create index if not exists idx_appointments_branch_date on public.appointments(branch_id, appointment_date desc) where branch_id is not null;
create index if not exists idx_appointments_customer_date on public.appointments(customer_id, appointment_date desc) where customer_id is not null;
create index if not exists idx_appointments_date_status on public.appointments(appointment_date desc, status);

-- notifications 인덱스 최적화
create index if not exists idx_notifications_user_read_date on public.notifications(user_id, read, created_at desc);
create index if not exists idx_notifications_type_date on public.notifications(type, created_at desc);

-- approval_history 인덱스 최적화
create index if not exists idx_approval_history_approved_by on public.approval_history(approved_by) where approved_by is not null;
create index if not exists idx_approval_history_user_created on public.approval_history(user_id, created_at desc);

-- customer_products 인덱스 최적화
create index if not exists idx_customer_products_customer on public.customer_products(customer_id, created_at desc);
create index if not exists idx_customer_products_branch on public.customer_products(branch_id) where branch_id is not null;

