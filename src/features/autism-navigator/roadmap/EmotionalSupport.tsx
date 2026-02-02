import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmotionalSupportProps {
  message: string;
  onJoinCommunity?: () => void;
}

export function EmotionalSupport({ message, onJoinCommunity }: EmotionalSupportProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
      <Heart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="space-y-2">
        <p className="text-sm">{message}</p>
        {onJoinCommunity && (
          <Button variant="link" className="h-auto p-0 text-primary" onClick={onJoinCommunity}>
            Connect with other parents in our community →
          </Button>
        )}
      </div>
    </div>
  );
}
