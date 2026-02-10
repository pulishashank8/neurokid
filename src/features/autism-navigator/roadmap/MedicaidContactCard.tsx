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
    <Card className="border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm rounded-2xl">
      <CardHeader className="pb-3 border-b border-[var(--border)] bg-[var(--surface2)]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-[var(--text)]">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="break-words">{stateInfo?.medicaidName || contact?.programName || 'Medicaid & Insurance'}</span>
            </CardTitle>
            <p className="text-xs text-[var(--muted)] font-medium mt-0.5">State Benefits Navigator</p>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white border-none text-[10px] font-bold uppercase w-fit">
            {state}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-5 sm:space-y-6">
        {/* Main Guidance */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">How to Apply</h4>
          <div className="space-y-2">
            {((stateInfo?.applicationProcess) || (contact?.applicationProcess.map((s: any) => s.action)) || [
              'Visit the official state health portal',
              'Complete the eligibility application',
              'Provide proof of income and residency',
              'Submit your child\'s autism diagnosis report'
            ]).slice(0, 4).map((action: string, i: number) => (
              <div key={i} className="flex gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[var(--muted)] leading-relaxed">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Localized Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-11 rounded-xl [&_a]:text-white [&_a]:font-semibold" asChild>
            <a href={stateInfo?.medicaidUrl || ResourceFinder.getMedicaidLink(state)} target="_blank" rel="noopener noreferrer" className="text-white font-semibold">
              <Globe className="w-4 h-4 shrink-0 text-white" />
              Visit Official Portal
            </a>
          </Button>
          <Button variant="outline" className="border-[var(--border)] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-2 h-11 rounded-xl border-emerald-500/40" asChild>
            <a href={`tel:${contact?.mainPhone.replace(/\D/g, '') || '211'}`}>
              <Phone className="w-4 h-4 shrink-0" />
              Call for Assistance
            </a>
          </Button>
        </div>

        {/* Local Office Hook - same theme as rest of page, not dark */}
        <div className="bg-[var(--surface2)] rounded-xl p-4 border border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-bold text-[var(--text)]">Local {state} Benefits Office</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Managed by the <strong className="text-[var(--text)]">Department of Social Services</strong>. You can find your specific office by ZIP code on the official portal or through 211.
          </p>
          <Button variant="ghost" className="w-full text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 h-9 sm:h-8 gap-1 rounded-lg" asChild>
            <a href={ResourceFinder.getSSALink('00000').replace('00000', '')} target="_blank" rel="noopener noreferrer">
              Search by ZIP Code <ChevronRight className="w-3 h-3 shrink-0" />
            </a>
          </Button>
        </div>

        {/* Wait Time Badge */}
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tighter">Avg. Wait Time</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stateInfo?.medicaidWaitTime || '30-45 Days'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
