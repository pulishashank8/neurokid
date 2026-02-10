"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NPIService, NPIProvider, PROVIDER_TYPES } from '@/features/autism-navigator/utils/NPIService';
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
        if (activeType !== 'PSYCHOLOGY_TODAY' && zipCode?.trim().length >= 3) {
            fetchProviders();
        }
    }, [activeType, zipCode]);

    const fetchProviders = async () => {
        if (!zipCode?.trim() || zipCode.trim().length < 3) {
            setProviders([]);
            return;
        }
        setLoading(true);
        try {
            const results = await NPIService.searchProviders(zipCode, PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].code);
            setProviders(results);
        } catch {
            setProviders([]);
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
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Search className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl font-extrabold text-[var(--text)] tracking-tight">Expert Directory</h3>
                        <p className="text-sm text-[var(--muted)] font-medium">Connecting you to local specialists in {zipCode}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(Object.keys(PROVIDER_TYPES) as Array<keyof typeof PROVIDER_TYPES>).map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveType(type)}
                            className={cn(
                                "px-3 py-2 sm:px-4 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-2",
                                activeType === type
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20 sm:scale-105"
                                    : "bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)] hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400"
                            )}
                        >
                            {PROVIDER_TYPES[type].name}
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveType('PSYCHOLOGY_TODAY')}
                        className={cn(
                            "px-3 py-2 sm:px-4 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border-2",
                            activeType === 'PSYCHOLOGY_TODAY'
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20 sm:scale-105"
                                : "bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)] hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400"
                        )}
                    >
                        Psychology Today
                    </button>
                </div>
            </div>

            {/* Results Area */}
            {activeType === 'PSYCHOLOGY_TODAY' ? (
                <Card className="overflow-hidden border border-[var(--border)] bg-indigo-500/5 dark:bg-indigo-900/20 shadow-sm rounded-2xl sm:rounded-[2.5rem] animate-fade-in">
                    <CardContent className="p-6 sm:p-12 text-center space-y-6 sm:space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-2xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">Psychology Today Search</h4>
                            <p className="text-[var(--muted)] max-w-sm mx-auto leading-relaxed font-bold text-sm sm:text-base">
                                Access the world's largest directory of verified therapists, psychologists, and autism specialists near {zipCode}.
                            </p>
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-bold shadow-xl shadow-indigo-500/20 group" asChild>
                            <a href={psychologyTodayURL} target="_blank">
                                Find Experts on Psychology Today
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </Button>
                        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap justify-center gap-4 sm:gap-6 grayscale opacity-50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Verified Profiles</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Insurance Filtering</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Direct Contact</span>
                        </div>
                    </CardContent>
                </Card>
            ) : loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 bg-[var(--surface2)] rounded-2xl sm:rounded-3xl border-2 border-dashed border-[var(--border)]">
                    <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
                    <p className="text-sm font-bold text-[var(--muted)] uppercase tracking-widest">Scanning Registry...</p>
                </div>
            ) : providers.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {providers.slice(0, 5).map((provider) => (
                        <Card key={provider.number} className="group overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl">
                            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
                                <div className="space-y-3 flex-1 w-full min-w-0">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-600 dark:text-emerald-400/80">
                                            {provider.taxonomies.find(t => t.primary)?.desc || PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].name}
                                        </Badge>
                                        <h4 className="text-base sm:text-lg font-bold text-[var(--text)] leading-tight break-words">
                                            {provider.basic.organization_name || `${provider.basic.first_name} ${provider.basic.last_name}`}
                                        </h4>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2 text-sm text-[var(--muted)] min-w-0">
                                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span className="break-words">{NPIService.formatAddress(provider)}</span>
                                        </div>
                                        {NPIService.getPhone(provider) && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                <Phone className="w-4 h-4 shrink-0" />
                                                <span>{NPIService.getPhone(provider)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto flex-row">
                                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none rounded-xl border-[var(--border)] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 group/btn h-10 px-4" asChild>
                                        <a href={`tel:${NPIService.getPhone(provider)}`}>
                                            <Phone className="w-4 h-4 mr-2" />
                                            Call
                                        </a>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="rounded-xl hover:bg-[var(--surface2)] text-[var(--muted)] h-10 w-10 shrink-0" asChild>
                                        <a href={`https://www.google.com/search?q=${encodeURIComponent((provider.basic.organization_name || `${provider.basic.first_name} ${provider.basic.last_name}`) + " " + zipCode)}`} target="_blank" rel="noopener noreferrer" aria-label="Search online">
                                            <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="ghost" className="w-full text-[var(--muted)] font-bold text-sm h-12 rounded-2xl hover:bg-[var(--surface2)]" asChild>
                        <a href={`https://npiregistry.cms.hhs.gov/registry/search-results-table?address_purpose=LOCATION&postal_code=${zipCode}&taxonomy_description=${encodeURIComponent(PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].name)}`} target="_blank" rel="noopener noreferrer">
                            View More Professionals in Area
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                    </Button>
                </div>
            ) : (
                <div className="p-6 sm:p-12 text-center space-y-6 bg-[var(--surface2)] rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-[var(--border)]">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface)] mx-auto flex items-center justify-center shadow-sm border border-[var(--border)]">
                        <Search className="w-8 h-8 text-[var(--muted)]" />
                    </div>
                    <div className="space-y-2">
                        <p className="font-bold text-[var(--text)]">No matching providers found in {zipCode}</p>
                        <p className="text-sm text-[var(--muted)] max-w-xs mx-auto">Clinical registry matches for {PROVIDER_TYPES[activeType as keyof typeof PROVIDER_TYPES].name} in this exact ZIP can be limited.</p>
                    </div>
                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <Button variant="outline" className="rounded-xl h-12 border-[var(--border)] hover:bg-[var(--surface)]" onClick={fetchProviders}>
                            Retry NPI Search
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-12" asChild>
                            <a href={`https://www.psychologytoday.com/us/therapists?search=${zipCode}&category=autism`} target="_blank" rel="noopener noreferrer">
                                Try Psychology Today Instead
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
