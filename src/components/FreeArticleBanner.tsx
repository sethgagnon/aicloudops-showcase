import { Link } from 'react-router-dom';
import { Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFreeArticle } from '@/hooks/useFreeArticle';

const FreeArticleBanner = () => {
  const { user } = useAuth();
  const { guestArticlesUsed, maxFreeArticles, canReadFreeArticle } = useFreeArticle();

  // Don't show banner if user is authenticated
  if (user) return null;

  // Show message for first-time guests
  if (guestArticlesUsed === 0) {
    return (
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 border-b border-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-accent mr-2" />
              <p className="text-sm text-foreground">
                <span className="font-medium">Welcome! You can read 1 article as a guest.</span>
                <span className="text-muted-foreground ml-1">
                  • Sign up for unlimited access
                </span>
              </p>
            </div>
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-1" />
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show different content based on whether they can still read articles
  if (canReadFreeArticle()) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-primary mr-2" />
              <p className="text-sm text-foreground">
                <span className="font-medium">Guest access remaining: {maxFreeArticles - guestArticlesUsed}</span>
                <span className="text-muted-foreground ml-1">
                  • Sign up to continue reading
                </span>
              </p>
            </div>
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-1" />
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary to-accent text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            <p className="text-sm">
              <span className="font-medium">You've reached your preview limit.</span>
              <span className="ml-1 opacity-90">
                Sign up to continue reading - it's always free.
              </span>
            </p>
          </div>
          <Link to="/auth">
            <Button variant="secondary" size="sm">
              Continue Reading
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FreeArticleBanner;