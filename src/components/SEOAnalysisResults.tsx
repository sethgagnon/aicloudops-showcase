import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEOIssueCard } from '@/components/SEOIssueCard';
import { AlertTriangle, AlertCircle, Info, Target } from 'lucide-react';

interface SEOReport {
  id: string;
  pageId: string;
  pageType: 'post' | 'page';
  url: string;
  title: string;
  generatedAt: string;
  summary: {
    counts: {
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
  };
}

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

interface SEOAnalysisResultsProps {
  report: SEOReport;
  issues: SEOIssue[];
  onIssueClick: (issue: SEOIssue) => void;
  showApplyButtons?: boolean;
}

const severityConfig = {
  HIGH: {
    icon: AlertTriangle,
    color: 'destructive',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    label: 'High Priority'
  },
  MEDIUM: {
    icon: AlertCircle,
    color: 'secondary',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600',
    label: 'Medium Priority'
  },
  LOW: {
    icon: Info,
    color: 'outline',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    label: 'Low Priority'
  }
} as const;

export function SEOAnalysisResults({ 
  report, 
  issues, 
  onIssueClick, 
  showApplyButtons = false 
}: SEOAnalysisResultsProps) {
  const groupedIssues = {
    HIGH: issues.filter(issue => issue.severity === 'HIGH' && issue.status === 'OPEN'),
    MEDIUM: issues.filter(issue => issue.severity === 'MEDIUM' && issue.status === 'OPEN'),
    LOW: issues.filter(issue => issue.severity === 'LOW' && issue.status === 'OPEN'),
  };

  const appliedIssues = issues.filter(issue => issue.status === 'APPLIED');

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            SEO Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {issues.filter(i => i.status === 'OPEN').length}
              </div>
              <div className="text-sm text-muted-foreground">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {report.summary.counts.HIGH}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {report.summary.counts.MEDIUM}
              </div>
              <div className="text-sm text-muted-foreground">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {report.summary.counts.LOW}
              </div>
              <div className="text-sm text-muted-foreground">Low Priority</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <div>Page: {report.title}</div>
              <div>URL: {report.url}</div>
              <div>Analyzed: {new Date(report.generatedAt).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues by Severity */}
      {(['HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => {
        const severityIssues = groupedIssues[severity];
        if (severityIssues.length === 0) return null;

        const config = severityConfig[severity];
        const Icon = config.icon;

        return (
          <Card key={severity} className={config.bgColor}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon className={`h-5 w-5 mr-2 ${config.textColor}`} />
                <span className={config.textColor}>{config.label}</span>
                <Badge variant={config.color as any} className="ml-2">
                  {severityIssues.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {severityIssues.map((issue) => (
                  <SEOIssueCard
                    key={issue.id}
                    issue={issue}
                    onClick={() => onIssueClick(issue)}
                    showApplyButton={showApplyButtons}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Applied Issues */}
      {appliedIssues.length > 0 && (
        <Card className="bg-green-500/10">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Target className="h-5 w-5 mr-2" />
              Applied Fixes
              <Badge variant="outline" className="ml-2 border-green-600 text-green-600">
                {appliedIssues.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appliedIssues.map((issue) => (
                <SEOIssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick(issue)}
                  showApplyButton={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {issues.filter(i => i.status === 'OPEN').length === 0 && appliedIssues.length > 0 && (
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-6 text-center">
            <div className="text-green-600 font-medium text-lg mb-2">
              🎉 All Issues Resolved!
            </div>
            <div className="text-sm text-muted-foreground">
              Great job! You've addressed all the SEO issues for this page.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}