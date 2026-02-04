import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCommunityContact, getGenericCommunityGuidance } from '@/features/autism-navigator/data/contactData';
import { getStateResource } from '@/features/autism-navigator/data/stateResources';
import { Phone, MapPin, Globe, Clock, Users, Heart, Baby, Search, ExternalLink } from 'lucide-react';
import { ResourceFinder } from '@/features/autism-navigator/utils/ResourceFinder';

interface GovernmentContactCardProps {
  state: string;
  county: string;
}

export function GovernmentContactCard({ state, county }: GovernmentContactCardProps) {
  const contact = getCommunityContact(state, county);
  const stateInfo = getStateResource(state);

  return (
    <div className="space-y-4">
      {/* Early Intervention Card */}
      <Card className="border-blue-200 bg-blue-50/20 overflow-hidden shadow-sm">
        <CardHeader className="pb-3 border-b bg-blue-100/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-900">
              <Baby className="w-5 h-5 text-blue-600" />
              {stateInfo?.earlyInterventionName || contact?.earlyIntervention.programName || 'Early Intervention'}
            </CardTitle>
            <Badge className="bg-blue-600 text-white border-none text-[10px] uppercase font-bold">Ages 0-3</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-blue-800/80 leading-relaxed font-medium">
            Connect with free support services if your child is under age 3.
            <strong> No medical diagnosis is required</strong> to start evaluations or services.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11" asChild>
              <a href={stateInfo?.earlyInterventionUrl || ResourceFinder.getEarlyInterventionLink(state)} target="_blank">
                <Globe className="w-4 h-4" />
                EI Portal
              </a>
            </Button>
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100/50 gap-2 h-11" asChild>
              <a href={`tel:${contact?.earlyIntervention.referralLine.replace(/\D/g, '') || '211'}`}>
                <Phone className="w-4 h-4" />
                Referral Line
              </a>
            </Button>
          </div>

          <div className="bg-white/60 rounded-xl p-3 border border-blue-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-tighter">Avg. Wait for Evaluation</span>
            <span className="text-xs font-bold text-blue-700">{stateInfo?.earlyInterventionWaitTime || '45 Days'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Child Find / School District Card */}
      <Card className="border-emerald-200 bg-emerald-50/20 overflow-hidden shadow-sm">
        <CardHeader className="pb-3 border-b bg-emerald-100/30">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-900">
            <Users className="w-5 h-5 text-emerald-600" />
            Child Find (School Services)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-emerald-800/80 leading-relaxed">
            For children <strong>3 years and older</strong>, the local school district provides evaluations and specialized educational support (IEPs).
          </p>

          <div className="bg-white/60 rounded-xl p-4 border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-900">{county} County Districts</span>
            </div>
            <p className="text-xs text-emerald-700/80">
              Each school district has a specialized <strong>Child Find</strong> team. Contact your local district central office to request an evaluation in writing.
            </p>
            <Button variant="ghost" className="w-full text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 gap-1" asChild>
              <a href={`https://www.google.com/search?q=${county}+county+school+district+child+find`} target="_blank">
                Find my District <Search className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Assistant Hook */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Users className="w-16 h-16" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Still not sure where to go?</p>
        <h4 className="text-lg font-bold mb-3">Ask your personalized AI Assistant</h4>
        <p className="text-sm text-indigo-50/80 mb-4 leading-relaxed">
          I can search for specific phone numbers and contacts in your exact ZIP code using my medical knowledge base.
        </p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold text-indigo-100">AI Assistant is active below</span>
        </div>
      </div>
    </div>
  );
}
