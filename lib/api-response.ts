// Common envelope every route handler returns so the client side can branch
// on `ok` instead of inspecting status codes everywhere.
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

export function ok<T>(data: T, status = 200): ApiResponse<T> {
  return { data, error: null, status };
}

export function fail(message: string, status = 400): ApiResponse<null> {
  return { data: null, error: message, status };
}
