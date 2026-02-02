import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';

interface CommunityInviteProps {
  onJoin: () => void;
}

export function CommunityInvite({ onJoin }: CommunityInviteProps) {
  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">Join Our Parent Community</h3>
              <p className="text-muted-foreground mt-1">
                Connect with other parents navigating the same journey. Share experiences, 
                ask questions, and find support from those who understand.
              </p>
            </div>
            <Button onClick={onJoin} className="gap-2">
              Join Community
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
