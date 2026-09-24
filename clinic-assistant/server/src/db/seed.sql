-- ==========================================================
-- CLINIC ASSISTANT SEED DATA
-- ==========================================================

-- Clean existing data
TRUNCATE TABLE queue_entries, appointments, walk_ins, patients, doctors CASCADE;

-- Insert Doctors
INSERT INTO doctors (id, name, specialization, status, current_patients, room_number) VALUES
('doc-1', 'Dr. Sarah Lee', 'General Medicine', 'AVAILABLE', 0, 'Room 101'),
('doc-2', 'Dr. Kumar', 'Cardiology', 'BUSY', 2, 'Room 104'),
('doc-3', 'Dr. Ahmed', 'Pediatrics', 'AVAILABLE', 1, 'Room 102'),
('doc-4', 'Dr. John Wilson', 'Dermatology', 'OFFLINE', 0, 'Room 205'),
('doc-5', 'Dr. Elena Rostova', 'Orthopedics', 'AVAILABLE', 0, 'Room 108'),
('doc-6', 'Dr. Marcus Vance', 'Neurology', 'AVAILABLE', 1, 'Room 201'),
('doc-7', 'Dr. Clara Chen', 'Ophthalmology', 'BUSY', 1, 'Room 106');

-- Insert Patients
INSERT INTO patients (id, name, phone, age, gender) VALUES
('pat-1', 'John Smith', '+1 (555) 234-5678', 42, 'Male'),
('pat-2', 'Emily Davis', '+1 (555) 876-5432', 29, 'Female'),
('pat-3', 'Michael Brown', '+1 (555) 345-6789', 55, 'Male'),
('pat-4', 'Olivia Wilson', '+1 (555) 987-6543', 34, 'Female'),
('pat-5', 'James Taylor', '+1 (555) 456-7890', 61, 'Male'),
('pat-6', 'Sophia Martinez', '+1 (555) 654-3210', 25, 'Female'),
('pat-7', 'Robert Brown', '+1 (555) 789-0123', 48, 'Male'),
('pat-8', 'Sarah Miller', '+1 (555) 890-1234', 38, 'Female'),
('pat-9', 'David Clark', '+1 (555) 123-9876', 50, 'Male'),
('pat-10', 'Emma Watson', '+1 (555) 234-8765', 31, 'Female');

-- Insert Appointments
INSERT INTO appointments (id, patient_id, patient_name, doctor_id, doctor_name, appointment_time, appointment_type, status) VALUES
('apt-1', 'pat-1', 'John Smith', 'doc-1', 'Dr. Sarah Lee', '09:00 AM', 'General', 'COMPLETED'),
('apt-2', 'pat-2', 'Emily Davis', 'doc-2', 'Dr. Kumar', '09:30 AM', 'Follow-up', 'CHECKED_IN'),
('apt-3', 'pat-3', 'Michael Brown', 'doc-1', 'Dr. Sarah Lee', '10:00 AM', 'General', 'WAITING'),
('apt-4', 'pat-4', 'Olivia Wilson', 'doc-3', 'Dr. Ahmed', '10:30 AM', 'Consultation', 'BOOKED'),
('apt-5', 'pat-5', 'James Taylor', 'doc-2', 'Dr. Kumar', '11:00 AM', 'Follow-up', 'NO_SHOW'),
('apt-6', 'pat-6', 'Sophia Martinez', 'doc-5', 'Dr. Elena Rostova', '11:30 AM', 'Routine Checkup', 'BOOKED'),
('apt-7', 'pat-9', 'David Clark', 'doc-6', 'Dr. Marcus Vance', '01:00 PM', 'Consultation', 'BOOKED'),
('apt-8', 'pat-10', 'Emma Watson', 'doc-7', 'Dr. Clara Chen', '01:30 PM', 'Eye Exam', 'BOOKED');

-- Insert Queue Entries
INSERT INTO queue_entries (id, queue_number, patient_name, doctor_name, priority, waiting_time, estimated_wait, status, appointment_id) VALUES
('q-1', 'A001', 'John Smith', 'Dr. Kumar', 'NORMAL', 5, 10, 'WAITING', 'apt-1'),
('q-2', 'A002', 'Emily Davis', 'Dr. Lee', 'NORMAL', 12, 18, 'WAITING', 'apt-2'),
('q-3', 'E001', 'Robert Brown', 'Dr. Ahmed', 'EMERGENCY', 2, 0, 'WAITING', NULL),
('q-4', 'A003', 'Olivia Wilson', 'Dr. Kumar', 'NORMAL', 20, 25, 'WAITING', 'apt-4');

-- Insert Walk-ins
INSERT INTO walk_ins (id, patient_name, phone, reason, preferred_doctor, registered_at, status) VALUES
('w-1', 'Robert Brown', '+1 (555) 789-0123', 'Fever and sudden dizziness', 'Dr. Ahmed', '10:15 AM', 'WAITING'),
('w-2', 'Sarah Miller', '+1 (555) 890-1234', 'General consultation & prescription refill', 'Dr. Sarah Lee', '10:32 AM', 'WAITING'),
('w-3', 'Lucas Gray', '+1 (555) 321-7654', 'Minor sprain on left wrist', 'Dr. Elena Rostova', '10:45 AM', 'WAITING');
