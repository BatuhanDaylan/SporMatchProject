export function getErrorMessage(e: unknown, fallback: string = String(e)): string {
  return e instanceof Error ? e.message : fallback;
}
