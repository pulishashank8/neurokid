import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LocationData } from '@/features/autism-navigator/types/roadmap';
import { MapPin, Calendar, Pencil } from 'lucide-react';

interface LocationSummaryProps {
  location: LocationData;
  onEdit: () => void;
}

export function LocationSummary({ location, onEdit }: LocationSummaryProps) {
  const ageLabels: Record<string, string> = {
    '0-3': '0–3 years',
    '3-5': '3–5 years',
    '6+': '6+ years',
  };

  return (
    <Card className="card-premium overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Age Range</p>
                <p className="font-medium text-foreground">{ageLabels[location.ageRange]}</p>
              </div>
            </div>
            
            <div className="hidden sm:block w-px h-10 bg-border/60" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                <p className="font-medium text-foreground">
                  {location.county}, {location.state} {location.zipCode}
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit} 
            className="gap-2 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
