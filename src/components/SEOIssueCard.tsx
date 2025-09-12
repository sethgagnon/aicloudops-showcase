import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle, Settings } from 'lucide-react';

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

interface SEOIssueCardProps {
  issue: SEOIssue;
  onClick: () => void;
  showApplyButton?: boolean;
  onApply?: () => void;
}

const severityColors = {
  HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
  MEDIUM: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export function SEOIssueCard({ issue, onClick, showApplyButton = false, onApply }: SEOIssueCardProps) {
  const isApplied = issue.status === 'APPLIED';

  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
        isApplied ? 'bg-green-500/10 border-green-500/20' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={isApplied ? 'bg-green-500/10 text-green-600 border-green-500/20' : severityColors[issue.severity]}
              >
                {isApplied ? 'APPLIED' : issue.severity}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {issue.category}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium text-sm flex items-center">
                {isApplied && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                {issue.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {issue.why}
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Location:</span>
                <span>{issue.whereField}</span>
                {issue.whereSelector && (
                  <span className="text-primary">({issue.whereSelector})</span>
                )}
              </div>
              
              {issue.currentValue && (
                <div className="mt-1">
                  <span className="font-medium">Current:</span>
                  <span className="ml-1 italic">
                    "{issue.currentValue.length > 50 
                      ? issue.currentValue.substring(0, 50) + '...' 
                      : issue.currentValue}"
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {showApplyButton && !isApplied && onApply && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply();
                }}
                className="text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Apply Fix
              </Button>
            )}
            
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}