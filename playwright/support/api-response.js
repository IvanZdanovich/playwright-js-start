/**
 * Reads an `APIResponse` into a plain result while its request context is alive.
 * The body is parsed JSON when the response says so, otherwise text, so specs assert
 * `response.status` first and then `response.body` for both JSON and plain-text error bodies.
 */
export async function readResponse(response) {
  const headers = response.headers();
  const text = await response.text();
  const isJson = (headers['content-type'] || '').includes('application/json');
  return { status: response.status(), headers, body: isJson && text ? JSON.parse(text) : text };
}
