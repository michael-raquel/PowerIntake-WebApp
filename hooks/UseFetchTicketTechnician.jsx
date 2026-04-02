import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useFetchTimeline(ticketuuid) {
    const { accessToken } = useAuth();
    const [timeline, setTimeline]   = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);

    const fetchTimeline = useCallback(async () => {
        if (!ticketuuid || !accessToken) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/technicians?ticketuuid=${ticketuuid}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!res.ok) throw new Error('Failed to fetch timeline');

            const data = await res.json();
            setTimeline(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [ticketuuid, accessToken]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    return { timeline, loading, error, fetchTimeline };
}