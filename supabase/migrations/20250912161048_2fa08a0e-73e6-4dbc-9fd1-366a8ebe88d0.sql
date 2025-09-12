-- Create SEO reports table
CREATE TABLE public.seo_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('post', 'page')),
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_by UUID NOT NULL,
  summary JSONB NOT NULL DEFAULT '{"counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SEO issues table
CREATE TABLE public.seo_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.seo_reports(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  why TEXT NOT NULL,
  where_field TEXT NOT NULL,
  where_selector TEXT,
  where_example TEXT,
  current_value TEXT,
  proposed_fix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'APPLIED', 'DISCARDED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SEO change history table
CREATE TABLE public.seo_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('post', 'page')),
  issue_id UUID REFERENCES public.seo_issues(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  selector TEXT,
  old_value TEXT,
  new_value TEXT NOT NULL,
  diff TEXT,
  applied_by UUID NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  can_undo BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_change_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seo_reports
CREATE POLICY "Admins can manage SEO reports" 
ON public.seo_reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for seo_issues
CREATE POLICY "Admins can manage SEO issues" 
ON public.seo_issues 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for seo_change_history
CREATE POLICY "Admins can manage SEO change history" 
ON public.seo_change_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX idx_seo_reports_page_id ON public.seo_reports(page_id);
CREATE INDEX idx_seo_reports_generated_at ON public.seo_reports(generated_at DESC);
CREATE INDEX idx_seo_issues_report_id ON public.seo_issues(report_id);
CREATE INDEX idx_seo_issues_severity ON public.seo_issues(severity);
CREATE INDEX idx_seo_issues_status ON public.seo_issues(status);
CREATE INDEX idx_seo_change_history_page_id ON public.seo_change_history(page_id);
CREATE INDEX idx_seo_change_history_applied_at ON public.seo_change_history(applied_at DESC);

-- Create trigger for updated_at columns
CREATE TRIGGER update_seo_reports_updated_at
BEFORE UPDATE ON public.seo_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_issues_updated_at
BEFORE UPDATE ON public.seo_issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();