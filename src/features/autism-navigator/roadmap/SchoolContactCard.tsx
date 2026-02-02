import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchoolContacts } from '@/features/autism-navigator/data/roadmapData';
import { User, Building, MapPin, Phone } from 'lucide-react';

interface SchoolContactCardProps {
  county: string;
  state: string;
}

export function SchoolContactCard({ county, state }: SchoolContactCardProps) {
  const contacts = getSchoolContacts(county, state);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Who to Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border bg-card"
            >
              <p className="font-medium text-sm">{contact.role}</p>
              <p className="text-xs text-muted-foreground mt-1">{contact.title}</p>
              <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {contact.officeType}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {contact.location}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {contact.phone}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
