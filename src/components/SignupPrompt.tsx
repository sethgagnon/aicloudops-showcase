import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';

interface SignupPromptProps {
  className?: string;
}

const SignupPrompt = ({ className = '' }: SignupPromptProps) => {
  return (
    <Card className={`p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Lock className="h-8 w-8 text-primary" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-4">
        Continue Reading with Free Access
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        You've used your free article preview. Sign up to unlock unlimited access to all insights on AI leadership, cloud strategy, and engineering management.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
        <Link to="/auth">
          <Button size="lg" className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4 mr-2" />
            Get Free Access
          </Button>
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        Join other technology leaders • No spam, ever
      </p>
    </Card>
  );
};

export default SignupPrompt;