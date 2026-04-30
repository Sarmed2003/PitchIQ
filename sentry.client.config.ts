// Browser-side Sentry. Without a DSN this stays a no-op so dev stays quiet.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: true })],
  });
}
