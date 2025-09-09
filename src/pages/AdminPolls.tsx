import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Bot, Calendar, Users, Trash2, Play, Pause, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: string[] | any;
  total_votes: number;
  status: string;
  week_of: string;
  created_at: string;
  ai_generated: boolean;
}

const AdminPolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAdminAccess();
    fetchPolls();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id);

    const isAdmin = userRoles?.some(role => role.role === 'admin');
    if (!isAdmin) {
      navigate('/');
      return;
    }
  };

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolls(data || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast({
        title: "Error",
        description: "Failed to load polls",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyPoll = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-poll');

      if (error) throw error;

      toast({
        title: "Poll Generated",
        description: "AI-generated poll created successfully!",
      });

      await fetchPolls();
    } catch (error: any) {
      console.error('Error generating poll:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate poll",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const updatePollStatus = async (pollId: string, newStatus: string) => {
    try {
      // If setting to live, close any other live polls first
      if (newStatus === 'live') {
        await supabase
          .from('polls')
          .update({ status: 'closed' })
          .eq('status', 'live');
      }

      const { error } = await supabase
        .from('polls')
        .update({ status: newStatus })
        .eq('id', pollId);

      if (error) throw error;

      toast({
        title: "Poll Updated",
        description: `Poll ${newStatus === 'live' ? 'published' : 'status updated'} successfully`,
      });

      await fetchPolls();
    } catch (error) {
      console.error('Error updating poll:', error);
      toast({
        title: "Error",
        description: "Failed to update poll status",
        variant: "destructive"
      });
    }
  };

  const deletePoll = async (pollId: string) => {
    try {
      // First delete associated votes
      await supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', pollId);

      // Then delete the poll
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;

      toast({
        title: "Poll Deleted",
        description: "Poll and associated votes deleted successfully",
      });

      await fetchPolls();
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast({
        title: "Error",
        description: "Failed to delete poll",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-success text-success-foreground';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'closed': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading polls...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const draftPolls = polls.filter(p => p.status === 'draft');
  const livePolls = polls.filter(p => p.status === 'live');
  const closedPolls = polls.filter(p => p.status === 'closed');

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Admin - Manage Polls"
        description="Admin dashboard for managing weekly AI and cloud computing polls"
      />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Manage Polls
            </h1>
            <p className="text-xl text-muted-foreground">
              Generate AI-powered polls and manage weekly community engagement
            </p>
          </div>
          <Button 
            onClick={generateWeeklyPoll}
            disabled={generating}
            className="gradient-hero"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Poll
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Polls</p>
                  <p className="text-2xl font-bold text-foreground">{polls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Play className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Live</p>
                  <p className="text-2xl font-bold text-foreground">{livePolls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <Pause className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-foreground">{draftPolls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Closed</p>
                  <p className="text-2xl font-bold text-foreground">{closedPolls.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Polls List */}
        <div className="space-y-6">
          {polls.length === 0 ? (
            <Card className="card-elegant">
              <CardContent className="text-center py-12">
                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Polls Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate your first AI-powered poll to get started
                </p>
                <Button onClick={generateWeeklyPoll} disabled={generating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate First Poll
                </Button>
              </CardContent>
            </Card>
          ) : (
            polls.map((poll) => (
              <Card key={poll.id} className="card-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(poll.status)}>
                        {poll.status}
                      </Badge>
                      {poll.ai_generated && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(poll.week_of)}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{poll.title}</CardTitle>
                  {poll.description && (
                    <CardDescription>{poll.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {poll.options.map((option, index) => (
                      <div key={index} className="p-2 bg-muted/50 rounded-md text-sm">
                        {index + 1}. {option}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {poll.total_votes} votes
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2">
                    {poll.status === 'draft' && (
                      <Button 
                        onClick={() => updatePollStatus(poll.id, 'live')}
                        variant="default"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Publish Poll
                      </Button>
                    )}
                    
                    {poll.status === 'live' && (
                      <Button 
                        onClick={() => updatePollStatus(poll.id, 'closed')}
                        variant="secondary"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Close Poll
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Poll</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this poll? This action cannot be undone and will also delete all associated votes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deletePoll(poll.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Poll
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPolls;