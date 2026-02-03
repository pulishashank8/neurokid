import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmotionalSupportProps {
  message: string;
  onJoinCommunity?: () => void;
}

export function EmotionalSupport({ message, onJoinCommunity }: EmotionalSupportProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <Heart className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      <div className="space-y-2">
        <p className="text-sm text-slate-300">{message}</p>
        {onJoinCommunity && (
          <Button variant="link" className="h-auto p-0 text-emerald-400 hover:text-emerald-300" onClick={onJoinCommunity}>
            Connect with other parents in our community →
          </Button>
        )}
      </div>
    </div>
  );
}
