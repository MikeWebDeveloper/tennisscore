import { useQuery } from "@tanstack/react-query";
import { getPlayersByUser } from "@/lib/actions/players";
import { Player } from "@/lib/types";

/**
 * usePlayersQuery - Fetches and caches the current user's players using React Query.
 * @returns { data, isLoading, isError, error, refetch }
 */
export function usePlayersQuery() {
  return useQuery<Player[], Error>({
    queryKey: ["players", "currentUser"],
    queryFn: getPlayersByUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
} 