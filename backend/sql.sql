-- Create Database
CREATE DATABASE lfgdb;

-- Connect to database
\c lfgdb;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Verification Codes Table
CREATE TABLE verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(6) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Reset Codes Table
CREATE TABLE reset_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Dorms Table
CREATE TABLE dorms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    available BOOLEAN DEFAULT true,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Bookings Table
-- Create Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    dorm_id INTEGER REFERENCES dorms(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    confirmation_number VARCHAR(8) UNIQUE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'active', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
    payment_deadline TIMESTAMP WITH TIME ZONE,
    semester VARCHAR(1) CHECK (semester IN ('1', '2')),
    academic_year VARCHAR(4) NOT NULL,
    room_number VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Reviews Table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    dorm_id INTEGER REFERENCES dorms(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Better Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_dorm_id ON bookings(dorm_id);
CREATE INDEX idx_bookings_confirmation ON bookings(confirmation_number);
CREATE INDEX idx_reviews_dorm_id ON reviews(dorm_id);

-- Insert Default Admin User (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role, verified) 
VALUES (
    'admin@bookit.com',
    '$2a$10$6KlPkMz7Ywf6.6qhapP1p.jkRz3KR9Ay4TF1QA8MjzXhGY4zTEif.',  -- hashed password for 'admin123'
    'Admin',
    'User',
    'admin',
    true
);

-- Insert Sample Dorms
INSERT INTO dorms (name, description, capacity, price_per_night, available) 
VALUES 
    ('Sunshine Dorm', 'Bright and spacious rooms with modern amenities', 2, 500.00, true),
    ('Moonlight Hall', 'Quiet and comfortable accommodation for focused students', 1, 450.00, true),
    ('Star Lodge', 'Premium single rooms with private bathrooms', 1, 600.00, true);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at columns and triggers to relevant tables
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE dorms ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_dorms_timestamp
    BEFORE UPDATE ON dorms
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_bookings_timestamp
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Grant appropriate permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_username;