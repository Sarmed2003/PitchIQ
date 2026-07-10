export function formatPoints(n: number | null | undefined): string {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(
    n,
  );
}
