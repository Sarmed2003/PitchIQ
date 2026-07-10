// Display helpers for scores, money, and relative time.
export function formatPoints(n: number | null | undefined): string {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(
    n,
  );
}

export function formatPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 1,
  }).format(n);
}
