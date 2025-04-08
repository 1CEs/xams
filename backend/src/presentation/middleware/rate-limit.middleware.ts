import Elysia from "elysia";

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Configuration options
interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Maximum number of requests per window
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
};

export const rateLimit = (options: RateLimitOptions = {}) => {
  const { windowMs = defaultOptions.windowMs, maxRequests = defaultOptions.maxRequests } = options;

  return (app: Elysia) =>
    app.derive(({ request, set }) => {
      const ip = request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 "unknown";
      
      const now = Date.now();
      const key = `${ip}`;
      
      // Get or initialize rate limit data for this IP
      let rateData = rateLimitStore.get(key);
      
      // If no data exists or the window has expired, reset the counter
      if (!rateData || now > rateData.resetTime) {
        rateData = {
          count: 0,
          resetTime: now + windowMs,
        };
        rateLimitStore.set(key, rateData);
      }
      
      // Increment the counter
      rateData.count++;
      
      // Set rate limit headers
      set.headers["X-RateLimit-Limit"] = maxRequests.toString();
      set.headers["X-RateLimit-Remaining"] = Math.max(0, maxRequests - rateData.count).toString();
      set.headers["X-RateLimit-Reset"] = Math.ceil(rateData.resetTime / 1000).toString();
      
      // Check if rate limit exceeded
      if (rateData.count > maxRequests) {
        set.status = 429; // Too Many Requests
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      
      return {};
    });
}; 