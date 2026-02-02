import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export function FutureHook() {
  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-sm">Coming Soon</p>
            <p className="text-xs text-muted-foreground">
              Personalized service matching in your area based on your child's specific needs.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
