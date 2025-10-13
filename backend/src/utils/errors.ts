export function apiError(message: string, code = 400) {
  return { error: message, code };
}
