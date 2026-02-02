import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Languages } from 'lucide-react';

interface PlainLanguageToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PlainLanguageToggle({ enabled, onToggle }: PlainLanguageToggleProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors">
      <Languages className="w-4 h-4 text-primary shrink-0" />
      <Label 
        htmlFor="plain-language" 
        className="text-sm font-medium cursor-pointer text-foreground/80 whitespace-nowrap"
      >
        Simple Mode
      </Label>
      <Switch
        id="plain-language"
        checked={enabled}
        onCheckedChange={onToggle}
        className="scale-90"
      />
    </div>
  );
}
