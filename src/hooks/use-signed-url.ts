import { useQuery } from "@tanstack/react-query"
import { createSignedUrl } from "@/lib/storage"

/**
 * Returns a cached signed URL for a private storage object.
 * Cached for ~50 min so it is refreshed before the 1h signature expires.
 */
export function useSignedUrl(bucket: string, path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-url", bucket, path],
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
    queryFn: () => createSignedUrl(bucket, path as string),
  })
}
