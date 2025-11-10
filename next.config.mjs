const allowedSupabaseHost =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";

/** @type {import('next').RemotePattern[]} */
const remotePatterns = [];

if (allowedSupabaseHost) {
  try {
    const { hostname, protocol } = new URL(allowedSupabaseHost);
    const normalizedProtocol = protocol === "https:" ? "https" : "http";
    remotePatterns.push({
      protocol: normalizedProtocol,
      hostname,
    });
  } catch {
    // ignore invalid URL
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
