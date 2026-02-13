'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { GitCommit, CheckCircle2, XCircle } from 'lucide-react';

interface DeployEvent {
  id: string;
  version: string;
  gitCommit: string | null;
  changesSummary: string | null;
  status: string;
  environment: string;
  deployedAt: string;
}

export default function DeployTimeline({ events }: { events: DeployEvent[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">Deploy History</h3>
      <ul className="space-y-3">
        {events.length === 0 ? (
          <li className="text-muted-foreground text-sm">No deploy events yet</li>
        ) : (
          events.map((e, i) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
            >
              {e.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-violet-600 dark:text-violet-400 font-medium">{e.version}</span>
                  {e.gitCommit && (
                    <span className="text-muted-foreground text-xs font-mono flex items-center gap-1">
                      <GitCommit className="w-3 h-3" />
                      {e.gitCommit.slice(0, 7)}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">{e.environment}</span>
                </div>
                {e.changesSummary && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{e.changesSummary}</p>
                )}
                <p className="text-muted-foreground text-xs mt-1">{format(new Date(e.deployedAt), 'PPp')}</p>
              </div>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
}
