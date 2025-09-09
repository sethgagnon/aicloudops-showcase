import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, TrendingUp, Lock } from 'lucide-react';
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
}

interface PollVote {
  option_index: number;
}

interface PollWithResults extends Poll {
  results?: number[];
  user_voted?: boolean;
}

const Polls = () => {
  const [currentPoll, setCurrentPoll] = useState<PollWithResults | null>(null);
  const [previousPolls, setPreviousPolls] = useState<PollWithResults[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentPoll();
    if (user) {
      fetchPreviousPolls();
    }
  }, [user]);

  const fetchCurrentPoll = async () => {
    try {
      // Get the current live poll
      const { data: poll, error } = await supabase
        .from('polls')
        .select('*')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;

      if (poll) {
        // Check if user has already voted
        const { data: vote, error: voteError } = await supabase
          .from('poll_votes')
          .select('option_index')
          .eq('poll_id', poll.id)
          .eq('voter_ip', await getClientIP())
          .maybeSingle();

        if (voteError && voteError.code !== 'PGRST116') {
          console.error('Error checking vote:', voteError);
        }

        // Get vote distribution
        const results = await getPollResults(poll.id);

        setCurrentPoll({
          ...poll,
          results,
          user_voted: !!vote
        });
      }
    } catch (error) {
      console.error('Error fetching current poll:', error);
      toast({
        title: "Error",
        description: "Failed to load current poll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousPolls = async () => {
    try {
      const { data: polls, error } = await supabase
        .from('polls')
        .select('*')
        .eq('status', 'closed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get results for each poll
      const pollsWithResults = await Promise.all(
        polls.map(async (poll) => ({
          ...poll,
          results: await getPollResults(poll.id)
        }))
      );

      setPreviousPolls(pollsWithResults);
    } catch (error) {
      console.error('Error fetching previous polls:', error);
    }
  };

  const getPollResults = async (pollId: string): Promise<number[]> => {
    const { data: votes, error } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', pollId);

    if (error) return [];

    // Count votes for each option
    const results = [0, 0, 0, 0];
    votes.forEach(vote => {
      if (vote.option_index >= 0 && vote.option_index < 4) {
        results[vote.option_index]++;
      }
    });

    return results;
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=text');
      return await response.text();
    } catch {
      return 'unknown';
    }
  };

  const handleVote = async () => {
    if (!currentPoll || !selectedOption) return;

    setIsVoting(true);
    try {
      const optionIndex = parseInt(selectedOption);
      const clientIP = await getClientIP();

      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: currentPoll.id,
          option_index: optionIndex,
          voter_ip: clientIP
        });

      if (error) throw error;

      toast({
        title: "Vote Submitted",
        description: "Thank you for participating!",
      });

      // Refresh poll data
      await fetchCurrentPoll();
      setSelectedOption('');
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') 
          ? "You have already voted on this poll" 
          : "Failed to submit vote",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
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

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Weekly Polls - AI Cloud Ops"
        description="Participate in our weekly polls about AI, cloud computing, DevOps, and technology trends. Share your opinion with the community."
        keywords="AI polls, cloud computing survey, DevOps opinions, tech polls, weekly survey"
      />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Weekly Polls
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your thoughts on AI, cloud computing, and technology trends with our community
          </p>
        </div>

        {/* Current Poll */}
        {currentPoll ? (
          <Card className="card-elegant mb-12">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <Badge variant="default">Current Poll</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Week of {formatDate(currentPoll.week_of)}
                </div>
              </div>
              <CardTitle className="text-2xl">{currentPoll.title}</CardTitle>
              {currentPoll.description && (
                <CardDescription className="text-base">
                  {currentPoll.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPoll.user_voted ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Users className="w-4 h-4" />
                    {currentPoll.total_votes} total votes
                  </div>
                  {currentPoll.options.map((option, index) => {
                    const votes = currentPoll.results?.[index] || 0;
                    const percentage = getPercentage(votes, currentPoll.total_votes);
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{option}</span>
                          <span className="text-sm text-muted-foreground">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    {currentPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button 
                    onClick={handleVote}
                    disabled={!selectedOption || isVoting}
                    className="w-full"
                  >
                    {isVoting ? 'Submitting...' : 'Submit Vote'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="card-elegant mb-12">
            <CardContent className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Poll</h3>
              <p className="text-muted-foreground">
                Check back soon for this week's poll!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Previous Polls Section */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Previous Polls</h2>
            {!user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                Sign in to view results
              </div>
            )}
          </div>

          {!user ? (
            <Card className="card-elegant">
              <CardContent className="text-center py-12">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Member-Only Content</h3>
                <p className="text-muted-foreground mb-6">
                  Sign in to view previous poll results and participate in our community discussions.
                </p>
                <Button asChild>
                  <a href="/auth">Sign In</a>
                </Button>
              </CardContent>
            </Card>
          ) : previousPolls.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {previousPolls.map((poll) => (
                <Card key={poll.id} className="card-elegant">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      Week of {formatDate(poll.week_of)}
                    </div>
                    <CardTitle className="text-lg">{poll.title}</CardTitle>
                    {poll.description && (
                      <CardDescription>{poll.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Users className="w-4 h-4" />
                        {poll.total_votes} total votes
                      </div>
                      {poll.options.map((option, index) => {
                        const votes = poll.results?.[index] || 0;
                        const percentage = getPercentage(votes, poll.total_votes);
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{option}</span>
                              <span className="text-sm text-muted-foreground">{percentage}%</span>
                            </div>
                            <Progress value={percentage} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="card-elegant">
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Previous Polls</h3>
                <p className="text-muted-foreground">
                  Previous polls will appear here once they're closed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Polls;