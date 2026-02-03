import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMedicaidContact, getGenericMedicaidGuidance } from '@/features/autism-navigator/data/contactData';
import { getStateResource } from '@/features/autism-navigator/data/stateResources';
import { Phone, MapPin, Globe, Clock, ChevronRight, User, FileText, CheckCircle2 } from 'lucide-react';
import { ResourceFinder } from '@/features/autism-navigator/utils/ResourceFinder';

interface MedicaidContactCardProps {
  state: string;
  county: string;
}

export function MedicaidContactCard({ state, county }: MedicaidContactCardProps) {
  const contact = getMedicaidContact(state);
  const stateInfo = getStateResource(state);

  return (
    <Card className="border border-emerald-500/30 bg-emerald-950/20 overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-emerald-500/20 bg-emerald-900/20">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-100">
              <FileText className="w-5 h-5 text-emerald-400" />
              {stateInfo?.medicaidName || contact?.programName || 'Medicaid & Insurance'}
            </CardTitle>
            <p className="text-xs text-slate-400 font-medium">State Benefits Navigator</p>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white border-none text-[10px] font-bold uppercase">
            {state}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Main Guidance */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">How to Apply</h4>
          <div className="space-y-2">
            {((stateInfo?.applicationProcess) || (contact?.applicationProcess.map((s: any) => s.action)) || [
              'Visit the official state health portal',
              'Complete the eligibility application',
              'Provide proof of income and residency',
              'Submit your child\'s autism diagnosis report'
            ]).slice(0, 4).map((action: string, i: number) => (
              <div key={i} className="flex gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-400">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Localized Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-11" asChild>
            <a href={stateInfo?.medicaidUrl || ResourceFinder.getMedicaidLink(state)} target="_blank">
              <Globe className="w-4 h-4" />
              Visit Official Portal
            </a>
          </Button>
          <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2 h-11" asChild>
            <a href={`tel:${contact?.mainPhone.replace(/\D/g, '') || '211'}`}>
              <Phone className="w-4 h-4" />
              Call for Assistance
            </a>
          </Button>
        </div>

        {/* Local Office Hook */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-slate-200">Local {state} Benefits Office</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Managed by the <strong>Department of Social Services</strong>. You can find your specific office by ZIP code on the official portal or through 211.
          </p>
          <Button variant="ghost" className="w-full text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 gap-1" asChild>
            <a href={ResourceFinder.getSSALink('00000').replace('00000', '')} target="_blank">
              Search by ZIP Code <ChevronRight className="w-3 h-3" />
            </a>
          </Button>
        </div>

        {/* Wait Time Badge */}
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg. Wait Time</span>
          <span className="text-xs font-bold text-emerald-400">{stateInfo?.medicaidWaitTime || '30-45 Days'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
