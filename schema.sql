-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS supermarkets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    email TEXT NULL,
    phone_numbers JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    supermarket_id UUID NOT NULL REFERENCES supermarkets(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    quantity INTEGER NOT NULL,
    cartons INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP WITH TIME ZONE NULL,
    payment_note TEXT NULL,
    expected_payment_date TIMESTAMP WITH TIME ZONE NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    from_order BOOLEAN DEFAULT FALSE,
    note TEXT NULL,
    fragrance_distribution JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    supermarket_id UUID NOT NULL REFERENCES supermarkets(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'cancelled')),
    price_per_unit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_history (
    id TEXT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    quantity INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('added', 'removed', 'adjusted')),
    reason TEXT NOT NULL,
    current_stock INTEGER NOT NULL,
    fragrance_distribution JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS fragrance_stock (
    fragrance_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_stock ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing public access for testing - you can restrict this later)
CREATE POLICY "Enable all access for all users" ON supermarkets
    FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON sales
    FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON orders
    FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON payments
    FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON stock_history
    FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON fragrance_stock
    FOR ALL USING (true); 