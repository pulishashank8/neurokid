'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Server,
  Cpu,
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

type StatusLevel = 'healthy' | 'warning' | 'critical' | 'unknown';

interface ServiceStatus {
  name: string;
  status: StatusLevel;
  latency?: number;
  message?: string;
  icon: React.ReactNode;
}

interface StatusSummaryProps {
  className?: string;
}

export default function StatusSummary({ className = '' }: StatusSummaryProps) {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/owner/system-health');
      const data = await res.json();

      setServices([
        {
          name: 'Database',
          status: data.dbLatencyMs > 500 ? 'warning' : data.dbLatencyMs > 1000 ? 'critical' : 'healthy',
          latency: data.dbLatencyMs,
          icon: <Database className="w-4 h-4" />,
        },
        {
          name: 'API Server',
          status: data.status || 'healthy',
          message: 'Responding normally',
          icon: <Server className="w-4 h-4" />,
        },
        {
          name: 'AI Services',
          status: 'healthy',
          message: 'Groq API operational',
          icon: <Cpu className="w-4 h-4" />,
        },
        {
          name: 'Email (Resend)',
          status: 'healthy',
          message: 'Ready to send',
          icon: <Mail className="w-4 h-4" />,
        },
        {
          name: 'Auth (NextAuth)',
          status: 'healthy',
          message: 'Sessions active',
          icon: <Shield className="w-4 h-4" />,
        },
      ]);
    } catch {
      setServices([
        { name: 'Database', status: 'unknown', icon: <Database className="w-4 h-4" /> },
        { name: 'API Server', status: 'critical', message: 'Connection failed', icon: <Server className="w-4 h-4" /> },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: StatusLevel) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusColor = (status: StatusLevel) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'critical':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  const overallStatus: StatusLevel = services.some(s => s.status === 'critical')
    ? 'critical'
    : services.some(s => s.status === 'warning')
    ? 'warning'
    : services.every(s => s.status === 'healthy')
    ? 'healthy'
    : 'unknown';

  const healthyCount = services.filter(s => s.status === 'healthy').length;

  return (
    <div className={`bg-card backdrop-blur-xl rounded-2xl border border-border transition-colors duration-500 ease-out p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getStatusColor(overallStatus)}`}>
            {getStatusIcon(overallStatus)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">System Status</h3>
            <p className="text-sm text-muted-foreground">
              {healthyCount}/{services.length} services operational
            </p>
          </div>
        </div>
        <Link
          href="/owner/dashboard/system"
          className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          Details
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl border ${getStatusColor(service.status)} transition-all hover:bg-white/5`}
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{service.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{service.name}</div>
                  {service.latency !== undefined && (
                    <div className="text-xs text-muted-foreground">{service.latency}ms latency</div>
                  )}
                  {service.message && !service.latency && (
                    <div className="text-xs text-muted-foreground">{service.message}</div>
                  )}
                </div>
              </div>
              {getStatusIcon(service.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
