import { apiClient } from './api';
import type { OverviewStatsData } from './types';

export const statisticsService = {
  getOverviewStats: async (range: '7d' | '30d' | 'ytd' = '30d'): Promise<OverviewStatsData> => {
    const { data } = await apiClient.get<OverviewStatsData>('/statistics/overview', {
      params: { range },
    });
    return data;
  },
};
