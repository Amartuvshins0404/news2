import type { NextConfig } from "next"

const allowedSupabaseHost =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""

const remotePatterns = []

if (allowedSupabaseHost) {
  try {
    const { hostname, protocol } = new URL(allowedSupabaseHost)
    remotePatterns.push({
      protocol: protocol.replace(":", ""),
      hostname,
    })
  } catch {
    // ignore invalid URL
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
}

export default nextConfig
