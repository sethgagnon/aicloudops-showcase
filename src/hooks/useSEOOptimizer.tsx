import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SEOAnalysisRequest {
  url: string;
  title?: string;
  metaDescription?: string;
  content?: string;
  action: 'analyze' | 'suggest' | 'optimize' | 'audit';
  targetKeywords?: string[];
}

interface SEOSuggestion {
  type: string;
  priority: string;
  issue: string;
  suggestion: string;
  impact: string;
}

interface SEOAnalysisResult {
  seoScore?: number;
  titleScore?: number;
  metaDescriptionScore?: number;
  contentScore?: number;
  suggestions?: SEOSuggestion[];
  keywordDensity?: Record<string, number>;
  structuredData?: any;
  optimizedTitle?: string;
  optimizedMetaDescription?: string;
  keywordSuggestions?: string[];
  contentImprovements?: any[];
}

export const useSEOOptimizer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SEOAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeSEO = async (request: SEOAnalysisRequest): Promise<SEOAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('seo-optimizer', {
        body: request
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to analyze SEO');
      }

      if (!data.success) {
        throw new Error(data.error || 'SEO analysis failed');
      }

      const analysisResult = data.data;
      setResult(analysisResult);
      return analysisResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(`SEO analysis failed: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const quickAnalyze = async (content: {
    title: string;
    metaDescription?: string;
    content?: string;
    url?: string;
    keywords?: string[];
  }) => {
    return await analyzeSEO({
      url: content.url || window.location.href,
      title: content.title,
      metaDescription: content.metaDescription,
      content: content.content,
      targetKeywords: content.keywords || [],
      action: 'analyze'
    });
  };

  const getSuggestions = async (content: {
    title: string;
    metaDescription?: string;
    content?: string;
    url?: string;
    keywords?: string[];
  }) => {
    return await analyzeSEO({
      url: content.url || window.location.href,
      title: content.title,
      metaDescription: content.metaDescription,
      content: content.content,
      targetKeywords: content.keywords || [],
      action: 'suggest'
    });
  };

  const optimizeContent = async (content: {
    title: string;
    metaDescription?: string;
    content: string;
    url?: string;
    keywords?: string[];
  }) => {
    return await analyzeSEO({
      url: content.url || window.location.href,
      title: content.title,
      metaDescription: content.metaDescription,
      content: content.content,
      targetKeywords: content.keywords || [],
      action: 'optimize'
    });
  };

  const runAudit = async (content: {
    title: string;
    metaDescription?: string;
    content?: string;
    url?: string;
    keywords?: string[];
  }) => {
    return await analyzeSEO({
      url: content.url || window.location.href,
      title: content.title,
      metaDescription: content.metaDescription,
      content: content.content,
      targetKeywords: content.keywords || [],
      action: 'audit'
    });
  };

  // Utility functions for SEO scoring
  const calculateTitleScore = (title: string): number => {
    if (!title) return 0;
    
    let score = 60; // Base score
    
    // Length check (50-60 characters is optimal)
    if (title.length >= 50 && title.length <= 60) {
      score += 25;
    } else if (title.length >= 40 && title.length <= 70) {
      score += 15;
    } else if (title.length < 30 || title.length > 80) {
      score -= 20;
    }
    
    // Check for power words
    const powerWords = ['ultimate', 'complete', 'guide', 'best', 'top', 'essential', 'advanced', 'expert'];
    const hasPowerWord = powerWords.some(word => title.toLowerCase().includes(word));
    if (hasPowerWord) score += 10;
    
    // Check for numbers
    if (/\d/.test(title)) score += 5;
    
    return Math.min(Math.max(score, 0), 100);
  };

  const calculateMetaScore = (meta: string): number => {
    if (!meta) return 0;
    
    let score = 60; // Base score
    
    // Length check (150-160 characters is optimal)
    if (meta.length >= 150 && meta.length <= 160) {
      score += 30;
    } else if (meta.length >= 130 && meta.length <= 170) {
      score += 20;
    } else if (meta.length < 120 || meta.length > 180) {
      score -= 20;
    }
    
    // Check for call-to-action words
    const ctaWords = ['discover', 'learn', 'find out', 'explore', 'get', 'download'];
    const hasCTA = ctaWords.some(word => meta.toLowerCase().includes(word));
    if (hasCTA) score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  };

  const getKeywordDensity = (content: string, keywords: string[]): Record<string, number> => {
    if (!content || keywords.length === 0) return {};
    
    const wordCount = content.split(/\s+/).length;
    const density: Record<string, number> = {};
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = content.toLowerCase().match(regex) || [];
      const count = matches.length;
      density[keyword] = Math.round((count / wordCount) * 100 * 100) / 100; // 2 decimal places
    });
    
    return density;
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    isLoading,
    result,
    error,
    analyzeSEO,
    quickAnalyze,
    getSuggestions,
    optimizeContent,
    runAudit,
    calculateTitleScore,
    calculateMetaScore,
    getKeywordDensity,
    clearResult
  };
};