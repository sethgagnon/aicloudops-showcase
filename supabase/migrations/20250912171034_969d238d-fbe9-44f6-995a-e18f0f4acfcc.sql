-- Step 1: Add the super_admin role to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';