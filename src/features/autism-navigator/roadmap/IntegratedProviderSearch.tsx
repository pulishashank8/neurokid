"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NPIService, NPIProvider, PROVIDER_TYPES } from '@/features/autism-navigator/lib/NPIService';
import { MapPin, Phone, Search, Star, Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegratedProviderSearchProps {
    zipCode: string;
}

export function IntegratedProviderSearch({ zipCode }: IntegratedProviderSearchProps) {
    const [providers, setProviders] = useState<NPIProvider[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeType, setActiveType] = useState<keyof typeof PROVIDER_TYPES | 'PSYCHOLOGY_TODAY'>('DEVELOPMENTAL_PEDIATRICIAN');

    useEffect(() => {
        if (activeType !== 'PSYCHOLOGY_TODAY') {
            fetchProviders();
        }
    }, [activeType, zipCode]);

    const fetchProviders = async () => {
        setLoading(true);
        try {
            const results = await NPIService.searchProviders(zipCode, PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].code);
            setProviders(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const psychologyTodayURL = `https://www.psychologytoday.com/us/therapists?search=${zipCode}&category=autism`;

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Search className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Expert Directory</h3>
                        <p className="text-sm text-slate-500 font-medium">Connecting you to local specialists in {zipCode}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(Object.keys(PROVIDER_TYPES) as Array<keyof typeof PROVIDER_TYPES>).map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2",
                                activeType === type
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                    : "bg-white border-slate-100 text-slate-400 hover:border-primary/20 hover:text-primary"
                            )}
                        >
                            {PROVIDER_TYPES[type].name}
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveType('PSYCHOLOGY_TODAY')}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2",
                            activeType === 'PSYCHOLOGY_TODAY'
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                                : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600"
                        )}
                    >
                        Psychology Today
                    </button>
                </div>
            </div>

            {/* Results Area */}
            {activeType === 'PSYCHOLOGY_TODAY' ? (
                <Card className="overflow-hidden border-none bg-indigo-100/30 shadow-sm rounded-[2.5rem] animate-fade-in border-2 border-indigo-200/50">
                    <CardContent className="p-12 text-center space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-4xl font-extrabold text-indigo-950 tracking-tight">Psychology Today Search</h4>
                            <p className="text-indigo-900/60 max-w-sm mx-auto leading-relaxed font-bold">
                                Access the world's largest directory of verified therapists, psychologists, and autism specialists near {zipCode}.
                            </p>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-indigo-100 group" asChild>
                            <a href={psychologyTodayURL} target="_blank">
                                Find Experts on Psychology Today
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </Button>
                        <div className="pt-4 border-t border-indigo-100/50 flex justify-center gap-6 grayscale opacity-50">
                            <span className="text-[10px] font-black uppercase tracking-widest">Verified Profiles</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Insurance Filtering</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Direct Contact</span>
                        </div>
                    </CardContent>
                </Card>
            ) : loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scanning Registry...</p>
                </div>
            ) : providers.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {providers.slice(0, 5).map((provider) => (
                        <Card key={provider.number} className="group overflow-hidden border-none bg-white shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl">
                            <CardContent className="p-5 flex flex-col sm:flex-row items-start justify-between gap-6">
                                <div className="space-y-3 flex-1 w-full">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary/70">
                                            {provider.taxonomies.find(t => t.primary)?.desc || PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].name}
                                        </Badge>
                                        <h4 className="text-lg font-bold text-slate-900 leading-tight break-words">
                                            {provider.basic.organization_name || `${provider.basic.first_name} ${provider.basic.last_name}`}
                                        </h4>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="truncate max-w-[200px] sm:max-w-none">{NPIService.formatAddress(provider)}</span>
                                        </div>
                                        {NPIService.getPhone(provider) && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                                <Phone className="w-4 h-4 shrink-0" />
                                                <span>{NPIService.getPhone(provider)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-primary hover:text-white hover:border-primary group/btn h-10 px-4" asChild>
                                        <a href={`tel:${NPIService.getPhone(provider)}`}>
                                            <Phone className="w-4 h-4 mr-2" />
                                            Call
                                        </a>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-slate-50 text-slate-400 h-10 w-10 shrink-0" asChild>
                                        <a href={`https://www.google.com/search?q=${encodeURIComponent((provider.basic.organization_name || `${provider.basic.first_name} ${provider.basic.last_name}`) + " " + zipCode)}`} target="_blank">
                                            <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="ghost" className="w-full text-slate-400 font-bold text-sm h-12 rounded-2xl hover:bg-slate-50" asChild>
                        <a href={`https://npiregistry.cms.hhs.gov/registry/search-results-table?address_purpose=LOCATION&postal_code=${zipCode}&taxonomy_description=${encodeURIComponent(PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].name)}`} target="_blank">
                            View More Professionals in Area
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                    </Button>
                </div>
            ) : (
                <div className="p-12 text-center space-y-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm">
                        <Search className="w-8 h-8 text-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <p className="font-bold text-slate-900">No matching providers found in {zipCode}</p>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">Clinical registry matches for {PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].name} in this exact ZIP can be limited.</p>
                    </div>
                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <Button variant="outline" className="rounded-xl h-12" onClick={fetchProviders}>
                            Retry NPI Search
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12" asChild>
                            <a href={`https://www.psychologytoday.com/us/therapists?search=${zipCode}&category=autism`} target="_blank">
                                Try Psychology Today Instead
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
