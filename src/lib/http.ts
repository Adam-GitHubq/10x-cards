export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    message?: string
  ) {
    super(message ?? `Żądanie zakończyło się statusem ${status}.`);
    this.name = "HttpError";
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

type PostJsonInit = Omit<RequestInit, "body" | "method">;

export async function postJson<TRequest, TResponse>(
  url: string,
  body: TRequest,
  init: PostJsonInit = {}
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
    ...init,
  });

  const rawText = await response.text();
  let parsedBody: unknown = null;

  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "message" in parsedBody &&
      typeof parsedBody.message === "string"
        ? parsedBody.message
        : undefined;

    throw new HttpError(response.status, parsedBody, message);
  }

  return parsedBody as TResponse;
}
