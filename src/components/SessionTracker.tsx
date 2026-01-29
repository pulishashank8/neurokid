'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SessionTracker() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== 'authenticated' || !session?.user) {
            return;
        }

        // Send initial heartbeat
        sendHeartbeat();

        // Send heartbeat every 60 seconds
        const interval = setInterval(sendHeartbeat, 60000);

        // Send heartbeat on window focus
        const handleFocus = () => sendHeartbeat();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [session, status]);

    async function sendHeartbeat() {
        try {
            await fetch('/api/session/heartbeat', { method: 'POST' });
        } catch (error) {
            // Silently fail - not critical
        }
    }

    return null; // This component doesn't render anything
}
