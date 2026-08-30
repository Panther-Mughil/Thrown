// Centralised server configuration.
// Values are read from environment variables with development fallbacks.

export const CORS_ORIGIN: string = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export const PORT: number = Number(process.env.PORT ?? 3001);
