-- ============================================================================
-- Seed Data: 001_seed_dev_data.sql
-- Description: Development-only synthetic seed data for pharmacy-security-service.
-- NOTE: All data is synthetic and contains NO real patient or personal info.
-- ============================================================================

-- Clean existing data safely in reverse dependency order
TRUNCATE TABLE ai_prediction_feedback, ai_symptom_logs, audit_logs, dispensations, prescriptions, inventory, medicines, users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. SEED USERS (Roles: patient, doctor, admin)
-- Password hash: Synthetic placeholder for development tests
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, full_name, role, phone_number, is_active) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@medsecure.local', '$2b$10$devAdminHashPlaceholderOnly12345678901234567890123456789', 'System Administrator', 'admin', '+1-555-0101', true),
    ('a0000000-0000-0000-0000-000000000002', 'dr.smith@medsecure.local', '$2b$10$devDoctorHashPlaceholderOnly1234567890123456789012345678', 'Dr. Jane Smith, MD', 'doctor', '+1-555-0102', true),
    ('a0000000-0000-0000-0000-000000000003', 'dr.chen@medsecure.local', '$2b$10$devDoctorHashPlaceholderOnly1234567890123456789012345678', 'Dr. David Chen, MD', 'doctor', '+1-555-0103', true),
    ('a0000000-0000-0000-0000-000000000004', 'patient.doe@example.test', '$2b$10$devPatientHashPlaceholderOnly123456789012345678901234567', 'John Doe (Dev Test)', 'patient', '+1-555-0201', true),
    ('a0000000-0000-0000-0000-000000000005', 'patient.williams@example.test', '$2b$10$devPatientHashPlaceholderOnly123456789012345678901234567', 'Sarah Williams (Dev Test)', 'patient', '+1-555-0202', true)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. SEED MEDICINES
-- ----------------------------------------------------------------------------
INSERT INTO medicines (id, sku, name, generic_name, manufacturer, category, unit_price, reorder_threshold, safety_stock, supplier_lead_time_days, is_prescription_required) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'MED-AMOX-500', 'Amoxicillin 500mg Capsule', 'Amoxicillin', 'Apotex Health', 'Antibiotic', 14.50, 100, 30, 7, true),
    ('b0000000-0000-0000-0000-000000000002', 'MED-METF-850', 'Metformin HCl 850mg Tablet', 'Metformin Hydrochloride', 'Teva Pharmaceuticals', 'Antidiabetic', 9.25, 150, 30, 7, true),
    ('b0000000-0000-0000-0000-000000000003', 'MED-ATOR-20', 'Atorvastatin 20mg Tablet', 'Atorvastatin Calcium', 'Pfizer Inc.', 'Cardiovascular', 22.00, 80, 30, 7, true),
    ('b0000000-0000-0000-0000-000000000004', 'MED-OMEP-20', 'Omeprazole 20mg Delayed-Release', 'Omeprazole', 'AstraZeneca', 'Gastrointestinal', 16.75, 50, 30, 7, false),
    ('b0000000-0000-0000-0000-000000000005', 'MED-PARA-500', 'Paracetamol 500mg Tablet', 'Acetaminophen', 'GSK Consumer', 'Analgesic', 4.50, 200, 30, 7, false),
    -- Module 11 Standardized ATC Therapeutic Series
    ('b0000000-0000-0000-0000-000000000011', 'MED-ATC-M01AB', 'Diclofenac Sodium 50mg Tablet', 'Diclofenac', 'Novartis Pharma', 'Anti-inflammatory', 8.50, 100, 30, 7, true),
    ('b0000000-0000-0000-0000-000000000012', 'MED-ATC-M01AE', 'Ibuprofen 400mg Tablet', 'Ibuprofen', 'Abbott Healthcare', 'Anti-inflammatory', 6.00, 120, 35, 7, false),
    ('b0000000-0000-0000-0000-000000000013', 'MED-ATC-N02BA', 'Aspirin 100mg Tablet', 'Acetylsalicylic Acid', 'Bayer AG', 'Analgesic', 5.00, 80, 25, 7, false),
    ('b0000000-0000-0000-0000-000000000014', 'MED-ATC-N02BE', 'Paracetamol 500mg (ATC)', 'Acetaminophen', 'GSK Consumer', 'Analgesic', 4.50, 150, 30, 7, false),
    ('b0000000-0000-0000-0000-000000000015', 'MED-ATC-N05B', 'Diazepam 5mg Tablet', 'Diazepam', 'Roche Products', 'Anxiolytic', 12.00, 60, 20, 7, true),
    ('b0000000-0000-0000-0000-000000000016', 'MED-ATC-N05C', 'Zolpidem Tartrate 10mg', 'Zolpidem', 'Sanofi Synthelabo', 'Sedative', 18.50, 40, 15, 7, true),
    ('b0000000-0000-0000-0000-000000000017', 'MED-ATC-R03', 'Salbutamol Inhaler 100mcg', 'Salbutamol', 'GSK Respiratory', 'Respiratory', 25.00, 75, 25, 7, true),
    ('b0000000-0000-0000-0000-000000000018', 'MED-ATC-R06', 'Cetirizine HCl 10mg Tablet', 'Cetirizine', 'UCB Pharma', 'Antihistamine', 7.50, 90, 30, 7, false)
ON CONFLICT (id) DO UPDATE SET
    safety_stock = EXCLUDED.safety_stock,
    supplier_lead_time_days = EXCLUDED.supplier_lead_time_days;

-- ----------------------------------------------------------------------------
-- 3. SEED INVENTORY (Batch Tracking & Stock Quantities)
-- ----------------------------------------------------------------------------
INSERT INTO inventory (id, medicine_id, batch_number, quantity, expiry_date, location_bin) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BATCH-AMX-2026A', 250, '2027-08-31', 'Aisle 1 - Shelf A2'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'BATCH-AMX-2026B', 150, '2028-02-28', 'Aisle 1 - Shelf A3'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'BATCH-MTF-2025D', 500, '2027-12-15', 'Aisle 2 - Shelf B1'),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'BATCH-ATV-2026C', 320, '2027-05-30', 'Aisle 2 - Shelf B4'),
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'BATCH-OMP-2026X', 180, '2028-01-20', 'Aisle 3 - Shelf C1'),
    ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 'BATCH-PAR-2026Y', 1000, '2028-11-30', 'Aisle 4 - Shelf D1')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. SEED PRESCRIPTIONS
-- ----------------------------------------------------------------------------
INSERT INTO prescriptions (id, patient_id, medicine_id, dosage, frequency, duration, status, prescribed_date) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', '500mg capsule', '1 capsule every 8 hours', '7 days', 'active', '2026-08-15'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', '850mg tablet', '1 tablet twice daily with meals', '30 days', 'active', '2026-08-10'),
    ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', '20mg tablet', '1 tablet daily at bedtime', '90 days', 'active', '2026-08-01')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. SEED DISPENSATIONS (Historical usage for forecasting)
-- ----------------------------------------------------------------------------
INSERT INTO dispensations (id, prescription_id, inventory_id, dispensed_by, quantity_dispensed, notes, dispensed_at) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 21, 'Dispensed initial 7-day course', '2026-08-15 10:30:00Z'),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 60, 'Monthly refill dispensed', '2026-08-16 14:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. SEED AUDIT LOGS (Security baseline)
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, created_at) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SYSTEM_INITIALIZATION', 'system', 'seed', '{"status": "completed"}'::jsonb, '127.0.0.1', '2026-08-19 00:00:00Z')
ON CONFLICT (id) DO NOTHING;
