// Hand-rolled HTML so we don't pull in the @react-email runtime just for one
// transactional email. Resend serializes it directly.
export function draftInviteEmail(opts: {
  leagueName: string;
  inviteCode: string;
  appUrl: string;
}): string {
  const link = `${opts.appUrl}/league/join`;
  return `
    <div style="font-family:system-ui,sans-serif;background:#0a0f1e;color:#f1f5f9;padding:24px;">
      <h1 style="color:#00d4aa;font-size:20px;">You're invited to ${escapeHtml(opts.leagueName)}</h1>
      <p>Join PitchIQ and enter this code:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${escapeHtml(opts.inviteCode)}</p>
      <p><a href="${escapeHtml(link)}" style="color:#00d4aa;">Open join page</a></p>
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
