'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
  className?: string;
}

const SIZES = {
  sm: { outer: 50, inner: 35, height: 100 },
  md: { outer: 70, inner: 50, height: 140 },
  lg: { outer: 90, inner: 65, height: 180 },
};

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 'md',
  showLegend = true,
  className = '',
}: DonutChartProps) {
  const { outer, inner, height } = SIZES[size];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={inner}
              outerRadius={outer}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DonutChartData;
                  const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div className="bg-slate-900 dark:bg-slate-950 px-4 py-3 rounded-xl border border-slate-700 shadow-2xl">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-white text-base font-semibold">{item.name}</span>
                      </div>
                      <div className="text-slate-300 text-sm font-medium mt-1.5">
                        {item.value.toLocaleString()} ({percent}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue !== undefined && (
              <span className="text-foreground font-bold text-xl leading-none">
                {typeof centerValue === 'number' ? centerValue.toLocaleString() : centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-foreground/80 text-sm font-medium mt-0.5">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2">
          {data.map((item, index) => {
            const percent = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-foreground font-medium min-w-0 truncate max-w-[110px]">
                  {item.name}
                </span>
                <span className="text-foreground font-semibold ml-auto tabular-nums">
                  {item.value} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
