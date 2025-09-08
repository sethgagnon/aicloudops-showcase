import { useState } from 'react';
import { Calendar, Clock, Send, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PostData {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  scheduled_at: string;
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostData;
  onPost: (post: PostData) => void;
  onPublishNow: () => void;
  onSchedule: (scheduledAt: string) => void;
  loading: boolean;
}

export function PublishDialog({
  open,
  onOpenChange,
  post,
  onPost,
  onPublishNow,
  onSchedule,
  loading
}: PublishDialogProps) {
  const [localScheduledAt, setLocalScheduledAt] = useState(post.scheduled_at || '');
  const [showScheduling, setShowScheduling] = useState(false);

  const handleSchedule = () => {
    if (!localScheduledAt) {
      return;
    }
    
    const scheduledDate = new Date(localScheduledAt);
    const now = new Date();
    if (scheduledDate <= now) {
      return;
    }
    
    onSchedule(localScheduledAt);
  };

  const isValidScheduleDate = localScheduledAt && new Date(localScheduledAt) > new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Post</DialogTitle>
          <DialogDescription>
            Choose how you'd like to publish your post.
          </DialogDescription>
        </DialogHeader>

        {!showScheduling ? (
          <div className="space-y-4">
            <Button
              onClick={onPublishNow}
              disabled={loading}
              className="w-full h-12 text-left justify-start"
              size="lg"
            >
              <Send className="h-4 w-4 mr-3" />
              <div>
                <div className="font-medium">Publish Now</div>
                <div className="text-sm opacity-80">Make your post live immediately</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowScheduling(true)}
              disabled={loading}
              className="w-full h-12 text-left justify-start"
              size="lg"
            >
              <Calendar className="h-4 w-4 mr-3" />
              <div>
                <div className="font-medium">Schedule for Later</div>
                <div className="text-sm text-muted-foreground">Choose a date and time</div>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Publish Date & Time
              </label>
              
              <div className="space-y-2">
                {/* Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localScheduledAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localScheduledAt 
                        ? format(new Date(localScheduledAt), "PPP") 
                        : "Pick a date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={localScheduledAt ? new Date(localScheduledAt) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const currentTime = localScheduledAt 
                            ? localScheduledAt.split('T')[1] 
                            : '12:00';
                          const newDateTime = `${format(date, 'yyyy-MM-dd')}T${currentTime}`;
                          setLocalScheduledAt(newDateTime);
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Time Picker */}
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={localScheduledAt ? localScheduledAt.split('T')[1] || '12:00' : '12:00'}
                    onChange={(e) => {
                      const currentDate = localScheduledAt 
                        ? localScheduledAt.split('T')[0] 
                        : format(new Date(), 'yyyy-MM-dd');
                      const newDateTime = `${currentDate}T${e.target.value}`;
                      setLocalScheduledAt(newDateTime);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  />
                </div>

                {localScheduledAt && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Will be published:</strong><br />
                      {format(new Date(localScheduledAt), "PPP 'at' p")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setShowScheduling(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={loading || !isValidScheduleDate}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Post
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}