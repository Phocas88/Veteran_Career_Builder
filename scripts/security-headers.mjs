// Keep the enforced baseline compatible with Firebase sign-in, Stripe redirects,
// PDF workers and existing third-party integrations. The fuller resource allowlist
// remains Report-Only until those integrations have been reviewed in production.
export const enforcedCsp = "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests";
export const pageCsp = "object-src 'none'; base-uri 'self'; upgrade-insecure-requests";
export const referrerPolicy = 'strict-origin-when-cross-origin';

export function protectHtml(html) {
  if (!/<head\b[^>]*>/i.test(html)) return html;
  const tags = [];
  if (!/<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(html)) {
    // frame-ancestors, HSTS, X-Frame-Options and nosniff require HTTP headers;
    // they cannot be supplied by a GitHub Pages HTML meta element.
    tags.push(`<meta http-equiv="Content-Security-Policy" content="${pageCsp}">`);
  }
  if (!/<meta\b[^>]*name\s*=\s*["']referrer["']/i.test(html)) {
    tags.push(`<meta name="referrer" content="${referrerPolicy}">`);
  }
  return tags.length ? html.replace(/<head\b[^>]*>/i, head => `${head}\n${tags.join('\n')}`) : html;
}
