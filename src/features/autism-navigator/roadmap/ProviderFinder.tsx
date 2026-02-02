import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Provider } from '@/features/autism-navigator/types/roadmap';
import { MapPin, ExternalLink, Search, Phone, BookOpen, GraduationCap, Heart, Building } from 'lucide-react';
import { getStateResources, NATIONAL_RESOURCES, getSpecialtySearchUrl } from '@/features/autism-navigator/data/providerResources';

interface ProviderFinderProps {
  zipCode: string;
  state: string;
  specialties?: Provider['specialty'][];
}

export function ProviderFinder({ zipCode, state, specialties = [] }: ProviderFinderProps) {
  const stateResources = getStateResources(state);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            Find Providers Near You
            <Badge variant="secondary" className="ml-2 font-normal">
              {zipCode}, {state}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* State-specific resources */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Official {stateResources.state} Resources
          </p>
          <div className="grid gap-2">
            <ResourceLink
              icon={<Heart className="w-4 h-4" />}
              label="Early Intervention Program"
              url={stateResources.earlyInterventionUrl}
              description="Ages 0-3 services"
            />
            <ResourceLink
              icon={<GraduationCap className="w-4 h-4" />}
              label="Special Education Services"
              url={stateResources.specialEducationUrl}
              description="School-age services"
            />
            <ResourceLink
              icon={<BookOpen className="w-4 h-4" />}
              label="Autism Resources"
              url={stateResources.autismResourceUrl}
              description="State autism organizations"
            />
          </div>
          {stateResources.notes && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md mt-2">
              💡 {stateResources.notes}
            </p>
          )}
        </div>

        {/* Specialty-specific search links */}
        {specialties.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-foreground">
              Search by Provider Type
            </p>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <a
                  key={specialty}
                  href={getSpecialtySearchUrl(specialty, zipCode, state)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Search className="w-3 h-3" />
                  {specialty}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* National directories */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium text-foreground">
            National Provider Directories
          </p>
          <div className="grid gap-2">
            {NATIONAL_RESOURCES.slice(0, 4).map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">
                    {resource.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {resource.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Quick action button */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <a
              href={`https://www.autismspeaks.org/resource-guide?location=${zipCode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Find All Resources Near {zipCode}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ResourceLinkProps {
  icon: React.ReactNode;
  label: string;
  url: string;
  description: string;
}

function ResourceLink({ icon, label, url, description }: ResourceLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-colors"
    >
      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
    </a>
  );
}
