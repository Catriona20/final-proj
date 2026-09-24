-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Creates initial tables for users, medicines, inventory, and prescriptions.
-- PostgreSQL Version: >= 14
-- ============================================================================

-- Ensure pgcrypto extension is available for gen_random_uuid() (standard in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores patient, pharmacist, and administrator accounts.
-- Passwords are strictly hashed (never stored in plain text).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    phone_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for authentication lookups by email and filtering active users by role
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- ----------------------------------------------------------------------------
-- 2. MEDICINES TABLE
-- Master catalog of pharmaceutical items, prices, and classifications.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0.00),
    reorder_threshold INTEGER NOT NULL DEFAULT 50 CHECK (reorder_threshold >= 0),
    is_prescription_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for searching catalog by name, generic name, category, and SKU
CREATE INDEX IF NOT EXISTS idx_medicines_sku ON medicines(sku);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines(generic_name);

-- ----------------------------------------------------------------------------
-- 3. INVENTORY TABLE
-- Batch-level inventory tracking for medicines (expiration, stock levels).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    expiry_date DATE NOT NULL,
    location_bin VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Prevent duplicate batch entries for the same medicine
    CONSTRAINT uq_inventory_medicine_batch UNIQUE (medicine_id, batch_number)
);

-- Indexes for fast inventory lookup by medicine and expiry queries
CREATE INDEX IF NOT EXISTS idx_inventory_medicine_id ON inventory(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory(batch_number);

-- ----------------------------------------------------------------------------
-- 4. PRESCRIPTIONS TABLE
-- Links a patient to prescribed medicines with dosage, frequency, and duration.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'cancelled', 'expired')),
    prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying prescriptions by patient, medicine, and status
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medicine_id ON prescriptions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_status ON prescriptions(patient_id, status);
