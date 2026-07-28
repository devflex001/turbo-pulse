"use client"

import * as React from "react"
import { useAction } from "convex/react"
import { Globe, Loader2 } from "lucide-react"

import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|(?:www\.[^\s<]+[^<.,:;"')\]\s]))/g

type OgMetadata = {
  title?: string
  description?: string
  image?: string
  domain?: string
  url?: string
}

const ogCache = new Map<string, OgMetadata | null>()

function LinkPreviewCard({ url, isPrimary }: { url: string; isPrimary: boolean }) {
  const [data, setData] = React.useState<OgMetadata | null | undefined>(() => {
    return ogCache.has(url) ? ogCache.get(url) : undefined
  })
  const fetchOg = useAction(api.supportChat.fetchOgMetadata)

  React.useEffect(() => {
    if (ogCache.has(url)) {
      setData(ogCache.get(url))
      return
    }

    let active = true
    fetchOg({ url })
      .then((res) => {
        if (!active) return
        ogCache.set(url, res)
        setData(res)
      })
      .catch(() => {
        if (!active) return
        ogCache.set(url, null)
        setData(null)
      })

    return () => {
      active = false
    }
  }, [url, fetchOg])

  if (data === undefined) {
    return (
      <div
        className={cn(
          "mt-2 flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors",
          isPrimary
            ? "border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground/75"
            : "border-border bg-background/50 text-muted-foreground"
        )}
      >
        <Loader2 className="size-3.5 animate-spin shrink-0" />
        <span className="truncate">Loading link preview...</span>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const targetUrl = data.url || url

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "mt-2.5 flex flex-col overflow-hidden rounded-lg border text-left transition-all hover:opacity-95 shadow-sm block group",
        isPrimary
          ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-card/90"
      )}
    >
      {data.image && (
        <div className="relative max-h-36 w-full overflow-hidden bg-muted/30">
          <img
            src={data.image}
            alt={data.title || "Preview"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none"
            }}
          />
        </div>
      )}
      <div className="flex flex-col gap-1 p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-75">
          <Globe className="size-3 shrink-0" />
          <span className="truncate">{data.domain || "LINK"}</span>
        </div>
        {data.title && (
          <p className="line-clamp-1 text-xs font-bold leading-tight">
            {data.title}
          </p>
        )}
        {data.description && (
          <p
            className={cn(
              "line-clamp-2 text-[11px] leading-snug",
              isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {data.description}
          </p>
        )}
      </div>
    </a>
  )
}

export function MessageWithLinks({
  text,
  isPrimary = false,
}: {
  text: string
  isPrimary?: boolean
}) {
  const parts = React.useMemo(() => {
    return text.split(URL_REGEX)
  }, [text])

  const uniqueUrls = React.useMemo(() => {
    const matches = text.match(URL_REGEX)
    if (!matches) return []
    const normalized = matches.map((m) => (m.startsWith("www.") ? `https://${m}` : m))
    return Array.from(new Set(normalized)).slice(0, 2)
  }, [text])

  return (
    <div className="space-y-1">
      <p className="whitespace-pre-wrap break-words leading-relaxed">
        {parts.map((part, index) => {
          const isUrl = /^(https?:\/\/|www\.)/i.test(part)
          if (isUrl) {
            const href = part.startsWith("www.") ? `https://${part}` : part
            return (
              <a
                key={index}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "underline font-semibold hover:opacity-80 break-all transition-opacity",
                  isPrimary ? "text-primary-foreground" : "text-primary"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            )
          }
          return <React.Fragment key={index}>{part}</React.Fragment>
        })}
      </p>
      {uniqueUrls.map((url) => (
        <LinkPreviewCard key={url} url={url} isPrimary={isPrimary} />
      ))}
    </div>
  )
}
