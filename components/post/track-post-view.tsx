"use client"

import { useEffect } from "react"

import { apiClient } from "@/lib/api-client"

interface TrackPostViewProps {
  postSlug: string
}

export function TrackPostView({ postSlug }: TrackPostViewProps) {
  useEffect(() => {
    apiClient.trackPostView(postSlug).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to track post view", error)
      }
    })
  }, [postSlug])

  return null
}
