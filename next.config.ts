import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Cabeceras de seguridad de bajo riesgo (ninguna de estas depende de
// listar dominios externos, asi que no hay riesgo de romper PayPal,
// Supabase o Sentry por una lista incompleta).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Content-Security-Policy, en modo REPORT-ONLY a proposito.
//
// Dominios externos que el navegador SI contacta directamente hoy
// (confirmado por busqueda en todo app/, no supuesto):
// - PayPal SDK: <script src="https://www.paypal.com/sdk/js...">
//   en app/subscribe/page.tsx y app/accounting/ar-invoices/page.tsx.
//   El SDK de PayPal a su vez abre iframes/popups y llama a sus propios
//   dominios (paypalobjects.com, api-m.paypal.com) -- se permite todo
//   *.paypal.com y *.paypalobjects.com para no romper su checkout.
// - Supabase: app/lib/supabase/client.ts usa createBrowserClient con
//   NEXT_PUBLIC_SUPABASE_URL directo (no pasa por el tunnelRoute), tanto
//   para REST (https) como para realtime (wss). Se permite *.supabase.co
//   en vez del projectRef exacto para no hardcodear ese valor aqui.
// - Sentry: NO corre en el navegador en este proyecto (no existe
//   sentry.client.config.ts ni instrumentation-client.ts, solo
//   sentry.server.config.ts / sentry.edge.config.ts) -- cero necesidad
//   de permitir ingest.sentry.io desde connect-src.
// - Fuentes: next/font/google autohospeda los archivos en el propio
//   dominio en produccion, no se contacta fonts.googleapis.com en
//   tiempo de ejecucion.
//
// Por que Report-Only y no bloqueante todavia: esta lista se armo por
// busqueda estatica en el codigo, no probandola contra el sitio real en
// un navegador (este entorno no tiene uno) -- el riesgo exacto que ya
// se habia señalado antes (una CSP mal calibrada rompe el checkout o el
// login en silencio) sigue siendo real si se activara bloqueante de
// una vez. En modo Report-Only el navegador NUNCA bloquea nada, solo
// registra en la consola (F12 -> Console) cualquier recurso que la
// politica habria bloqueado. Antes de pasarla a bloqueante (quitar
// "-Report-Only" del nombre de la cabecera abajo), navega al menos por:
// login, el dashboard principal, una suscripcion por PayPal
// (/subscribe) y un cobro de factura por PayPal (/accounting/ar-invoices),
// y confirma que la consola no muestra ningun "Refused to ..." –
// si aparece alguno, el dominio que falta se agrega a la lista aqui.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.paypal.com https://www.paypalobjects.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com",
  "frame-src 'self' https://www.paypal.com",
  "form-action 'self' https://www.paypal.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

securityHeaders.push({
  key: "Content-Security-Policy-Report-Only",
  value: cspDirectives,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options
  org: "audit-global-intelligence",
  project: "agi-platform",
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  }
});