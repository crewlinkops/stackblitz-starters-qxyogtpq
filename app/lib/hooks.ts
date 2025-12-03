import { useEffect, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

interface UseLoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLoadData<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
): UseLoadState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      setError(
        err?.message ||
        err?.error?.message ||
        JSON.stringify(err) ||
        "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch };
}

interface UseSubscriptionOptions {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
  onData?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useSubscription(
  supabase: SupabaseClient,
  options: UseSubscriptionOptions
) {
  useEffect(() => {
    const subscription = supabase
      .channel(`${options.table}-changes`)
      .on(
        "postgres_changes" as any,
        {
          event: options.event || "*",
          schema: "public",
          table: options.table,
          filter: options.filter,
        },
        (payload: any) => {
          if (options.onData) {
            options.onData(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to ${options.table}`);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, options.table]);
}
