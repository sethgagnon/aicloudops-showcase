import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, BarChart3, Play, Pause, Clock, Users, ArrowLeft, Linkedin, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Poll {
  id: string;
  title: string;
  description?: string;
  options: Array<{
    text: string;
    votes: number;
  }>;
  status: 'draft' | 'live' | 'closed';
  total_votes: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  linkedin_posted_at?: string;
  linkedin_post_id?: string;
}

interface PollFormData {
  title: string;
  description: string;
  options: string[];
  expires_at?: string;
}

const Polls = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [formData, setFormData] = useState<PollFormData>({
    title: '',
    description: '',
    options: ['', ''],
    expires_at: ''
  });
  const [generatingPoll, setGeneratingPoll] = useState(false);
  const [postingToLinkedIn, setPostingToLinkedIn] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPolls();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedPolls = (data || []).map(poll => ({
        ...poll,
        options: Array.isArray(poll.options) ? poll.options as Array<{text: string; votes: number}> : []
      })) as Poll[];

      setPolls(mappedPolls);
    } catch (error: any) {
      toast({
        title: "Error fetching polls",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      options: ['', ''],
      expires_at: ''
    });
    setEditingPoll(null);
  };

  const handleCreatePoll = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleEditPoll = (poll: Poll) => {
    setFormData({
      title: poll.title,
      description: poll.description || '',
      options: poll.options.map(opt => opt.text),
      expires_at: poll.expires_at ? format(new Date(poll.expires_at), "yyyy-MM-dd'T'HH:mm") : ''
    });
    setEditingPoll(poll);
    setShowCreateDialog(true);
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const generateWithAI = async () => {
    setGeneratingPoll(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-poll', {
        body: { topic: formData.title || 'a relevant topic for professionals' }
      });

      if (error) throw error;

      const { title, description, options } = data;
      setFormData(prev => ({
        ...prev,
        title,
        description,
        options
      }));

      toast({
        title: "Poll generated!",
        description: "AI has generated poll content based on your topic."
      });
    } catch (error: any) {
      toast({
        title: "Error generating poll",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGeneratingPoll(false);
    }
  };

  const savePoll = async () => {
    if (!formData.title.trim() || formData.options.filter(opt => opt.trim()).length < 2) {
      toast({
        title: "Invalid poll data",
        description: "Please provide a title and at least 2 options.",
        variant: "destructive"
      });
      return;
    }

    try {
      const pollOptions = formData.options
        .filter(opt => opt.trim())
        .map(text => ({ text: text.trim(), votes: 0 }));

      const pollData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        options: pollOptions,
        expires_at: formData.expires_at || null,
        created_by: user?.id
      };

      let result;
      if (editingPoll) {
        result = await supabase
          .from('polls')
          .update(pollData)
          .eq('id', editingPoll.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('polls')
          .insert(pollData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await fetchPolls();
      setShowCreateDialog(false);
      resetForm();

      toast({
        title: editingPoll ? "Poll updated" : "Poll created",
        description: `The poll has been successfully ${editingPoll ? 'updated' : 'created'}.`
      });
    } catch (error: any) {
      toast({
        title: `Error ${editingPoll ? 'updating' : 'creating'} poll`,
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updatePollStatus = async (pollId: string, status: 'draft' | 'live' | 'closed') => {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ status })
        .eq('id', pollId);

      if (error) throw error;

      await fetchPolls();
      
      toast({
        title: "Poll status updated",
        description: `Poll is now ${status}.`
      });
    } catch (error: any) {
      toast({
        title: "Error updating poll",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;

      setPolls(polls.filter(poll => poll.id !== pollId));
      
      toast({
        title: "Poll deleted",
        description: "The poll has been successfully deleted."
      });
    } catch (error: any) {
      toast({
        title: "Error deleting poll",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const postToLinkedIn = async (poll: Poll) => {
    setPostingToLinkedIn(poll.id);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-post', {
        body: {
          pollId: poll.id,
          title: poll.title,
          description: poll.description,
          options: poll.options.map(opt => opt.text)
        }
      });

      if (error) throw error;

      await fetchPolls();
      
      toast({
        title: "Posted to LinkedIn!",
        description: "Your poll has been successfully posted to LinkedIn."
      });
    } catch (error: any) {
      toast({
        title: "Error posting to LinkedIn",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setPostingToLinkedIn(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'closed':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Poll Management</h1>
                <p className="text-muted-foreground mt-1">
                  Create, manage, and share polls with LinkedIn integration
                </p>
              </div>
            </div>
            
            <Button onClick={handleCreatePoll} className="btn-hero inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Polls</p>
                    <p className="text-2xl font-bold">{polls.length}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Live Polls</p>
                    <p className="text-2xl font-bold">{polls.filter(p => p.status === 'live').length}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="text-2xl font-bold">{polls.reduce((sum, poll) => sum + poll.total_votes, 0)}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Posted to LinkedIn</p>
                    <p className="text-2xl font-bold">{polls.filter(p => p.linkedin_posted_at).length}</p>
                  </div>
                  <Linkedin className="h-8 w-8 text-blue-700" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Polls List */}
          <div className="space-y-4">
            {polls.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first poll to get started with engaging your audience.
                  </p>
                  <Button onClick={handleCreatePoll} className="btn-hero">
                    Create Your First Poll
                  </Button>
                </CardContent>
              </Card>
            ) : (
              polls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{poll.title}</h3>
                          <Badge className={`${getStatusColor(poll.status)}`}>
                            {poll.status}
                          </Badge>
                          {poll.linkedin_posted_at && (
                            <Badge variant="outline" className="text-blue-700 border-blue-700">
                              <Linkedin className="h-3 w-3 mr-1" />
                              Posted
                            </Badge>
                          )}
                        </div>
                        
                        {poll.description && (
                          <p className="text-muted-foreground mb-3">{poll.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {poll.total_votes} votes
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Created {format(new Date(poll.created_at), "MMM d, yyyy")}
                          </span>
                          {poll.expires_at && (
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Expires {format(new Date(poll.expires_at), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {poll.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted/50 rounded px-3 py-2">
                              <span className="text-sm">{option.text}</span>
                              <span className="text-sm font-medium">{option.votes} votes</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPoll(poll)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {poll.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePollStatus(poll.id, 'live')}
                              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {poll.status === 'live' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePollStatus(poll.id, 'closed')}
                              className="text-orange-600 border-orange-600 hover:bg-orange-600 hover:text-white"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePoll(poll.id)}
                            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {poll.status === 'live' && !poll.linkedin_posted_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => postToLinkedIn(poll)}
                            disabled={postingToLinkedIn === poll.id}
                            className="text-blue-700 border-blue-700 hover:bg-blue-700 hover:text-white"
                          >
                            <Linkedin className="h-4 w-4 mr-2" />
                            {postingToLinkedIn === poll.id ? 'Posting...' : 'Post to LinkedIn'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Create/Edit Poll Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPoll ? 'Edit Poll' : 'Create New Poll'}</DialogTitle>
            <DialogDescription>
              {editingPoll ? 'Update your poll details below.' : 'Create a new poll to engage your audience.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Poll Title</label>
              <Input
                placeholder="What should we discuss?"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                placeholder="Add more context to your poll..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Poll Options</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateWithAI}
                  disabled={generatingPoll}
                  className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generatingPoll ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {formData.options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Expiry Date (Optional)</label>
              <Input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={savePoll} className="btn-hero">
              {editingPoll ? 'Update Poll' : 'Create Poll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Polls;