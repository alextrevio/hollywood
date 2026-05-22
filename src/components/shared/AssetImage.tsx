import { useSignedUrl } from "@/hooks/use-signed-url"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface AssetImageProps {
  bucket: string
  path: string | null | undefined
  alt: string
  className?: string
}

/** Renders an object from a private bucket via a cached signed URL. */
export function AssetImage({ bucket, path, alt, className }: AssetImageProps) {
  const { data: url, isPending, isError } = useSignedUrl(bucket, path)

  if (!path || isError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-xs text-muted-foreground",
          className,
        )}
      >
        sin imagen
      </div>
    )
  }

  if (isPending || !url) {
    return <Skeleton className={className} />
  }

  return <img src={url} alt={alt} className={cn("object-cover", className)} />
}
