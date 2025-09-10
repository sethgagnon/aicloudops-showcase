-- Create SEO analysis and tracking tables
CREATE TABLE public.seo_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  content TEXT,
  seo_score INTEGER DEFAULT 0,
  title_score INTEGER DEFAULT 0,
  meta_description_score INTEGER DEFAULT 0,
  content_score INTEGER DEFAULT 0,
  keyword_density JSONB DEFAULT '{}'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  structured_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id)
);

-- Create keyword tracking table
CREATE TABLE public.keyword_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER,
  search_volume INTEGER,
  difficulty_score INTEGER DEFAULT 0,
  opportunity_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tracked_by UUID REFERENCES auth.users(id)
);

-- Create content suggestions table
CREATE TABLE public.content_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'title', 'meta_description', 'content', 'keywords', 'structure'
  original_text TEXT,
  suggested_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'applied', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.seo_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage SEO analysis" 
ON public.seo_analysis 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage keyword tracking" 
ON public.keyword_tracking 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage content suggestions" 
ON public.content_suggestions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for timestamp updates
CREATE TRIGGER update_seo_analysis_updated_at
BEFORE UPDATE ON public.seo_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_keyword_tracking_updated_at
BEFORE UPDATE ON public.keyword_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_seo_analysis_url ON public.seo_analysis(url);
CREATE INDEX idx_seo_analysis_score ON public.seo_analysis(seo_score DESC);
CREATE INDEX idx_keyword_tracking_keyword ON public.keyword_tracking(keyword);
CREATE INDEX idx_content_suggestions_post_id ON public.content_suggestions(post_id);
CREATE INDEX idx_content_suggestions_status ON public.content_suggestions(status);