import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, Settings, X } from 'lucide-react';

interface SEOIssue {
  id: string;
  reportId: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  why: string;
  whereField: string;
  whereSelector?: string;
  whereExample?: string;
  currentValue?: string;
  proposedFix: string;
  status: 'OPEN' | 'APPLIED' | 'DISCARDED';
}

interface SEOIssueDrawerProps {
  issue: SEOIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFix: (change: any) => void;
  onUpdateIssue: (issue: SEOIssue) => void;
}

export function SEOIssueDrawer({ 
  issue, 
  open, 
  onOpenChange, 
  onApplyFix, 
  onUpdateIssue 
}: SEOIssueDrawerProps) {
  const [editedFix, setEditedFix] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const { toast } = useToast();

  // Update edited fix when issue changes
  useEffect(() => {
    if (issue) {
      setEditedFix(issue.proposedFix);
    }
  }, [issue]);

  const regenerateFix = async () => {
    if (!issue) return;

    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-analyzer', {
        body: {
          action: 'regenerate',
          issueContext: `${issue.title}: ${issue.why}. Current value: ${issue.currentValue || 'None'}`,
          category: issue.category
        }
      });

      if (error) throw error;

      setEditedFix(data.proposedFix);
      toast({
        title: "Fix Regenerated",
        description: "AI has generated a new suggestion.",
      });

    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to generate new fix suggestion.",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleApplyFix = () => {
    if (!issue) return;

    const change = {
      issueId: issue.id,
      pageId: issue.reportId, // This should be the page ID, not report ID
      field: issue.whereField,
      selector: issue.whereSelector,
      oldValue: issue.currentValue,
      newValue: editedFix,
      category: issue.category,
      title: issue.title
    };

    onApplyFix(change);
  };

  const updateProposedFix = async () => {
    if (!issue || editedFix === issue.proposedFix) return;

    try {
      const { error } = await supabase
        .from('seo_issues')
        .update({ proposed_fix: editedFix })
        .eq('id', issue.id);

      if (error) throw error;

      const updatedIssue = { ...issue, proposedFix: editedFix };
      onUpdateIssue(updatedIssue);

      toast({
        title: "Fix Updated",
        description: "Proposed fix has been saved.",
      });

    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update proposed fix.",
        variant: "destructive",
      });
    }
  };

  if (!issue) return null;

  const severityColors = {
    HIGH: 'destructive',
    MEDIUM: 'secondary',
    LOW: 'outline',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={severityColors[issue.severity] as any}>
                {issue.severity}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {issue.category}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <SheetTitle>{issue.title}</SheetTitle>
          <SheetDescription>{issue.why}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Issue Details */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Location</Label>
              <div className="text-sm text-muted-foreground mt-1">
                <div>Field: <code className="bg-muted px-1 rounded">{issue.whereField}</code></div>
                {issue.whereSelector && (
                  <div>Selector: <code className="bg-muted px-1 rounded">{issue.whereSelector}</code></div>
                )}
                {issue.whereExample && (
                  <div>Example: <span className="italic">{issue.whereExample}</span></div>
                )}
              </div>
            </div>

            {issue.currentValue && (
              <div>
                <Label className="text-sm font-medium">Current Value</Label>
                <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                  "{issue.currentValue}"
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Replacement Text */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Replacement Text</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateFix}
                disabled={regenerating}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground mb-2">
              This is the exact text that will replace the current content when you apply the fix.
            </div>

            <Textarea
              value={editedFix}
              onChange={(e) => setEditedFix(e.target.value)}
              placeholder="Enter the replacement text..."
              rows={4}
              className="resize-none"
            />

            {editedFix !== issue.proposedFix && (
              <Button
                variant="outline"
                size="sm"
                onClick={updateProposedFix}
              >
                Save Changes
              </Button>
            )}
          </div>

            {/* Character Count for specific fields */}
          {(issue.whereField.includes('title') || issue.whereField.includes('description')) && (
            <div className="text-xs">
              <span className="text-muted-foreground">Character count: {editedFix.length}</span>
              {issue.whereField.includes('title') && editedFix.length > 60 && (
                <span className="text-orange-600 ml-2 font-medium">⚠️ Too long (Recommended: 50-60 characters)</span>
              )}
              {issue.whereField.includes('title') && editedFix.length <= 60 && editedFix.length >= 30 && (
                <span className="text-green-600 ml-2">✓ Good length</span>
              )}
              {issue.whereField.includes('description') && editedFix.length > 160 && (
                <span className="text-orange-600 ml-2 font-medium">⚠️ Too long (Recommended: 150-160 characters)</span>
              )}
              {issue.whereField.includes('description') && editedFix.length <= 160 && editedFix.length >= 120 && (
                <span className="text-green-600 ml-2">✓ Good length</span>
              )}
            </div>
          )}
        </div>

        <SheetFooter>
          <div className="flex space-x-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
            <Button 
              onClick={handleApplyFix}
              disabled={issue.status === 'APPLIED'}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              {issue.status === 'APPLIED' ? 'Already Applied' : 'Apply Fix'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}