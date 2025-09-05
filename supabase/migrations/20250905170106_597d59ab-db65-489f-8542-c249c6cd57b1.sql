-- Create contacts table for form submissions
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact forms (public form)
CREATE POLICY "Anyone can submit contact forms" 
ON public.contacts 
FOR INSERT 
WITH CHECK (true);

-- Only authenticated users (admin) can view contacts
CREATE POLICY "Only authenticated users can view contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only authenticated users (admin) can update contact status
CREATE POLICY "Only authenticated users can update contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();