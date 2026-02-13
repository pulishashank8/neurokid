'use client';

import { useState, useEffect } from 'react';
import { Calculator, Loader2, Zap, AlertTriangle } from 'lucide-react';

interface RunwayData {
  cashReserves: number;
  monthlyBurnRate: number;
  monthlyRevenue: number;
  runwayMonths: number | null;
  isProfitable: boolean;
}

interface RunwayCalculatorProps {
  className?: string;
  defaultCashReserves?: number;
}

export default function RunwayCalculator({
  className = '',
  defaultCashReserves = 0,
}: RunwayCalculatorProps) {
  const [cashReserves, setCashReserves] = useState(defaultCashReserves.toString());
  const [runway, setRunway] = useState<RunwayData | null>(null);
  const [loading, setLoading] = useState(true);

  const reserves = parseFloat(cashReserves) || 0;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/owner/revenue?mode=runway&cashReserves=${reserves}`)
      .then((r) => r.json())
      .then((res) => setRunway(res.runway ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reserves]);

  return (
    <div
      className={`bg-card backdrop-blur-xl rounded-2xl border border-border transition-colors duration-500 ease-out p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Runway Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Months until cash runs out (based on burn rate)
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-muted-foreground mb-2">Cash reserves ($)</label>
        <input
          type="number"
          min="0"
          step="100"
          value={cashReserves}
          onChange={(e) => setCashReserves(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      ) : runway ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/30 rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="w-3 h-3" />
                Monthly Burn
              </div>
              <div className="text-lg font-bold text-rose-400">
                ${runway.monthlyBurnRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-slate-900/30 rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="w-3 h-3" />
                Monthly Revenue
              </div>
              <div className="text-lg font-bold text-emerald-400">
                ${runway.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {runway.isProfitable ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm font-medium">
                Cash-flow positive — revenue covers costs. No runway limit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 rounded-xl p-4 ${
                  runway.runwayMonths !== null && runway.runwayMonths <= 3
                    ? 'bg-rose-500/10 border border-rose-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                {runway.runwayMonths !== null && runway.runwayMonths <= 3 && (
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <p className="text-white font-bold">
                    Runway: {runway.runwayMonths !== null ? `${runway.runwayMonths} months` : 'N/A'}
                  </p>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {runway.runwayMonths !== null
                      ? `At current burn ($${runway.monthlyBurnRate.toFixed(0)}/mo) and revenue ($${runway.monthlyRevenue.toFixed(0)}/mo), cash runs out in ${runway.runwayMonths} months.`
                      : 'Enter cash reserves above to calculate runway.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-slate-500 text-sm py-4">Unable to load runway data.</div>
      )}
    </div>
  );
}
