import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ChangeSet {
  issueId: string;
  pageId: string;
  field: string;
  selector?: string;
  oldValue?: string;
  newValue: string;
  category: string;
  title: string;
}

interface SEODiffModalProps {
  change: ChangeSet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (change: ChangeSet) => void;
}

export function SEODiffModal({ change, open, onOpenChange, onConfirm }: SEODiffModalProps) {
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!change) return;

    setApplying(true);
    try {
      // Apply the change to the posts table
      let updateData: any = {};
      
      // Map field names to database columns
      switch (change.field.toLowerCase()) {
        case 'title':
          updateData.title = change.newValue;
          break;
        case 'meta.description':
        case 'meta_description':
        case 'excerpt':
          updateData.excerpt = change.newValue;
          break;
        case 'content':
        case 'body':
          // For content changes, we need to be more careful
          // This is a simplified approach - in real implementation,
          // you might want to use a more sophisticated content replacement
          updateData.content = change.newValue;
          break;
        default:
          // For other fields, we might need to update JSON content or other fields
          // This would need more sophisticated handling based on your schema
          console.warn(`Unsupported field update: ${change.field}`);
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('posts')
          .update(updateData)
          .eq('id', change.pageId);

        if (updateError) throw updateError;
      }

      // Mark the issue as applied
      const { error: issueError } = await supabase
        .from('seo_issues')
        .update({ status: 'APPLIED' })
        .eq('id', change.issueId);

      if (issueError) throw issueError;

      // Record the change in history
      const { error: historyError } = await supabase
        .from('seo_change_history')
        .insert({
          page_id: change.pageId,
          page_type: 'post',
          issue_id: change.issueId,
          field_name: change.field,
          selector: change.selector,
          old_value: change.oldValue,
          new_value: change.newValue,
          diff: `Changed ${change.field} from "${change.oldValue || 'empty'}" to "${change.newValue}"`,
          applied_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (historyError) throw historyError;

      onConfirm(change);
      onOpenChange(false);
      
      toast({
        title: "Fix Applied Successfully",
        description: `Updated ${change.field} for the post.`,
      });

    } catch (error) {
      console.error('Apply fix error:', error);
      toast({
        title: "Failed to Apply Fix",
        description: "An error occurred while applying the SEO fix.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  if (!change) return null;

  const isDestructiveChange = change.field.includes('canonical') || 
                             change.field.includes('robots') || 
                             change.field.includes('noindex');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isDestructiveChange && <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />}
            Confirm SEO Fix Application
          </DialogTitle>
          <DialogDescription>
            Review the changes before applying them to your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Change Summary */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{change.category}</Badge>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm font-medium">{change.title}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Field: <code className="bg-muted px-1 rounded">{change.field}</code>
              {change.selector && (
                <>
                  <span className="mx-2">•</span>
                  Selector: <code className="bg-muted px-1 rounded">{change.selector}</code>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Before/After Comparison */}
          <div className="space-y-4">
            <h4 className="font-medium">Changes Preview</h4>
            
            <div className="grid gap-4">
              {/* Before */}
              <div>
                <div className="flex items-center mb-2">
                  <Badge variant="destructive" className="text-xs">BEFORE</Badge>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-sm">
                  {change.oldValue || <em className="text-muted-foreground">Empty or not set</em>}
                </div>
              </div>

              {/* After */}
              <div>
                <div className="flex items-center mb-2">
                  <Badge variant="default" className="text-xs bg-green-600">AFTER</Badge>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-sm">
                  {change.newValue}
                </div>
              </div>
            </div>

            {/* Character count warnings */}
            {change.field.includes('title') && change.newValue.length > 60 && (
              <div className="text-sm text-orange-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Title length ({change.newValue.length}) exceeds recommended 50-60 characters
              </div>
            )}

            {change.field.includes('description') && change.newValue.length > 160 && (
              <div className="text-sm text-orange-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Description length ({change.newValue.length}) exceeds recommended 150-160 characters
              </div>
            )}
          </div>

          {/* Destructive change warning */}
          {isDestructiveChange && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-orange-800 dark:text-orange-200">
                    Warning: Sensitive SEO Change
                  </div>
                  <div className="text-orange-700 dark:text-orange-300 mt-1">
                    This change affects canonical tags or robots directives, which can impact search engine indexing. 
                    Please review carefully before proceeding.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={applying}
            variant={isDestructiveChange ? "destructive" : "default"}
          >
            {applying ? "Applying..." : "Apply Fix"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}