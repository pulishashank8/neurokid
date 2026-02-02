import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMedicaidContact, getGenericMedicaidGuidance } from '@/features/autism-navigator/data/contactData';
import { getStateResource } from '@/features/autism-navigator/data/stateResources';
import { Phone, MapPin, Globe, Clock, ChevronRight, User, FileText, CheckCircle2 } from 'lucide-react';
import { ResourceFinder } from '@/features/autism-navigator/lib/ResourceFinder';

interface MedicaidContactCardProps {
  state: string;
  county: string;
}

export function MedicaidContactCard({ state, county }: MedicaidContactCardProps) {
  const contact = getMedicaidContact(state);
  const stateInfo = getStateResource(state);

  return (
    <Card className="border-emerald-200 bg-emerald-50/20 overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b bg-emerald-100/30">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-900">
              <FileText className="w-5 h-5 text-emerald-600" />
              {stateInfo?.medicaidName || contact?.programName || 'Medicaid & Insurance'}
            </CardTitle>
            <p className="text-xs text-emerald-700/70 font-medium">State Benefits Navigator</p>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-[10px] font-bold uppercase">
            {state}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Main Guidance */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">How to Apply</h4>
          <div className="space-y-2">
            {((stateInfo?.applicationProcess) || (contact?.applicationProcess.map((s: any) => s.action)) || [
              'Visit the official state health portal',
              'Complete the eligibility application',
              'Provide proof of income and residency',
              'Submit your child\'s autism diagnosis report'
            ]).slice(0, 4).map((action: string, i: number) => (
              <div key={i} className="flex gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-emerald-900/80">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Localized Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11" asChild>
            <a href={stateInfo?.medicaidUrl || ResourceFinder.getMedicaidLink(state)} target="_blank">
              <Globe className="w-4 h-4" />
              Visit Official Portal
            </a>
          </Button>
          <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100/50 gap-2 h-11" asChild>
            <a href={`tel:${contact?.mainPhone.replace(/\D/g, '') || '211'}`}>
              <Phone className="w-4 h-4" />
              Call for Assistance
            </a>
          </Button>
        </div>

        {/* Local Office Hook */}
        <div className="bg-white/60 rounded-xl p-4 border border-emerald-100 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-900">Local {state} Benefits Office</span>
          </div>
          <p className="text-xs text-emerald-700/80 leading-relaxed">
            Managed by the <strong>Department of Social Services</strong>. You can find your specific office by ZIP code on the official portal or through 211.
          </p>
          <Button variant="ghost" className="w-full text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 gap-1" asChild>
            <a href={ResourceFinder.getSSALink('00000').replace('00000', '')} target="_blank">
              Search by ZIP Code <ChevronRight className="w-3 h-3" />
            </a>
          </Button>
        </div>

        {/* Wait Time Badge */}
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-100/30 rounded-lg">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tighter">Avg. Wait Time</span>
          <span className="text-xs font-bold text-emerald-700">{stateInfo?.medicaidWaitTime || '30-45 Days'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
