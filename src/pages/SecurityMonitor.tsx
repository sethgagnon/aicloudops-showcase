import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Shield, AlertTriangle, Eye, Clock, User, Activity } from 'lucide-react';

interface SecurityIncident {
  incident_time: string;
  user_id: string;
  action: string;
  failure_reason: string;
  incident_count: number;
}

interface SecurityAudit {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  success: boolean;
  failure_reason: string;
  created_at: string;
}

const SecurityMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [recentAudits, setRecentAudits] = useState<SecurityAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    blockedAttempts: 0,
    successfulAccess: 0,
    rateLimit: 0
  });

  useEffect(() => {
    if (user) {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch security incidents
      const { data: incidentsData, error: incidentsError } = await supabase
        .rpc('get_security_incidents');

      if (incidentsError) {
        throw incidentsError;
      }

      // Fetch recent audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('contact_security_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (auditError) {
        throw auditError;
      }

      setIncidents(incidentsData || []);
      setRecentAudits(auditData || []);

      // Calculate statistics
      const stats = {
        totalIncidents: incidentsData?.length || 0,
        blockedAttempts: auditData?.filter(a => !a.success).length || 0,
        successfulAccess: auditData?.filter(a => a.success && a.action.includes('view')).length || 0,
        rateLimit: auditData?.filter(a => a.failure_reason?.includes('Rate limit')).length || 0
      };
      setStats(stats);

    } catch (error: any) {
      console.error('Security monitor error:', error);
      toast({
        title: "Error loading security data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (failureReason: string) => {
    if (failureReason?.includes('Rate limit') || failureReason?.includes('suspicious')) {
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    }
    if (failureReason?.includes('Insufficient privileges')) {
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    }
    return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Security Monitor</h1>
              <p className="text-muted-foreground">Contact form and data access security monitoring</p>
            </div>
          </div>

          {/* Security Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Incidents</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalIncidents}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked Attempts</p>
                  <p className="text-2xl font-bold text-foreground">{stats.blockedAttempts}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Successful Access</p>
                  <p className="text-2xl font-bold text-foreground">{stats.successfulAccess}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rate Limited</p>
                  <p className="text-2xl font-bold text-foreground">{stats.rateLimit}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Security Incidents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card-elegant">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Security Incidents (Last 30 Days)
                </h2>
              </div>
              
              <div className="p-6">
                {incidents.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">No security incidents detected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incidents.slice(0, 10).map((incident, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.failure_reason)}`}>
                            {incident.action}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {incident.incident_count} attempts
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-1">{incident.failure_reason}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(incident.incident_time)}
                          </span>
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {incident.user_id ? incident.user_id.slice(0, 8) + '...' : 'Anonymous'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card-elegant">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Security Activity
                </h2>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                {recentAudits.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAudits.map((audit) => (
                      <div key={audit.id} className="border-l-4 border-l-primary/20 pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {audit.action.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            {audit.success ? (
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(audit.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        {audit.failure_reason && (
                          <p className="text-xs text-red-600 mb-1">{audit.failure_reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          User: {audit.user_id ? audit.user_id.slice(0, 8) + '...' : 'System'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={fetchSecurityData}
              className="btn-outline inline-flex items-center"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh Security Data
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SecurityMonitor;