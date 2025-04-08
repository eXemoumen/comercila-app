-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    supermarket_id UUID NOT NULL REFERENCES supermarkets(id),
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    payment_date TIMESTAMP WITH TIME ZONE,
    payments JSONB DEFAULT '[]'::jsonb,
    remaining_amount DECIMAL(10,2),
    order_id UUID REFERENCES orders(id),
    cartons INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_history table
CREATE TABLE IF NOT EXISTS stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    quantity INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('added', 'removed', 'adjusted', 'in', 'out')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    supermarket_id UUID NOT NULL REFERENCES supermarkets(id),
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'cancelled')),
    cartons INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supermarkets table
CREATE TABLE IF NOT EXISTS supermarkets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    location JSONB NOT NULL,
    total_sales INTEGER DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create current_stock table
CREATE TABLE IF NOT EXISTS current_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial current stock if not exists
INSERT INTO current_stock (id, quantity)
VALUES ('00000000-0000-0000-0000-000000000000', 0)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_stock ENABLE ROW LEVEL SECURITY;

-- Create policies for sales
CREATE POLICY "Enable read access for all users" ON sales FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for stock_history
CREATE POLICY "Enable read access for all users" ON stock_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON stock_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for orders
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON orders FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for supermarkets
CREATE POLICY "Enable read access for all users" ON supermarkets FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON supermarkets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for current_stock
CREATE POLICY "Enable read access for all users" ON current_stock FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON current_stock FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON current_stock FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supermarkets_updated_at
    BEFORE UPDATE ON supermarkets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_current_stock_updated_at
    BEFORE UPDATE ON current_stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 