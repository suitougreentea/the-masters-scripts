export function isNullOrEmptyString(string: unknown): string is null | "" {
  return string == null || string == "";
}
