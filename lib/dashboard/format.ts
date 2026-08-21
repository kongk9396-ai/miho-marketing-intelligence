export function formatWon(value: number): string {
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("ko-KR");
}

export function formatPercent(value: number | null, digits = 2): string {
  return value === null ? "—" : `${value.toFixed(digits)}%`;
}
