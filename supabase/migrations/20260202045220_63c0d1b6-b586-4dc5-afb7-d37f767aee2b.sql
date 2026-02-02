-- Add memory and instructions columns to script_agents if they don't exist
ALTER TABLE public.script_agents 
ADD COLUMN IF NOT EXISTS memory TEXT,
ADD COLUMN IF NOT EXISTS instructions TEXT;