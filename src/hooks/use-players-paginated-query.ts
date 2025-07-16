import { useQuery } from "@tanstack/react-query";
import { getPlayersByUserPaginated, PaginatedPlayersResult } from "@/lib/actions/players";

interface UsePlayersPaginatedQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'recent' | 'mainFirst';
  searchQuery?: string;
}

/**
 * usePlayersPaginatedQuery - Fetches and caches paginated players using React Query.
 * @param options - Pagination and sorting options
 * @returns { data, isLoading, isError, error, refetch }
 */
export function usePlayersPaginatedQuery(options: UsePlayersPaginatedQueryOptions = {}) {
  return useQuery<PaginatedPlayersResult, Error>({
    queryKey: ["players", "paginated", options],
    queryFn: () => getPlayersByUserPaginated(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
} 