-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. TENANTS (RESTAURANTS) TABLE
-- Stores configuration and credentials per restaurant
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'burger-shack'
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Integration Settings (Encrypted JSON if possible, or extensive columns)
    settings JSONB DEFAULT '{}'::jsonb,
    -- Example structure for settings:
    -- {
    --   "slack_webhook": "...",
    --   "printer_ip": "192.168.1.100",
    --   "manager_phone": "+251911..."
    -- }
    
    api_key VARCHAR(255) UNIQUE NOT NULL -- For external calls to verifying tenant
);

-- Index for fast lookup by slug (subdomain) or API key
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_api_key ON tenants(api_key);

-- --------------------------------------------------------
-- 2. ORDERS TABLE (MULTI-TENANT)
-- All orders from all 500+ restaurants live here
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS global_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    external_order_id VARCHAR(100), -- Order ID from the frontend/app
    table_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent_to_kitchen, completed, failed
    
    items JSONB NOT NULL, -- Full snapshot of items ordered
    total_amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'ETB',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partitioning (Optional but Recommended for 500+ Rests)
-- Real production usage might require partitioning by tenant_id or date
CREATE INDEX idx_orders_tenant ON global_orders(tenant_id);
CREATE INDEX idx_orders_status ON global_orders(status);

-- --------------------------------------------------------
-- 3. LOGS / AUDIT TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    workflow_id VARCHAR(255),
    execution_id VARCHAR(255),
    status VARCHAR(50), -- success, error
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
