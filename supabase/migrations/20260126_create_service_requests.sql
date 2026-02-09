-- Service Requests Table Migration
-- This table stores guest service requests (Call Waiter, Request Bill, Extra Cutlery)
-- These requests trigger real-time notifications in the merchant dashboard

-- Create the service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('waiter', 'bill', 'cutlery')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_service_requests_restaurant_id ON public.service_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at);

-- Enable Row Level Security
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anyone to insert (guests can create requests without authentication)
CREATE POLICY "Anyone can create service requests" ON public.service_requests
    FOR INSERT WITH CHECK (true);

-- RLS Policy: Allow anyone to read (for simplicity, or restrict to authenticated users)
CREATE POLICY "Anyone can read service requests" ON public.service_requests
    FOR SELECT USING (true);

-- RLS Policy: Allow anyone to update (for merchants to acknowledge/complete)
CREATE POLICY "Anyone can update service requests" ON public.service_requests
    FOR UPDATE USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;

-- Add a comment describing the table
COMMENT ON TABLE public.service_requests IS 'Stores guest service requests like Call Waiter, Request Bill, Extra Cutlery for real-time merchant notifications';
