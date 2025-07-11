import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/utils/apiUtils';

export interface MatchingChoices {
  dates: string[];
  locations: string[];
}

export interface MatchedUser {
  userId: string;
  [key: string]: any;
}

export interface UseMatchingStatusResult {
  status?: string;
  matchedUser: MatchedUser | null;
  matchId: string | null;
  myChoices: MatchingChoices | null;
  otherChoices: MatchingChoices | null;
  loading: boolean;
  error: string | null;
  showFailedModal: boolean;
  showCardModal: boolean;
  refresh: () => void;
}

export function useMatchingStatus(userId?: string): UseMatchingStatusResult {
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [myChoices, setMyChoices] = useState<MatchingChoices | null>(null);
  const [otherChoices, setOtherChoices] = useState<MatchingChoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const fetchStatus = () => {
    if (!userId) return;
    setLoading(true);
    apiGet('/matching-status', { userId })
      .then(res => {
        setStatus(res.status);
        setMatchedUser(res.matchedUser || null);
        setMatchId(res.matchId || null);
        setMyChoices(res.myChoices || null);
        setOtherChoices(res.otherChoices || null);
        setShowFailedModal(res.status === 'failed');
        setShowCardModal(!!res.matchedUser);
      })
      .catch(e => setError(e.message || '매칭 상태를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    status,
    matchedUser,
    matchId,
    myChoices,
    otherChoices,
    loading,
    error,
    showFailedModal,
    showCardModal,
    refresh: fetchStatus,
  };
} 