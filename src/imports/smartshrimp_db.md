\encoding UTF8
BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE account_role AS ENUM ('admin', 'farm_owner', 'technician', 'expert');
CREATE TYPE account_status AS ENUM ('pending_activation', 'active', 'inactive', 'blocked');
CREATE TYPE personnel_role AS ENUM ('technician', 'expert');
CREATE TYPE verification_purpose AS ENUM ('account_activation', 'password_reset');

CREATE TYPE pond_status AS ENUM ('available', 'maintenance', 'inactive');
CREATE TYPE pond_type AS ENUM ('aquaculture', 'water_treatment');
CREATE TYPE shrimp_type AS ENUM ('whiteleg', 'black_tiger');
CREATE TYPE season_status AS ENUM ('planning', 'active', 'completed', 'cancelled');
CREATE TYPE harvest_type AS ENUM ('partial', 'final');

CREATE TYPE product_category AS ENUM ('feed', 'medicine', 'mineral', 'chemical', 'other');
CREATE TYPE product_unit AS ENUM ('kg', 'g', 'l', 'ml', 'pack', 'bottle', 'pcs');
CREATE TYPE conversion_unit AS ENUM ('mg', 'g', 'kg', 'ml', 'l');
CREATE TYPE inventory_transaction_type AS ENUM (
'stock_in', 'stock_out'
);

CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE health_status AS ENUM ('excellent', 'good', 'warning', 'critical');

CREATE TYPE protocol_type AS ENUM ('production', 'treatment');
CREATE TYPE protocol_status AS ENUM (
'draft', 'pending_approval', 'approved', 'rejected',
'superseded', 'cancelled', 'aborted'
);
CREATE TYPE operation_type AS ENUM ('feeding', 'mineral', 'chemical', 'medicine', 'other');
CREATE TYPE dose_basis AS ENUM ('fixed_quantity', 'per_kg_biomass', 'percent_biomass', 'per_m3_water');
CREATE TYPE operation_status AS ENUM ('planned', 'completed', 'cancelled');
CREATE TYPE schedule_cancellation_type AS ENUM (
'protocol_superseded', 'treatment_aborted', 'season_cancelled', 'manual_correction'
);

CREATE TYPE case_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE disease_case_status AS ENUM (
'open', 'waiting_for_info', 'monitoring', 'in_treatment', 'resolved'
);
CREATE TYPE case_response_type AS ENUM (
'request_info',
'provide_info',
'monitoring_result',
'treatment_result',
'emergency_alert',
'expert_assessment',
'expert_instruction',
'resolution'
);

CREATE TYPE ai_run_status AS ENUM ('success', 'error');
CREATE TYPE rag_query_status AS ENUM ('answered', 'no_source', 'low_match', 'error');

CREATE TYPE notification_type AS ENUM (
'system',
'managed_account_activated', 'account_status_changed',
'season_assignment_created', 'season_assignment_replaced', 'season_status_changed',
'operation_due', 'operation_overdue', 'operation_cancelled',
'schedule_generation_failed', 'water_threshold_exceeded',
'task_assigned', 'task_updated', 'task_due_soon', 'task_overdue', 'task_completed',
'disease_case_created', 'disease_case_response', 'disease_case_waiting_info',
'disease_case_monitoring', 'disease_case_resolved',
'production_protocol_pending', 'production_protocol_reviewed',
'treatment_protocol_pending', 'treatment_protocol_reviewed',
'treatment_protocol_aborted', 'emergency_case_update',
'treatment_schedule_ready', 'treatment_schedule_completed',
'inventory_low', 'inventory_insufficient', 'harvest_due', 'season_completed'
);

-- ============================================================================
-- 2. ACCOUNTS, AUTHENTICATION, PROFILES
-- ============================================================================

CREATE TABLE accounts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
email CITEXT NOT NULL UNIQUE,
phone VARCHAR(20),
password_hash VARCHAR(255),
full_name VARCHAR(255),
avatar_url TEXT,
role account_role NOT NULL,
status account_status NOT NULL DEFAULT 'pending_activation',
managed_by_owner_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
activated_at TIMESTAMPTZ,
status_changed_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
status_changed_at TIMESTAMPTZ,
status_reason TEXT,
last_login_at TIMESTAMPTZ,
created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (full_name IS NULL OR char_length(trim(full_name)) > 0),
CHECK (managed_by_owner_id IS NULL OR managed_by_owner_id <> id),
CHECK (
(role IN ('technician', 'expert') AND managed_by_owner_id IS NOT NULL)
OR (role IN ('admin', 'farm_owner') AND managed_by_owner_id IS NULL)
),
CHECK (
(activated_at IS NULL
AND password_hash IS NULL
AND full_name IS NULL
AND status IN ('pending_activation', 'inactive', 'blocked'))
OR (activated_at IS NOT NULL
AND password_hash IS NOT NULL
AND nullif(trim(full_name), '') IS NOT NULL
AND status IN ('active', 'inactive', 'blocked'))
),
CHECK (
(status_changed_at IS NULL AND status_changed_by IS NULL AND status_reason IS NULL)
OR (status_changed_at IS NOT NULL AND status_changed_by IS NOT NULL)
)
);

CREATE TABLE refresh_tokens (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
token_hash VARCHAR(500) NOT NULL UNIQUE,
device_id UUID NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,
revoked_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verification_challenges (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
purpose verification_purpose NOT NULL,
code_hash CHAR(64) NOT NULL,
expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
resend_available_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 seconds'),
failed_attempts SMALLINT NOT NULL DEFAULT 0,
verified_at TIMESTAMPTZ,
action_token_hash CHAR(64), -- Hash của token được cấp sau khi verify thành công
action_token_expires_at TIMESTAMPTZ,
consumed_at TIMESTAMPTZ, -- Token/challenge đã được sử dụng thành công
superseded_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (failed_attempts BETWEEN 0 AND 5),
CHECK (resend_available_at >= created_at),
CHECK (expires_at > created_at),
CHECK (
(verified_at IS NULL AND action_token_hash IS NULL AND action_token_expires_at IS NULL)
OR (verified_at IS NOT NULL AND action_token_hash IS NOT NULL AND action_token_expires_at IS NOT NULL AND action_token_expires_at > verified_at)
),
CHECK (consumed_at IS NULL OR verified_at IS NOT NULL)
);

CREATE UNIQUE INDEX uq_active_email_verification
ON email_verification_challenges(account_id, purpose)
WHERE consumed_at IS NULL AND superseded_at IS NULL;

CREATE UNIQUE INDEX uq_email_verification_action_token
ON email_verification_challenges(action_token_hash)
WHERE action_token_hash IS NOT NULL;

CREATE INDEX idx_email_verification_lookup
ON email_verification_challenges(account_id, purpose, created_at DESC);

-- ============================================================================
-- 3. FARM AND POND
-- ============================================================================

CREATE TABLE farms (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
name VARCHAR(255) NOT NULL,
address TEXT,
latitude NUMERIC(10, 8),
longitude NUMERIC(11, 8),
total_area_hectares NUMERIC(10, 2),
archived_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (nullif(trim(name), '') IS NOT NULL),
CHECK (total_area_hectares IS NULL OR total_area_hectares > 0),
CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE UNIQUE INDEX uq_active_farm_name_per_owner
ON farms(owner_id, lower(btrim(name)))
WHERE archived_at IS NULL;

CREATE TABLE ponds (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
name VARCHAR(255) NOT NULL,
area_m2 NUMERIC(12, 2),
depth_m NUMERIC(6, 2),
volume_m3 NUMERIC(14, 2),
type pond_type NOT NULL DEFAULT 'aquaculture',
status pond_status NOT NULL DEFAULT 'available',
archived_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (nullif(trim(name), '') IS NOT NULL),
CHECK (area_m2 IS NULL OR area_m2 > 0),
CHECK (depth_m IS NULL OR depth_m > 0),
CHECK (volume_m3 IS NULL OR volume_m3 > 0)
);

CREATE UNIQUE INDEX uq_active_pond_name_per_farm
ON ponds(farm_id, lower(btrim(name)))
WHERE archived_at IS NULL;

-- ============================================================================
-- 4. FARMING SEASONS, ASSIGNMENTS, HARVESTS
-- ============================================================================

CREATE TABLE aquaculture_seasons (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
pond_id UUID NOT NULL REFERENCES ponds(id) ON DELETE RESTRICT,
name VARCHAR(255) NOT NULL,
shrimp_type shrimp_type NOT NULL,
stocking_date DATE,
expected_end_date DATE,
actual_end_date DATE,
initial_quantity BIGINT,
initial_avg_weight_g NUMERIC(10, 3),
initial_biomass_kg NUMERIC(14, 3),
initial_density_per_m2 NUMERIC(12, 2),
status season_status NOT NULL DEFAULT 'planning',
cancellation_reason TEXT,
created_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (nullif(trim(name), '') IS NOT NULL),
CHECK (initial_quantity IS NULL OR initial_quantity > 0),
CHECK (initial_avg_weight_g IS NULL OR initial_avg_weight_g > 0),
CHECK (initial_biomass_kg IS NULL OR initial_biomass_kg > 0),
CHECK (initial_density_per_m2 IS NULL OR initial_density_per_m2 > 0),
CHECK (expected_end_date IS NULL OR stocking_date IS NULL OR expected_end_date >= stocking_date),
CHECK (actual_end_date IS NULL OR stocking_date IS NULL OR actual_end_date >= stocking_date),
CHECK (status <> 'cancelled' OR nullif(trim(cancellation_reason), '') IS NOT NULL)
);

CREATE UNIQUE INDEX uq_one_open_season_per_pond
ON aquaculture_seasons(pond_id)
WHERE status IN ('planning', 'active');

CREATE TABLE season_personnel_assignments (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
role personnel_role NOT NULL,
account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
assigned_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
unassigned_at TIMESTAMPTZ,
unassigned_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
replacement_reason TEXT,
replaced_by_assignment_id UUID REFERENCES season_personnel_assignments(id) ON DELETE SET NULL,
CHECK (
(unassigned_at IS NULL AND unassigned_by IS NULL)
OR (unassigned_at IS NOT NULL AND unassigned_by IS NOT NULL)
)
);

CREATE UNIQUE INDEX uq_one_active_person_per_season_role
ON season_personnel_assignments(season_id, role)
WHERE unassigned_at IS NULL;

CREATE UNIQUE INDEX uq_person_one_active_role_per_season
ON season_personnel_assignments(season_id, account_id)
WHERE unassigned_at IS NULL;

CREATE TABLE harvest_events (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
harvest_type harvest_type NOT NULL,
harvested_at TIMESTAMPTZ NOT NULL,
quantity_count BIGINT,
total_weight_kg NUMERIC(14, 3) NOT NULL,
avg_size_per_kg NUMERIC(10, 2),
price_per_kg NUMERIC(14, 2),
total_revenue NUMERIC(18, 2),
estimated_remaining_count BIGINT,
buyer_name VARCHAR(255),
buyer_contact VARCHAR(255),
note TEXT,
recorded_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
idempotency_key UUID NOT NULL UNIQUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (quantity_count IS NULL OR quantity_count > 0),
CHECK (total_weight_kg > 0),
CHECK (avg_size_per_kg IS NULL OR avg_size_per_kg > 0),
CHECK (price_per_kg IS NULL OR price_per_kg >= 0),
CHECK (total_revenue IS NULL OR total_revenue >= 0),
CHECK (estimated_remaining_count IS NULL OR estimated_remaining_count >= 0),
CHECK (
harvest_type <> 'partial'
OR (estimated_remaining_count IS NOT NULL AND estimated_remaining_count > 0)
),
CHECK (harvest_type <> 'final' OR coalesce(estimated_remaining_count, 0) = 0)
);

CREATE UNIQUE INDEX uq_one_final_harvest_per_season
ON harvest_events(season_id)
WHERE harvest_type = 'final';

-- ============================================================================
-- 5. INVENTORY
-- ============================================================================

CREATE TABLE products (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
name VARCHAR(255) NOT NULL,
category product_category NOT NULL,
unit product_unit NOT NULL,
conversion_quantity NUMERIC(14, 4),
conversion_unit conversion_unit,
min_alert_quantity NUMERIC(14, 3) NOT NULL DEFAULT 0,
description TEXT,
archived_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (nullif(trim(name), '') IS NOT NULL),
CHECK ( ( unit IN ('pack', 'bottle') AND conversion_quantity IS NOT NULL AND conversion_quantity > 0 AND conversion_unit IS NOT NULL ) OR ( unit NOT IN ('pack', 'bottle') AND conversion_quantity IS NULL AND conversion_unit IS NULL ) )
);

CREATE UNIQUE INDEX uq_active_product_name_unit_per_farm
ON products(farm_id, lower(btrim(name)), unit)
WHERE archived_at IS NULL;

CREATE TABLE inventory_balances (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
lot_number VARCHAR(100) NOT NULL,
received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Thời điểm layer được nhập/tạo. -- Dùng để xác định thứ tự FIFO.
quantity NUMERIC(14, 3) NOT NULL DEFAULT 0,
unit_price NUMERIC(14, 2) NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (quantity >= 0),
CHECK (unit_price >= 0),
CONSTRAINT uq_inventory_balance_product_lot UNIQUE (product_id, lot_number)
);

CREATE INDEX idx_inventory_balances_fifo ON inventory_balances ( product_id, received_at, id ) WHERE quantity > 0; CREATE INDEX idx_inventory_balances_product ON inventory_balances(product_id);

CREATE TABLE inventory_transactions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
transaction_group_id UUID NOT NULL,
product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
inventory_balance_id UUID NOT NULL REFERENCES inventory_balances(id) ON DELETE RESTRICT,
season_id UUID REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
transaction_type inventory_transaction_type NOT NULL,
quantity NUMERIC(14, 3) NOT NULL,
unit_snapshot product_unit NOT NULL,
total_amount NUMERIC(18,2) NOT NULL,
reference_type VARCHAR(50),
reference_id UUID,
reason TEXT,
performed_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
idempotency_key UUID NOT NULL UNIQUE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (quantity > 0),
CHECK (total_amount >= 0),
CHECK ( ( reference_type IS NULL AND reference_id IS NULL ) OR ( reference_type IS NOT NULL AND reference_id IS NOT NULL ) )
);

-- ============================================================================
-- 6. REUSABLE PRODUCTION PROTOCOL TEMPLATES
-- ============================================================================

CREATE TABLE production_protocol_templates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
title VARCHAR(500) NOT NULL,
description TEXT,
shrimp_type shrimp_type,
allowed_variance_pct NUMERIC(5, 2) NOT NULL DEFAULT 10,
created_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
archived_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (allowed_variance_pct BETWEEN 0 AND 100)
);

CREATE TABLE production_protocol_template_items (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
template_id UUID NOT NULL REFERENCES production_protocol_templates(id) ON DELETE RESTRICT,
operation_type operation_type NOT NULL,
product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
recommended_product_name VARCHAR(255),
recommended_category product_category,
start_day_of_culture INT NOT NULL,
end_day_of_culture INT NOT NULL,
meal_number INT,
planned_time TIME,
dose_basis dose_basis NOT NULL,
dose_value NUMERIC(14, 4) NOT NULL,
dose_unit product_unit NOT NULL,
instructions TEXT,
sequence_order INT NOT NULL DEFAULT 1,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (start_day_of_culture >= 1),
CHECK (end_day_of_culture >= start_day_of_culture),
CHECK (meal_number IS NULL OR meal_number >= 1),
CHECK (dose_value > 0),
CHECK (product_id IS NOT NULL OR nullif(trim(recommended_product_name), '') IS NOT NULL)
);

-- ============================================================================
-- 7. AI DIAGNOSIS AND RAG CHATBOX
-- ============================================================================

CREATE TABLE ai_diagnosis_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
requested_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
image_urls TEXT[] NOT NULL,
input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
run_status ai_run_status NOT NULL,
predicted_label VARCHAR(255),
confidence NUMERIC(6, 5),
predictions JSONB NOT NULL DEFAULT '[]'::jsonb,
recommendation TEXT,
model_version VARCHAR(100),
processing_time_ms INT,
error_code VARCHAR(100),
error_message TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (cardinality(image_urls) > 0),
CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0),
CHECK (
(run_status = 'success' AND predicted_label IS NOT NULL AND error_code IS NULL)
OR (run_status = 'error' AND error_message IS NOT NULL)
)
);

CREATE TABLE rag_conversations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
season_id UUID REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
title VARCHAR(255),
started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rag_queries (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
conversation_id UUID NOT NULL REFERENCES rag_conversations(id) ON DELETE RESTRICT,
account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
question TEXT NOT NULL,
answer TEXT,
query_status rag_query_status NOT NULL,
retrieved_chunks JSONB NOT NULL DEFAULT '[]'::jsonb,
top_similarity NUMERIC(6, 5),
model_version VARCHAR(100),
processing_time_ms INT,
error_code VARCHAR(100),
error_message TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (nullif(trim(question), '') IS NOT NULL),
CHECK (top_similarity IS NULL OR top_similarity BETWEEN 0 AND 1),
CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0),
CHECK (query_status <> 'answered' OR nullif(trim(answer), '') IS NOT NULL),
CHECK (query_status <> 'error' OR nullif(trim(error_message), '') IS NOT NULL)
);

CREATE TABLE rag_feedback (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
query_id UUID NOT NULL UNIQUE REFERENCES rag_queries(id) ON DELETE RESTRICT,
evaluator_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
rating SMALLINT NOT NULL,
comment TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (rating BETWEEN 1 AND 5),
CHECK (comment IS NULL OR char_length(trim(comment)) BETWEEN 1 AND 2000)
);

-- ============================================================================
-- 8. DISEASE CASES AND UNIFIED APPLIED PROTOCOLS
-- ============================================================================

CREATE TABLE disease_cases (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
related_case_id UUID REFERENCES disease_cases(id) ON DELETE SET NULL,
reported_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
expert_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
ai_diagnosis_id UUID REFERENCES ai_diagnosis_logs(id) ON DELETE SET NULL,
title VARCHAR(500) NOT NULL,
description TEXT NOT NULL,
severity case_severity NOT NULL DEFAULT 'medium',
status disease_case_status NOT NULL DEFAULT 'open',
case_snapshot JSONB NOT NULL,
resolution_summary TEXT,
resolved_by UUID REFERENCES accounts(id) ON DELETE RESTRICT,
resolved_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (related_case_id IS NULL OR related_case_id <> id),
CHECK (nullif(trim(title), '') IS NOT NULL),
CHECK (nullif(trim(description), '') IS NOT NULL),
CHECK (jsonb_typeof(case_snapshot) = 'object'),
CHECK (
(status = 'resolved'
AND nullif(trim(resolution_summary), '') IS NOT NULL
AND resolved_by IS NOT NULL
AND resolved_at IS NOT NULL)
OR (status <> 'resolved'
AND resolution_summary IS NULL
AND resolved_by IS NULL
AND resolved_at IS NULL)
)
);

CREATE TABLE disease_case_attachments (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
case_id UUID NOT NULL REFERENCES disease_cases(id) ON DELETE RESTRICT,
uploaded_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
file_url TEXT NOT NULL,
media_type VARCHAR(100),
caption TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE disease_case_responses (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
case_id UUID NOT NULL REFERENCES disease_cases(id) ON DELETE RESTRICT,
author_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
response_type case_response_type NOT NULL,
message TEXT NOT NULL,
attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (nullif(trim(message), '') IS NOT NULL),
CHECK (jsonb_typeof(attachments) = 'array')
);

CREATE TABLE disease_case_status_history (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
case_id UUID NOT NULL REFERENCES disease_cases(id) ON DELETE RESTRICT,
from_status disease_case_status,
to_status disease_case_status NOT NULL,
changed_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
reason TEXT,
changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (from_status IS NULL OR from_status <> to_status)
);

CREATE TABLE protocols (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
protocol_type protocol_type NOT NULL,
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
disease_case_id UUID REFERENCES disease_cases(id) ON DELETE RESTRICT,
source_template_id UUID REFERENCES production_protocol_templates(id) ON DELETE RESTRICT,
version_no INT NOT NULL,
supersedes_protocol_id UUID UNIQUE REFERENCES protocols(id) ON DELETE RESTRICT,
title VARCHAR(500) NOT NULL,
summary TEXT,
allowed_variance_pct NUMERIC(5, 2),
rolling_window_days SMALLINT NOT NULL DEFAULT 7,
status protocol_status NOT NULL DEFAULT 'draft',
created_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
submitted_at TIMESTAMPTZ,
reviewed_by UUID REFERENCES accounts(id) ON DELETE RESTRICT,
reviewed_at TIMESTAMPTZ,
rejection_reason TEXT,
superseded_at TIMESTAMPTZ,
abort_reason TEXT,
aborted_by UUID REFERENCES accounts(id) ON DELETE RESTRICT,
aborted_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (version_no >= 1),
CHECK (nullif(trim(title), '') IS NOT NULL),
CHECK (rolling_window_days BETWEEN 1 AND 14),
CHECK (supersedes_protocol_id IS NULL OR supersedes_protocol_id <> id),
CHECK (
(version_no = 1 AND supersedes_protocol_id IS NULL)
OR (version_no > 1 AND supersedes_protocol_id IS NOT NULL)
),
CHECK (
(protocol_type = 'production'
AND disease_case_id IS NULL
AND allowed_variance_pct IS NOT NULL
AND allowed_variance_pct BETWEEN 0 AND 100)
OR (protocol_type = 'treatment'
AND disease_case_id IS NOT NULL
AND source_template_id IS NULL
AND allowed_variance_pct IS NULL)
),
CHECK (
status NOT IN ('pending_approval', 'approved', 'rejected', 'superseded', 'aborted')
OR submitted_at IS NOT NULL
),
CHECK (
status NOT IN ('approved', 'rejected', 'superseded', 'aborted')
OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
),
CHECK (
(status = 'rejected' AND nullif(trim(rejection_reason), '') IS NOT NULL)
OR (status <> 'rejected' AND rejection_reason IS NULL)
),
CHECK (
(status = 'superseded' AND superseded_at IS NOT NULL)
OR (status <> 'superseded' AND superseded_at IS NULL)
),
CHECK (
(status = 'aborted'
AND protocol_type = 'treatment'
AND nullif(trim(abort_reason), '') IS NOT NULL
AND aborted_by IS NOT NULL
AND aborted_at IS NOT NULL)
OR (status <> 'aborted'
AND abort_reason IS NULL
AND aborted_by IS NULL
AND aborted_at IS NULL)
)
);

CREATE UNIQUE INDEX uq_production_protocol_version
ON protocols(season_id, version_no)
WHERE protocol_type = 'production';

CREATE UNIQUE INDEX uq_treatment_protocol_version
ON protocols(disease_case_id, version_no)
WHERE protocol_type = 'treatment';

CREATE UNIQUE INDEX uq_one_approved_production_protocol
ON protocols(season_id)
WHERE protocol_type = 'production' AND status = 'approved';

CREATE UNIQUE INDEX uq_one_approved_treatment_protocol
ON protocols(disease_case_id)
WHERE protocol_type = 'treatment' AND status = 'approved';

CREATE TABLE protocol_items (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE RESTRICT,
operation_type operation_type NOT NULL,
product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
recommended_product_name VARCHAR(255),
recommended_category product_category,
start_day_offset INT NOT NULL,
end_day_offset INT NOT NULL,
repeat_interval_days SMALLINT NOT NULL DEFAULT 1,
meal_number INT,
planned_time TIME,
dose_basis dose_basis NOT NULL,
dose_value NUMERIC(14, 4) NOT NULL,
dose_unit product_unit NOT NULL,
instructions TEXT,
sequence_order INT NOT NULL DEFAULT 1,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
UNIQUE (protocol_id, sequence_order),
CHECK (start_day_offset >= 0),
CHECK (end_day_offset >= start_day_offset),
CHECK (repeat_interval_days BETWEEN 1 AND 30),
CHECK (meal_number IS NULL OR meal_number >= 1),
CHECK (dose_value > 0),
CHECK (product_id IS NOT NULL OR nullif(trim(recommended_product_name), '') IS NOT NULL)
);

CREATE TABLE protocol_status_history (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE RESTRICT,
from_status protocol_status,
to_status protocol_status NOT NULL,
changed_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
reason TEXT,
changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (from_status IS NULL OR from_status <> to_status)
);

-- ============================================================================
-- 9. GENERATED OPERATION SCHEDULES AND KTV EXECUTION LOGS
-- ============================================================================

CREATE TABLE operation_schedules (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
protocol_item_id UUID NOT NULL REFERENCES protocol_items(id) ON DELETE RESTRICT,
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
operation_type operation_type NOT NULL,
product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
scheduled_at TIMESTAMPTZ NOT NULL,
planned_quantity NUMERIC(14, 3) NOT NULL,
unit product_unit NOT NULL,
dose_basis_snapshot dose_basis NOT NULL,
dose_value_snapshot NUMERIC(14, 4) NOT NULL,
basis_quantity NUMERIC(14, 3),
basis_unit VARCHAR(30),
source_health_log_id UUID,
calculation_version VARCHAR(50) NOT NULL,
calculated_at TIMESTAMPTZ NOT NULL,
status operation_status NOT NULL DEFAULT 'planned',
cancellation_type schedule_cancellation_type,
cancellation_reason TEXT,
cancelled_by UUID REFERENCES accounts(id) ON DELETE RESTRICT,
cancelled_at TIMESTAMPTZ,
generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
UNIQUE (protocol_item_id, scheduled_at),
CHECK (planned_quantity > 0),
CHECK (dose_value_snapshot > 0),
CHECK (
(dose_basis_snapshot = 'fixed_quantity'
AND basis_quantity IS NULL
AND basis_unit IS NULL
AND source_health_log_id IS NULL)
OR (dose_basis_snapshot = 'per_m3_water'
AND basis_quantity IS NOT NULL
AND basis_quantity > 0
AND basis_unit = 'm3_water'
AND source_health_log_id IS NULL)
OR (dose_basis_snapshot IN ('per_kg_biomass', 'percent_biomass')
AND basis_quantity IS NOT NULL
AND basis_quantity > 0
AND basis_unit = 'kg_biomass'
AND source_health_log_id IS NOT NULL)
),
CHECK (
(status = 'cancelled'
AND cancellation_type IS NOT NULL
AND nullif(trim(cancellation_reason), '') IS NOT NULL
AND cancelled_by IS NOT NULL
AND cancelled_at IS NOT NULL)
OR (status <> 'cancelled'
AND cancellation_type IS NULL
AND cancellation_reason IS NULL
AND cancelled_by IS NULL
AND cancelled_at IS NULL)
)
);

CREATE TABLE operation_executions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
schedule_id UUID NOT NULL UNIQUE REFERENCES operation_schedules(id) ON DELETE RESTRICT,
actual_product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
actual_quantity NUMERIC(14, 3) NOT NULL,
executed_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
idempotency_key UUID NOT NULL UNIQUE,
executed_at TIMESTAMPTZ NOT NULL,
note TEXT,
variance_reason TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (actual_quantity > 0)
);

-- ============================================================================
-- 10. WATER QUALITY AND SHRIMP HEALTH LOGS
-- ============================================================================

CREATE TABLE water_quality_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
recorded_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
recorded_at TIMESTAMPTZ NOT NULL,
temperature_c NUMERIC(5, 2),
ph NUMERIC(4, 2),
dissolved_oxygen_mg_l NUMERIC(6, 3),
salinity_ppt NUMERIC(6, 3),
nh3_mg_l NUMERIC(9, 5),
no2_mg_l NUMERIC(9, 5),
alkalinity_mg_l_caco3 NUMERIC(9, 2),
h2s_mg_l NUMERIC(9, 5),
note TEXT,
is_voided BOOLEAN NOT NULL DEFAULT FALSE,
voided_by UUID REFERENCES accounts(id) ON DELETE RESTRICT,
voided_at TIMESTAMPTZ,
void_reason TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (temperature_c IS NULL OR temperature_c BETWEEN 0 AND 50),
CHECK (ph IS NULL OR ph BETWEEN 0 AND 14),
CHECK (dissolved_oxygen_mg_l IS NULL OR dissolved_oxygen_mg_l >= 0),
CHECK (salinity_ppt IS NULL OR salinity_ppt >= 0),
CHECK (nh3_mg_l IS NULL OR nh3_mg_l >= 0),
CHECK (no2_mg_l IS NULL OR no2_mg_l >= 0),
CHECK (alkalinity_mg_l_caco3 IS NULL OR alkalinity_mg_l_caco3 >= 0),
CHECK (h2s_mg_l IS NULL OR h2s_mg_l >= 0),
CHECK ( (is_voided = FALSE AND voided_by IS NULL AND voided_at IS NULL AND void_reason IS NULL)
OR (is_voided = TRUE AND voided_by IS NOT NULL AND voided_at IS NOT NULL AND nullif(trim(void_reason), '')
IS NOT NULL) )
);

CREATE TABLE shrimp_health_logs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
season_id UUID NOT NULL REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
recorded_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
recorded_at TIMESTAMPTZ NOT NULL,
sample_size INT,
avg_weight_g NUMERIC(10, 3),
avg_length_cm NUMERIC(8, 2),
mortality_count BIGINT NOT NULL DEFAULT 0,
estimated_population BIGINT,
estimated_biomass_kg NUMERIC(14, 3),
health_status health_status NOT NULL DEFAULT 'good',
note TEXT,
is_voided BOOLEAN NOT NULL DEFAULT FALSE,
voided_by UUID REFERENCES accounts(id) ON DELETE RESTRICT,
voided_at TIMESTAMPTZ,
void_reason TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (sample_size IS NULL OR sample_size > 0),
CHECK (avg_weight_g IS NULL OR avg_weight_g > 0),
CHECK (avg_length_cm IS NULL OR avg_length_cm > 0),
CHECK (mortality_count >= 0),
CHECK (estimated_population IS NULL OR estimated_population >= 0),
CHECK (estimated_biomass_kg IS NULL OR estimated_biomass_kg >= 0),
CHECK ( (is_voided = FALSE AND voided_by IS NULL AND voided_at IS NULL AND void_reason IS NULL)
OR (is_voided = TRUE AND voided_by IS NOT NULL AND voided_at IS NOT NULL AND nullif(trim(void_reason), '')
IS NOT NULL) )
);

ALTER TABLE operation_schedules
ADD CONSTRAINT fk_operation_schedule_health_log
FOREIGN KEY (source_health_log_id)
REFERENCES shrimp_health_logs(id)
ON DELETE RESTRICT;

-- ============================================================================
-- 11. TASKS AND NOTIFICATIONS
-- ============================================================================

CREATE TABLE tasks (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
season_id UUID REFERENCES aquaculture_seasons(id) ON DELETE RESTRICT,
assigned_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
assigned_to UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
title VARCHAR(500) NOT NULL,
description TEXT,
priority task_priority NOT NULL DEFAULT 'normal',
status task_status NOT NULL DEFAULT 'pending',
due_at TIMESTAMPTZ,
started_at TIMESTAMPTZ,
completed_at TIMESTAMPTZ,
cancellation_reason TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CHECK (status <> 'in_progress' OR started_at IS NOT NULL),
CHECK (status <> 'completed' OR completed_at IS NOT NULL),
CHECK (status <> 'cancelled' OR nullif(trim(cancellation_reason), '') IS NOT NULL),
CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE notifications (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
title VARCHAR(500) NOT NULL,
content TEXT,
type notification_type NOT NULL,
reference_type VARCHAR(50),
reference_id UUID,
read_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 12. MINIMAL TECHNICAL TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- This is intentionally the only trigger function in V7. It is technical,
-- local to one row, deterministic, and contains no domain orchestration.
DO
$$

DECLARE
table*name_to_update TEXT;
BEGIN
FOREACH table_name_to_update IN ARRAY ARRAY[
'accounts', 'farms', 'ponds', 'aquaculture_seasons', 'products',
'inventory_balances', 'production_protocol_templates',
'production_protocol_template_items', 'disease_cases', 'protocols',
'protocol_items', 'operation_schedules',
'tasks'
] LOOP
EXECUTE format(
'CREATE TRIGGER trg*%I_updated_at BEFORE UPDATE ON %I '
'FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
table_name_to_update,
table_name_to_update
);
END LOOP;
END;

$$
;

-- ============================================================================
-- 13. INDEXES FOR AUTHORIZATION, WORK QUEUES, DASHBOARDS, AND ANALYTICS
-- ============================================================================

CREATE INDEX idx_accounts_role_status ON accounts(role, status);
CREATE INDEX idx_accounts_managed_owner_role_status
    ON accounts(managed_by_owner_id, role, status)
    WHERE managed_by_owner_id IS NOT NULL;
CREATE INDEX idx_farms_owner ON farms(owner_id) WHERE archived_at IS NULL;
CREATE INDEX idx_ponds_farm_status ON ponds(farm_id, status) WHERE archived_at IS NULL;
CREATE INDEX idx_seasons_pond_status ON aquaculture_seasons(pond_id, status);
CREATE INDEX idx_season_assignments_account_active
    ON season_personnel_assignments(account_id, role)
    WHERE unassigned_at IS NULL;
CREATE INDEX idx_harvest_events_season_date ON harvest_events(season_id, harvested_at DESC);

CREATE INDEX idx_inventory_transactions_lookup
ON inventory_transactions(product_id, created_at DESC);

CREATE INDEX idx_inventory_transactions_season
ON inventory_transactions(season_id, created_at DESC)
WHERE season_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_group ON inventory_transactions(transaction_group_id);
CREATE INDEX idx_inventory_transactions_balance ON inventory_transactions(inventory_balance_id, created_at DESC);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);


CREATE INDEX idx_protocols_season_type_status
    ON protocols(season_id, protocol_type, status, version_no DESC);
CREATE INDEX idx_protocols_case_status
    ON protocols(disease_case_id, status, version_no DESC)
    WHERE disease_case_id IS NOT NULL;
CREATE INDEX idx_protocol_items_protocol_sequence
    ON protocol_items(protocol_id, sequence_order);
CREATE INDEX idx_protocol_status_history
    ON protocol_status_history(protocol_id, changed_at);
CREATE INDEX idx_operation_schedules_season_time
    ON operation_schedules(season_id, scheduled_at, status);
CREATE INDEX idx_operation_schedules_protocol_item_time
    ON operation_schedules(protocol_item_id, scheduled_at, status);

CREATE INDEX idx_water_quality_season_date
    ON water_quality_logs(season_id, recorded_at DESC)
    WHERE is_voided = FALSE;
CREATE INDEX idx_shrimp_health_season_date
    ON shrimp_health_logs(season_id, recorded_at DESC)
    WHERE is_voided = FALSE;

CREATE INDEX idx_disease_cases_expert_status
    ON disease_cases(expert_id, status, created_at DESC);
CREATE INDEX idx_disease_cases_season_status
    ON disease_cases(season_id, status, created_at DESC);
CREATE INDEX idx_case_responses_case_date
    ON disease_case_responses(case_id, created_at);

CREATE INDEX idx_ai_diagnosis_season_date
    ON ai_diagnosis_logs(season_id, created_at DESC);
CREATE INDEX idx_ai_diagnosis_run_status
    ON ai_diagnosis_logs(run_status, created_at DESC);

CREATE INDEX idx_rag_queries_status_date
    ON rag_queries(query_status, created_at DESC);
CREATE INDEX idx_rag_feedback_rating_date
    ON rag_feedback(rating, created_at DESC);

CREATE INDEX idx_tasks_assignee_status_due
    ON tasks(assigned_to, status, due_at);
CREATE INDEX idx_notifications_account_unread
    ON notifications(account_id, created_at DESC)
    WHERE read_at IS NULL;

-- ============================================================================
-- 14. READ MODELS / KPI VIEWS
-- ============================================================================

CREATE VIEW v_owner_managed_personnel AS
SELECT
    a.managed_by_owner_id AS owner_id,
    a.id AS account_id,
    a.email,
    a.full_name,
    a.phone,
    a.role,
    a.status,
    count(spa.id) FILTER (WHERE spa.unassigned_at IS NULL) AS current_season_assignments
FROM accounts a
LEFT JOIN season_personnel_assignments spa ON spa.account_id = a.id
WHERE a.role IN ('technician', 'expert')
GROUP BY a.managed_by_owner_id, a.id;

CREATE VIEW v_admin_system_overview AS
SELECT
    (SELECT count(*) FROM accounts WHERE role <> 'admin') AS managed_accounts,
    (SELECT count(*) FROM accounts WHERE status = 'active' AND role <> 'admin') AS active_accounts,
    (SELECT count(*) FROM accounts WHERE status = 'pending_activation') AS pending_activation_accounts,
    (SELECT count(*) FROM farms WHERE archived_at IS NULL) AS active_farms,
    (SELECT count(*) FROM aquaculture_seasons WHERE status = 'active') AS active_seasons,
    (SELECT count(*) FROM ai_diagnosis_logs WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS ai_requests_today,
    (SELECT count(*) FROM rag_queries WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS rag_questions_today;

CREATE VIEW v_protocol_approval_inbox AS
SELECT
    pr.protocol_type,
    pr.id AS protocol_id,
    p.farm_id,
    pr.season_id,
    pr.disease_case_id,
    pr.title,
    pr.version_no,
    pr.status,
    pr.created_by,
    pr.submitted_at
FROM protocols pr
JOIN aquaculture_seasons s ON s.id = pr.season_id
JOIN ponds p ON p.id = s.pond_id
WHERE pr.status = 'pending_approval';

CREATE VIEW v_technician_kpi AS
WITH season_counts AS (
    SELECT account_id, count(DISTINCT season_id) AS seasons_participated
      FROM season_personnel_assignments
     WHERE role = 'technician'
     GROUP BY account_id
), task_counts AS (
    SELECT
        assigned_to AS account_id,
        count(*) FILTER (WHERE status = 'completed') AS completed_tasks,
        count(*) FILTER (
            WHERE status = 'completed'
              AND (due_at IS NULL OR completed_at <= due_at)
        ) AS on_time_completed_tasks
      FROM tasks
     GROUP BY assigned_to
)
SELECT
    a.id AS technician_id,
    COALESCE(sc.seasons_participated, 0) AS seasons_participated,
    COALESCE(tc.completed_tasks, 0) AS completed_tasks,
    COALESCE(tc.on_time_completed_tasks, 0) AS on_time_completed_tasks,
    round(
        100.0 * COALESCE(tc.on_time_completed_tasks, 0)
        / NULLIF(tc.completed_tasks, 0),
        2
    ) AS on_time_completion_rate_pct
FROM accounts a
LEFT JOIN season_counts sc ON sc.account_id = a.id
LEFT JOIN task_counts tc ON tc.account_id = a.id
WHERE a.role = 'technician';

CREATE VIEW v_expert_kpi AS
WITH season_counts AS (
    SELECT account_id, count(DISTINCT season_id) AS seasons_participated
      FROM season_personnel_assignments
     WHERE role = 'expert'
     GROUP BY account_id
), case_counts AS (
    SELECT
        expert_id AS account_id,
        count(*) AS disease_cases_handled,
        count(*) FILTER (WHERE status = 'resolved') AS disease_cases_resolved,
        round(
            avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0)
                FILTER (WHERE status = 'resolved'),
            2
        ) AS avg_resolution_hours
      FROM disease_cases
     GROUP BY expert_id
)
SELECT
    a.id AS expert_id,
    COALESCE(sc.seasons_participated, 0) AS seasons_participated,
    COALESCE(cc.disease_cases_handled, 0) AS disease_cases_handled,
    COALESCE(cc.disease_cases_resolved, 0) AS disease_cases_resolved,
    cc.avg_resolution_hours
FROM accounts a
LEFT JOIN season_counts sc ON sc.account_id = a.id
LEFT JOIN case_counts cc ON cc.account_id = a.id
WHERE a.role = 'expert';

CREATE VIEW v_season_operational_metrics AS
WITH actual_feed AS (
    SELECT os.season_id, sum(oe.actual_quantity) AS total_feed_kg
      FROM operation_executions oe
      JOIN operation_schedules os ON os.id = oe.schedule_id
     WHERE os.operation_type = 'feeding'
       AND os.unit = 'kg'
     GROUP BY os.season_id
), harvested AS (
    SELECT season_id, sum(total_weight_kg) AS harvested_biomass_kg
      FROM harvest_events
     GROUP BY season_id
), latest_health AS (
    SELECT DISTINCT ON (season_id)
           season_id, estimated_population, estimated_biomass_kg, avg_weight_g, recorded_at
      FROM shrimp_health_logs
     WHERE is_voided = FALSE
       AND estimated_biomass_kg IS NOT NULL
     ORDER BY season_id, recorded_at DESC
)
SELECT
    s.id AS season_id,
    COALESCE(af.total_feed_kg, 0) AS total_feed_kg,
    lh.estimated_population,
    lh.estimated_biomass_kg,
    lh.avg_weight_g AS latest_avg_weight_g,
    CASE
        WHEN s.initial_quantity > 0 AND lh.estimated_population IS NOT NULL
        THEN round(100.0 * lh.estimated_population / s.initial_quantity, 2)
    END AS estimated_survival_rate_pct,
    CASE
        WHEN lh.avg_weight_g IS NOT NULL AND s.initial_avg_weight_g IS NOT NULL
        THEN lh.avg_weight_g - s.initial_avg_weight_g
    END AS weight_gain_g,
    CASE
        WHEN COALESCE(lh.estimated_biomass_kg, 0)
             + COALESCE(h.harvested_biomass_kg, 0)
             - COALESCE(s.initial_biomass_kg, 0) > 0
        THEN round(
            COALESCE(af.total_feed_kg, 0)
            / (
                COALESCE(lh.estimated_biomass_kg, 0)
                + COALESCE(h.harvested_biomass_kg, 0)
                - COALESCE(s.initial_biomass_kg, 0)
            ),
            3
        )
    END AS estimated_fcr
FROM aquaculture_seasons s
LEFT JOIN actual_feed af ON af.season_id = s.id
LEFT JOIN harvested h ON h.season_id = s.id
LEFT JOIN latest_health lh ON lh.season_id = s.id;

CREATE VIEW v_ai_daily_analytics AS
SELECT
    (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS metric_date,
    count(*) AS total_predictions,
    count(*) FILTER (WHERE run_status = 'success') AS successful_predictions,
    count(*) FILTER (WHERE run_status = 'error') AS technical_errors,
    round(
        100.0 * count(*) FILTER (WHERE run_status = 'error') / NULLIF(count(*), 0),
        2
    ) AS technical_error_rate_pct,
    round(avg(confidence) FILTER (WHERE run_status = 'success'), 5) AS avg_confidence,
    count(*) FILTER (
        WHERE run_status = 'success' AND confidence < 0.60
    ) AS low_confidence_predictions,
    round(
        100.0 * count(*) FILTER (
            WHERE run_status = 'success' AND confidence < 0.60
        ) / NULLIF(count(*) FILTER (WHERE run_status = 'success'), 0),
        2
    ) AS low_confidence_rate_pct,
    round(avg(processing_time_ms), 2) AS avg_processing_time_ms
FROM ai_diagnosis_logs
GROUP BY (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

CREATE VIEW v_ai_label_daily_distribution AS
SELECT
    (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS metric_date,
    predicted_label,
    count(*) AS prediction_count,
    round(avg(confidence), 5) AS avg_confidence
FROM ai_diagnosis_logs
WHERE run_status = 'success'
GROUP BY (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, predicted_label;

CREATE VIEW v_rag_daily_analytics AS
SELECT
    (q.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS metric_date,
    count(*) AS total_questions,
    count(*) FILTER (WHERE q.query_status = 'answered') AS answered_questions,
    count(*) FILTER (WHERE q.query_status = 'no_source') AS no_source_questions,
    count(*) FILTER (WHERE q.query_status = 'low_match') AS low_match_questions,
    count(*) FILTER (WHERE q.query_status = 'error') AS technical_errors,
    round(avg(q.processing_time_ms), 2) AS avg_processing_time_ms,
    count(rf.id) AS rated_answers,
    round(avg(rf.rating), 2) AS avg_star_rating,
    round(100.0 * count(rf.id) / NULLIF(count(*), 0), 2) AS feedback_rate_pct,
    count(rf.id) FILTER (WHERE rf.rating = 1) AS one_star_ratings,
    count(rf.id) FILTER (WHERE rf.rating = 2) AS two_star_ratings,
    count(rf.id) FILTER (WHERE rf.rating = 3) AS three_star_ratings,
    count(rf.id) FILTER (WHERE rf.rating = 4) AS four_star_ratings,
    count(rf.id) FILTER (WHERE rf.rating = 5) AS five_star_ratings
FROM rag_queries q
LEFT JOIN rag_feedback rf ON rf.query_id = q.id
GROUP BY (q.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

-- ============================================================================
-- 15. IMPLEMENTATION NOTES
-- ============================================================================

-- 01) This is a CLEAN SCHEMA for a new PostgreSQL database. Upgrade an existing
--     database through reviewed, reversible migrations; never execute this file as
--     a destructive replacement over production data.
-- 02) A Use Case is one actor goal, not one API. List/detail/create/update/archive
--     remain separate UCs, while multi-step goals such as forgot-password and account
--     activation each use three endpoints inside one coherent account-holder journey.
-- 03) Store only HMAC/peppered hashes of OTP/action tokens. Enforce ten-minute OTP
--     expiry, five attempts, a 60-second account resend gate, single-use action tokens,
--     neutral unknown-email responses, and IP/device rate limits in API/cache.
-- 04) Admin creates Owner first and then KTV/Expert with one managing Owner. New accounts
--     are PENDING_ACTIVATION. Password and profile fields are completed by the account holder.
--     invited_at and activation_email_sent_at support resend/expiry/operations screens.
-- 05) expert_profiles is intentionally absent because the approved UC scope uses only
--     the common profile fields. Reintroduce a normalized role-specific table only if
--     selection/search by specialization, certification or experience becomes a UC.
-- 06) V7 follows a THIN-DATABASE / RICH-APPLICATION-SERVICE split. PostgreSQL owns PK,
--     FK, NOT NULL, CHECK, partial UNIQUE indexes, append-only permissions and the local
--     updated_at trigger. Application Services own authorization, state machines,
--     cross-table validation, orchestration, row locking and domain notifications.
-- 07) The database connection role used by the API must not receive unrestricted table
--     writes. Repositories expose use-case-specific methods; migrations use a separate
--     owner role. Integration tests verify constraints and transaction behavior.
-- 08) Applied production and treatment protocols use one protocols table and one
--     protocol_items table. protocol_type plus context CHECK rules replace the duplicated
--     90-percent-identical models, and operation_schedules has one protocol_item_id FK.
-- 09) production_protocol_templates remains separate. It is a reusable authoring asset
--     with archive lifecycle, while protocols is a versioned, approved snapshot applied
--     to one season/case. Merging these aggregates would create a different anti-pattern.
-- 10) ProtocolApplicationService validates: active assigned Expert as author, Farm Owner
--     as reviewer, disease_case.season_id = protocol.season_id, same-Farm products,
--     sequential version_no, same type/context predecessor, and at least one valid item.
-- 11) Protocol state transitions are enforced in service code and written with a matching
--     protocol_status_history row in the same transaction. Approved/superseded/aborted
--     versions and their items are immutable through repository permissions.
--     A successor may be submitted before every old schedule is completed. On approval,
--     the service supersedes the predecessor, preserves completed executions, cancels its
--     remaining PLANNED schedules as PROTOCOL_SUPERSEDED, and activates the new version.
-- 12) Owner approval does NOT generate a 90-120 day schedule. It approves the immutable
--     dosing rules, supersedes the prior version. A worker materializes only the next
--     rolling_window_days (recommended 3-7 days; schema permits 1-14).
-- 13) Schedule quantity formulas are evaluated when a short-window occurrence is created:
--       FIXED_QUANTITY   = dose_value
--       PER_KG_BIOMASS   = dose_value * latest_estimated_biomass_kg
--       PERCENT_BIOMASS  = dose_value / 100 * latest_estimated_biomass_kg
--       PER_M3_WATER     = dose_value * current_pond_volume_m3
--     Unit conversion/rounding belongs to a tested domain calculator, not SQL triggers.
-- 14) Dynamic biomass calculations use the newest valid shrimp_health_logs record from
--     the same season. Initial biomass may be used only during the configured early-stage
--     fallback. If data is absent/stale, the worker records last_error, schedules retry,
--     emits an alert, and does not guess a quantity.
-- 15) Each schedule stores the rule snapshot, input basis, source health log, calculator
--     version and calculated_at for explainability. UNIQUE(protocol_item_id, scheduled_at)
--     makes worker retries idempotent. Generated PLANNED rows are not silently recalculated;
--     cancel and regenerate through a controlled correction flow when necessary.
-- 16) Emergency treatment abort is a separate Expert UC. In one transaction the service
--     locks the Disease Case and approved treatment protocol, verifies current Expert,
--     requires clinical reason, changes protocol to ABORTED, cancels only unexecuted
--     PLANNED rows, moves the case to MONITORING, writes both histories and an outbox event.
--     The confirmation UI shows active version, latest health evidence, completed/planned
--     counts and affected future schedules; success returns the cancelled count and case state.
-- 17) A KTV does not abort a regimen directly. KTV sends EMERGENCY_ALERT through the
--     existing Respond Disease Case UC with message/evidence; Expert assesses and decides.
--     Owner receives immediate notification but no extra approval is required to stop an
--     unsafe regimen. Any replacement protocol still requires normal Owner approval.
-- 18) After ABORTED, the Expert may immediately create/submit the next treatment version
--     linked through supersedes_protocol_id; completed executions remain historical and
--     cancelled future rows retain cancellation type, actor, time and reason.
-- 19) Record-operation execution is one transaction: lock PLANNED schedule and inventory
--     balance, validate current KTV and active season, insert STOCK_OUT when applicable,
--     insert immutable execution, update balance, complete schedule, add outbox event,
--     then commit. idempotency_key prevents double consumption from repeated mobile taps.
-- 20) Each Farm has one logical inventory. There is no warehouse transfer.
-- 20a) One inventory transaction row represents movement against one inventory balance/cost
--      layer. transaction_group_id groups multiple rows belonging to one business operation
--      (for example FIFO consumption across multiple lots). Application Services choose FIFO
--      and create all related rows atomically; operation_executions does not store a single
--      inventory_transaction_id because one execution may consume multiple lots.
-- 21) Disease Case status orchestration is handled by DiseaseCaseApplicationService and
--     always appends disease_case_status_history. RESOLVED is terminal; recurrence creates
--     a new case linked by related_case_id. AI output never resolves a case automatically.
-- 22) Partial harvest is repeatable. Final harvest is unique and completes the season in
--     one transaction. Emergency mortality may first abort treatment, then follow final
--     harvest or season cancellation according to Owner/Expert decisions.
-- 23) There is no Expert rating of AI diagnosis and no Admin AI-review workflow. KTV rates
--     only their own RAG answer with 1-5 stars plus optional comment. Admin reads aggregate
--     AI/RAG operational analytics; confidence is not clinical accuracy.
-- 24) Store timestamps in UTC, render the account holder's timezone, paginate with stable
--     cursors, use ETag
--     or updated_at optimistic concurrency for editable drafts, and keep object media in
--     private storage with validated MIME/size and signed URLs.
-- 25) Required test layers: pure unit tests for calculators/state machines; repository
--     integration tests with real PostgreSQL/Testcontainers; API authorization tests for
--     every actor; transaction rollback/idempotency/concurrency tests for approval, abort,
--     rolling generation, stock-out, replacement, harvest and account activation.

-- ============================================================================
-- 16. MAJOR BUSINESS RULES
-- ============================================================================

-- ACCOUNTS, ACTIVATION, OWNERSHIP AND ACCESS
-- BR-ACC-01 Admin alone creates FARM_OWNER, TECHNICIAN and EXPERT managed accounts.
-- BR-ACC-02 Owner must be ACTIVE before Admin creates KTV/Expert managed by that Owner.
-- BR-ACC-03 Every KTV/Expert belongs to exactly one Owner; Owner belongs to no Owner.
-- BR-ACC-04 New accounts start PENDING_ACTIVATION and become ACTIVE only after successful
--           email verification and self-completion of name/password/profile data.
-- BR-ACC-05 Email, role and managing Owner are immutable after activation. Staff transfer
--           between Owners and Farm ownership transfer are outside this project scope.
-- BR-ACC-06 BLOCKED/INACTIVE accounts cannot authenticate and their refresh tokens are revoked.
-- BR-ACC-07 Owner sees only managed staff. Farm eligibility is derived from Owner ownership;
--           operational season access still requires a current season assignment.
-- BR-ACC-08 Assigned staff must be replaced before deactivation; Owner with open seasons or
--           enabled staff cannot be deactivated.

-- FARM, POND, SEASON, PERSONNEL, TASK AND HARVEST
-- BR-FARM-01 Every Farm belongs to one active Owner and has one logical inventory.
-- BR-FARM-02 A season can be created only in a non-archived AVAILABLE aquaculture pond;
--            one pond has at most one PLANNING/ACTIVE season.
-- BR-FARM-03 Season starts PLANNING. Activation requires stocking data, exactly one active
--            KTV, one active Expert and one APPROVED production protocol.
-- BR-FARM-04 Only Owner assigns/replaces eligible staff. Replacement keeps history, transfers
--            open KTV tasks/unresolved cases, and never rewrites historical authorship.
-- BR-FARM-06 Owner records harvest. PARTIAL is repeatable with positive remaining estimate;
--            FINAL occurs once and completes the season.
-- BR-TASK-01 Owner manages tasks for active managed KTV. A season task targets its current KTV.
-- BR-TASK-02 COMPLETED/CANCELLED tasks are terminal; KTV updates only assigned task progress.

-- UNIFIED PROTOCOL MODEL AND VERSIONING
-- BR-PRO-01 Reusable production templates and applied protocols are separate aggregates.
-- BR-PRO-02 Applied PRODUCTION and TREATMENT versions share protocols/protocol_items.
-- BR-PRO-03 PRODUCTION requires season_id and no disease_case_id. TREATMENT requires both,
--           and its Disease Case must belong to that same season.
-- BR-PRO-04 Only current assigned Expert authors/submits; only Farm Owner approves/rejects.
--           Admin never reviews protocols or resolves Disease Cases.
-- BR-PRO-05 New versions start DRAFT. DRAFT/REJECTED content is editable; reviewed versions
--           and items are immutable. Any change after approval creates a linked version.
-- BR-PRO-06 version_no is sequential inside the same type/context. A predecessor must match
--           type and target; one APPROVED production version per season and treatment version
--           per Disease Case is allowed at a time.
-- BR-PRO-07 A successor does not wait for every predecessor schedule to complete. Its Owner
--           approval atomically supersedes the old version, preserves completed facts and
--           cancels remaining PLANNED rows as PROTOCOL_SUPERSEDED.
-- BR-PRO-08 Protocol product references must belong to the same Farm and be active at approval.
-- BR-PRO-09 Every state transition and clinical/approval reason is appended to immutable
--           protocol_status_history in the same service transaction.
-- BR-PRO-10 Every applied protocol defines a timeline anchor date. Production protocols
-- 		 anchor to aquaculture_seasons.stocking_date (DOC = start_day_offset + 1).
-- 		 Treatment protocols anchor strictly to the Farm Owner approval date
-- 		 (reviewed_at::date) (treatment day = start_day_offset + 1) to prevent review
-- 		 latency from shifting medication regimens. The disease case creation date is
-- 		 prohibited as an anchor.
-- BR-PRO-11 Age-based dosing constraints enforce aquaculture biological reality. When
--   		 protocol_items have start_day_offset < 30: feeding and medicine items must
-- 		 strictly use FIXED_QUANTITY dosing (biomass-based dosing is prohibited);
-- 		 chemical and mineral items must use PER_M3_WATER or FIXED_QUANTITY.
-- 		 Biomass-based dosing (PERCENT_BIOMASS, PER_KG_BIOMASS) unlocks only when
-- 		 start_day_offset >= 30, when shrimp enter feeding trays and sampling is viable.

-- ROLLING-WINDOW SCHEDULE GENERATION
-- BR-SCH-01 Approval stores rules; it never precomputes the full 90-120 day production season.
-- BR-SCH-02 Worker materializes a 3-7 day rolling window using idempotent uniqueness per
--           protocol item and scheduled time; window length is configurable from 1-14 days.
-- BR-SCH-03 FIXED uses dose value; biomass-based doses use latest valid estimated biomass;
--           PER_M3 uses current pond volume. Calculator version and inputs are snapshotted.
-- BR-SCH-04 Missing/stale dynamic input blocks that occurrence and creates an operational
--           alert. The system must never invent biomass or silently use stale data.
-- BR-SCH-05 A materialized PLANNED quantity is frozen for explainability. A controlled cancel
--           and regenerate flow is required if the basis must change before execution.
-- BR-SCH-06 operation_schedules references exactly one protocol_item_id; the former manual
--           production/treatment exclusive arc is removed.

-- DISEASE CASE AND EMERGENCY TREATMENT CONTROL
-- BR-CASE-01 Only current KTV of an ACTIVE season creates a case; it starts OPEN and targets
--            the current Expert. AI diagnosis/related case, when linked, uses the same season.
-- BR-CASE-02 KTV responses include PROVIDE_INFO, MONITORING_RESULT, TREATMENT_RESULT and
--            EMERGENCY_ALERT. Expert responses include REQUEST_INFO, ASSESSMENT,
--            INSTRUCTION and RESOLUTION.
-- BR-CASE-03 Only current participants add content. No response/attachment is added after
--            RESOLVED. RESOLVED requires Expert and resolution summary and cannot reopen.
-- BR-TRT-01 A regimen may be aborted only when an APPROVED treatment protocol is active and
--           only by the currently assigned Expert with a mandatory clinical reason.
-- BR-TRT-02 Emergency abort preserves COMPLETED executions and cancels only future PLANNED
--           treatment schedules with type, actor, time and reason.
-- BR-TRT-03 Abort moves the case to MONITORING and immediately notifies KTV and Owner.
-- BR-TRT-04 After abort, Expert may create a replacement version immediately; Owner approval
--           is still required before new treatment schedules become executable.
-- BR-TRT-05 KTV can raise an emergency alert but cannot directly abort/approve a protocol.

-- OPERATIONS, WATER, HEALTH AND INVENTORY
-- BR-OPS-01 Only current KTV records water, health, AI request and operation execution for an
--           ACTIVE assigned season.
-- BR-OPS-02 One schedule has at most one immutable execution. Product STOCK_OUT, execution,
--           balance update and schedule completion commit atomically and idempotently.
-- BR-OPS-03 Only PLANNED rows execute. COMPLETED/CANCELLED rows are terminal business facts.
-- BR-OPS-04 Technicians may adjust the actual execution quantity. If the difference between
-- 		 actual_quantity and planned_quantity exceeds allowed_variance_pct, variance_reason
-- 		 becomes mandatory.
-- BR-WATER-01 Water values stay within physical ranges. Records are immutable after creation;
--             incorrect records may only be voided by the current KTV with actor/time/reason.
-- BR-HEALTH-01 Shrimp health records are immutable after creation; incorrect records may only be
--              voided by the current KTV with actor/time/reason. Only non-voided records feed
--              operational health, biomass and growth calculations.
-- BR-INV-01 Product name+unit is unique per Farm among active products; products never move
--            between Farms and cannot be archived with stock or planned use.
-- BR-INV-02 Owner records STOCK_IN/adjustments. STOCK_OUT originates only from KTV execution.
-- BR-INV-03 Ledger is append-only, stock never becomes negative, and adjustments need reason.
-- BR-INV-04 Operation schedule generation does not pre-allocate or lock inventory balances.
-- 		 Stock is deducted strictly Just-In-Time upon operation execution. Cancelling
-- 		 planned schedules never mutate inventory balances. If stock is insufficient
-- 		 at execution time, the transaction is rejected and an inventory_insufficient
-- 		 notification is dispatched.

-- AI, RAG, DASHBOARDS AND NOTIFICATIONS
-- BR-AI-01 Only assigned KTV requests diagnosis; each run stores input snapshot, model version,
--           latency and either prediction/confidence or technical error.
-- BR-AI-02 There is no Expert AI rating and no Admin AI/RAG review-case workflow.
-- BR-RAG-01 Only active KTV uses RAG and may rate one owned answer 1-5 stars with comment.
-- BR-DASH-01 Admin dashboard is read-only aggregate analytics; Owner KPI is informational and
--             must not be treated as an automatic employment score.
-- BR-NOTI-01 KTV receives assignment/replacement, schedule due/overdue/cancelled/generation
--             failure, emergency, task, case response/status, protocol review, inventory
--             and season notices.
-- BR-NOTI-02 Expert receives assignment/replacement, new case, emergency alert, responses,
--             protocol review, generation failure, schedule completion and season notices.
-- BR-NOTI-03 Owner receives staff activation, water/emergency/case alerts, protocol pending,
--             generation failure, treatment aborted, task completion, inventory, harvest
--             and season notices.
-- BR-NOTI-04 Admin has no operational notification center. Invitation/OTP/account-state
--             messages are email/security communications.

-- ARCHITECTURE, DATA RETENTION AND OUT-OF-SCOPE
-- BR-ARCH-01 DB enforces static integrity; Application Services enforce authorization, state
--            transitions and cross-domain orchestration inside explicit transactions.
-- BR-ARCH-02 No runtime set_config bypass flags or cross-domain business triggers are used.
-- BR-ARCH-03 SELECT FOR UPDATE is used only on aggregate roots/balances during state-changing
--            transactions, not for ordinary list/detail/log reads.
-- BR-DATA-01 Assignments, statuses, versions, schedules, executions, harvests, cases, AI/RAG
--            facts and inventory transactions are retained and not hard-deleted by UCs.
-- BR-DATA-02 Pond/shrimp transfer, multi-warehouse inventory, expenses, generic audit logs,
--            Admin AI-review/retraining actions and Disease Case reopen remain out of scope.

-- Khi challenge đạt failed_attempts = 5, challenge hiện tại bị vô hiệu hóa. Người dùng có thể yêu cầu gửi lại mã mới sau khi thỏa điều kiện resend_available_at; challenge mới được tạo và challenge cũ được đánh dấu superseded_at.

COMMIT;

-- POST-RUN CHECKS (manual)
-- SELECT current_database();
-- SELECT current_user;
-- SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'citext');
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT table_name FROM information_schema.views WHERE table_schema='public' ORDER BY table_name;
$$
