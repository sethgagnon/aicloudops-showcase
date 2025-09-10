import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Eye, Edit, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SEOFixPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: {
    url: string;
    title: string;
    meta_description?: string;
    content: string;
    suggestions: Array<{
      type: string;
      priority: string;
      issue: string;
      suggestion: string;
      impact: string;
    }>;
  };
  postId?: string;
  onFixesApplied?: () => void;
}

interface OptimizedContent {
  optimizedTitle: string;
  optimizedMetaDescription: string;
  optimizedContent: string;
  appliedFixes: Array<{
    type: string;
    originalIssue: string;
    appliedFix: string;
    expectedImpact: string;
  }>;
}

const SEOFixPreview = ({ open, onOpenChange, analysis, postId, onFixesApplied }: SEOFixPreviewProps) => {
  const [optimizedContent, setOptimizedContent] = useState<OptimizedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const generateOptimizedContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'get-optimized-content',
          url: analysis.url,
          title: analysis.title,
          metaDescription: analysis.meta_description,
          content: analysis.content,
          suggestions: analysis.suggestions
        }
      });

      if (error) throw error;

      if (data.success) {
        setOptimizedContent(data.data);
      } else {
        throw new Error(data.error || 'Failed to generate optimized content');
      }
    } catch (error) {
      console.error('Error generating optimized content:', error);
      toast.error('Failed to generate optimized content: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyFixes = async () => {
    if (!optimizedContent) return;

    setIsApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'apply-fixes',
          url: analysis.url,
          title: analysis.title,
          metaDescription: analysis.meta_description,
          content: analysis.content,
          suggestions: analysis.suggestions,
          postId: postId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.data.message);
        onFixesApplied?.();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Failed to apply fixes');
      }
    } catch (error) {
      console.error('Error applying fixes:', error);
      toast.error('Failed to apply fixes: ' + error.message);
    } finally {
      setIsApplying(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            SEO Fix Preview & Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Issues Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Issues to Fix ({analysis.suggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {analysis.suggestions
                  .sort((a, b) => {
                    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
                    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
                           (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
                  })
                  .map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge variant={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">{suggestion.issue}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                      <p className="text-xs text-muted-foreground">Impact: {suggestion.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate/Preview Optimized Content */}
          {!optimizedContent ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="mb-4 text-muted-foreground">
                  Generate AI-optimized content that addresses all identified issues
                </p>
                <Button 
                  onClick={generateOptimizedContent} 
                  disabled={isGenerating}
                  className="w-full max-w-sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Generating Optimized Content...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="comparison" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comparison">Before & After</TabsTrigger>
                <TabsTrigger value="fixes">Applied Fixes</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="space-y-4">
                {/* Title Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Title</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded bg-red-50 dark:bg-red-950/20">
                      <p className="text-sm font-mono text-red-800 dark:text-red-200">
                        Before: {analysis.title}
                      </p>
                    </div>
                    <div className="p-3 border rounded bg-green-50 dark:bg-green-950/20">
                      <p className="text-sm font-mono text-green-800 dark:text-green-200">
                        After: {optimizedContent.optimizedTitle}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Meta Description Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Meta Description</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded bg-red-50 dark:bg-red-950/20">
                      <p className="text-sm font-mono text-red-800 dark:text-red-200">
                        Before: {analysis.meta_description || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border rounded bg-green-50 dark:bg-green-950/20">
                      <p className="text-sm font-mono text-green-800 dark:text-green-200">
                        After: {optimizedContent.optimizedMetaDescription}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content (First 500 characters)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded bg-red-50 dark:bg-red-950/20">
                      <p className="text-sm font-mono text-red-800 dark:text-red-200">
                        Before: {analysis.content.substring(0, 500)}...
                      </p>
                    </div>
                    <div className="p-3 border rounded bg-green-50 dark:bg-green-950/20">
                      <p className="text-sm font-mono text-green-800 dark:text-green-200">
                        After: {optimizedContent.optimizedContent.substring(0, 500)}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fixes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Applied Fixes ({optimizedContent.appliedFixes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {optimizedContent.appliedFixes.map((fix, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <Badge variant="outline">{fix.type}</Badge>
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Issue:</strong> {fix.originalIssue}
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Fix Applied:</strong> {fix.appliedFix}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            <strong>Expected Impact:</strong> {fix.expectedImpact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {optimizedContent && (
            <Button 
              onClick={applyFixes} 
              disabled={isApplying}
              className="flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Applying Fixes...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Apply SEO Fixes
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SEOFixPreview;