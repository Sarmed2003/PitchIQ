export function tradeOfferEmail(opts: {
  toTeam: string;
  fromTeam: string;
  appUrl: string;
}): string {
  return `
    <div style="font-family:system-ui,sans-serif;background:#0a0f1e;color:#f1f5f9;padding:24px;">
      <h1 style="color:#00d4aa;">New trade offer</h1>
      <p>${escapeHtml(opts.fromTeam)} sent a trade proposal to ${escapeHtml(opts.toTeam)}.</p>
      <p><a href="${escapeHtml(opts.appUrl + "/trades")}" style="color:#00d4aa;">Review in PitchIQ</a></p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
