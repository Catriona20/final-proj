-- ==========================================================
-- CLINIC ASSISTANT & RECEPTIONIST DATABASE SCHEMA
-- Target Database: PostgreSQL 14+
-- ==========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 150),
    gender VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BUSY', 'OFFLINE')),
    current_patients INT NOT NULL DEFAULT 0 CHECK (current_patients >= 0),
    room_number VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    doctor_name VARCHAR(150) NOT NULL,
    appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    appointment_time VARCHAR(20) NOT NULL,
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'General',
    status VARCHAR(30) NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW')),
    notes TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. QUEUE ENTRIES TABLE
CREATE TABLE IF NOT EXISTS queue_entries (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    queue_number VARCHAR(20) NOT NULL UNIQUE,
    patient_name VARCHAR(150) NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT', 'EMERGENCY')),
    waiting_time INT NOT NULL DEFAULT 0,
    estimated_wait INT NOT NULL DEFAULT 15,
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'IN_CONSULTATION', 'COMPLETED')),
    appointment_id VARCHAR(50) REFERENCES appointments(id) ON DELETE SET NULL,
    walk_in_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. WALK-IN PATIENTS TABLE
CREATE TABLE IF NOT EXISTS walk_ins (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    reason TEXT NOT NULL,
    preferred_doctor VARCHAR(150) NOT NULL,
    registered_at VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'IN_CONSULTATION', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for fast lookup
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON queue_entries(priority);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
