import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /** Forward browser API calls to the separately running backend without changing its CORS settings. */
  rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:8000"
    return [{ source: "/backend/:path*", destination: `${backend}/:path*` }]
  },
}

export default nextConfig
