-- ============================================================================
-- Migration: 003_pharmacy_inventory_intelligence.sql
-- Description: Adds safety_stock and supplier_lead_time_days columns to medicines
--              table for Module 11 inventory intelligence & reorder planning.
-- PostgreSQL Version: >= 14
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD INVENTORY PLANNING COLUMNS TO MEDICINES TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE medicines 
    ADD COLUMN IF NOT EXISTS safety_stock INTEGER NOT NULL DEFAULT 30 CHECK (safety_stock >= 0),
    ADD COLUMN IF NOT EXISTS supplier_lead_time_days INTEGER NOT NULL DEFAULT 7 CHECK (supplier_lead_time_days > 0);

-- Index for optimizing stock health evaluations and low stock / safety threshold queries
CREATE INDEX IF NOT EXISTS idx_medicines_reorder_safety ON medicines(reorder_threshold, safety_stock);
