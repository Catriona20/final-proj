-- ============================================================================
-- Migration: 002_dispensing_audit_analytics.sql
-- Description: Adds tables for dispensing tracking, security audit logging,
--              and AI prediction logs & feedback (Modules 11 & 12).
-- PostgreSQL Version: >= 14
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DISPENSATIONS TABLE (Module 11 - Pharmacy Dispensing & Historical Data)
-- Records historical dispensing transactions linking prescriptions and batches.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispensations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    dispensed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quantity_dispensed INTEGER NOT NULL CHECK (quantity_dispensed > 0),
    notes TEXT,
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispensations_inventory ON dispensations(inventory_id);
CREATE INDEX IF NOT EXISTS idx_dispensations_prescription ON dispensations(prescription_id);
CREATE INDEX IF NOT EXISTS idx_dispensations_dispensed_at ON dispensations(dispensed_at);
CREATE INDEX IF NOT EXISTS idx_dispensations_dispensed_by ON dispensations(dispensed_by);

-- ----------------------------------------------------------------------------
-- 2. AUDIT LOGS TABLE (Module 12 - Security & Compliance)
-- Immutable log of security and operational events (logins, stock changes, etc.).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- 3. AI SYMPTOM LOGS TABLE (Module 10 & 12 - Symptom Analysis & AI Evaluation)
-- Stores inference requests, extracted keywords, recommendations, and confidence.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_symptom_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    symptom_text TEXT NOT NULL,
    extracted_keywords JSONB DEFAULT '[]'::jsonb,
    recommended_department VARCHAR(100) NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    is_emergency BOOLEAN NOT NULL DEFAULT false,
    model_version VARCHAR(50) NOT NULL DEFAULT 'v0.1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_symptom_logs_user ON ai_symptom_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_symptom_logs_dept ON ai_symptom_logs(recommended_department);
CREATE INDEX IF NOT EXISTS idx_ai_symptom_logs_emergency ON ai_symptom_logs(is_emergency);
CREATE INDEX IF NOT EXISTS idx_ai_symptom_logs_created_at ON ai_symptom_logs(created_at);

-- ----------------------------------------------------------------------------
-- 4. AI PREDICTION FEEDBACK TABLE (Module 12 - AI Analytics & Continuous Learning)
-- Collects user or practitioner feedback on symptom triage and recommendations.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_prediction_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES ai_symptom_logs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_accurate BOOLEAN NOT NULL,
    actual_department VARCHAR(100),
    user_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_log ON ai_prediction_feedback(log_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_accuracy ON ai_prediction_feedback(is_accurate);
