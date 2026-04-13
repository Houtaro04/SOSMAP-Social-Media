import { useState, useEffect, useMemo, useCallback } from 'react';
import type { VolunteerResponse } from '@/shared/entities/VolunteerEntity';
import { volunteerService } from '@/shared/services/volunteerService';

export function useRescueViewModel() {
  const [volunteers, setVolunteers] = useState<VolunteerResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchVolunteers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await volunteerService.getVolunteers();
      setVolunteers(response.data);
    } catch (e) {
      console.error(e);
      setVolunteers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const filteredVolunteers = useMemo(() => {
    if (!searchQuery.trim()) return volunteers;
    const lowerQuery = searchQuery.toLowerCase();
    
    return volunteers.filter(r => {
      const matchName = r.name.toLowerCase().includes(lowerQuery);
      const matchRegion = r.regions.some(reg => reg.toLowerCase().includes(lowerQuery));
      return matchName || matchRegion;
    });
  }, [volunteers, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    volunteers: filteredVolunteers,
    isLoading,
    refresh: fetchVolunteers
  };
}

