type JsonPrimitive = string | number | boolean | null;

type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  required?: string[];
  enum?: JsonValue[];
  description?: string;
  format?: string;
  additionalProperties?: boolean | JsonSchema;
  [key: string]: unknown;
};

export type ResponseFormat =
  | {
      type: "text";
    }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict?: boolean;
        schema: JsonSchema;
      };
    };

export type ModelOptions = {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number;
  metadata?: Record<string, JsonValue>;
};

export type RequestOptions = {
  systemMessage?: string;
  responseFormat?: ResponseFormat;
  modelOptions?: Partial<ModelOptions>;
  metadata?: Record<string, JsonValue>;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
};

export type ServiceConfiguration = {
  apiKeyMasked: string;
  baseUrl: string;
  systemMessage: string;
  responseFormat: ResponseFormat;
  modelOptions: ModelOptions;
  maxRetries: number;
  retryDelayMs: number;
};

type RequestPayload = {
  userMessage: string;
  systemMessage: string;
  responseFormat: ResponseFormat;
  modelOptions: ModelOptions;
  metadata?: Record<string, JsonValue>;
};

type BuiltRequest = {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

type OpenRouterChatCompletionResponse = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    finish_reason?: string;
    index: number;
    message: {
      role: string;
      content: string | Array<{ type: string; text?: string }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message: string;
    type?: string;
    code?: string;
  };
};

export type ResponseData = {
  id: string;
  createdAt: number;
  model: string;
  content: string;
  usage?: OpenRouterChatCompletionResponse["usage"];
  raw: OpenRouterChatCompletionResponse;
};

type Logger = {
  debug?: (message: string, meta?: Record<string, unknown>) => void;
  info?: (message: string, meta?: Record<string, unknown>) => void;
  warn?: (message: string, meta?: Record<string, unknown>) => void;
  error?: (message: string, meta?: Record<string, unknown>) => void;
};

type HttpClientRequest = {
  url: string;
  headers?: Record<string, string>;
  body: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type HttpClient = {
  post<TResponse>(request: HttpClientRequest): Promise<TResponse>;
};

type OpenRouterServiceOptions = {
  apiKey?: string;
  baseUrl?: string;
  defaultSystemMessage?: string;
  defaultResponseFormat?: ResponseFormat;
  defaultModelOptions?: ModelOptions;
  httpClient?: HttpClient;
  logger?: Logger;
  maxRetries?: number;
  retryDelayMs?: number;
};

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openrouter/auto";
const DEFAULT_SYSTEM_MESSAGE =
  "Jesteś asystentem generującym fiszki. Odpowiadaj zwięźle i strukturalnie.";
const DEFAULT_RESPONSE_FORMAT: ResponseFormat = { type: "text" };
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 250;

const SERVICE_ERROR_CODES = {
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  API_ERROR: "API_ERROR",
  HTTP_ERROR: "HTTP_ERROR",
} as const;

type ServiceErrorCode = (typeof SERVICE_ERROR_CODES)[keyof typeof SERVICE_ERROR_CODES];

export class OpenRouterServiceError extends Error {
  constructor(
    message: string,
    readonly code: ServiceErrorCode,
    readonly status?: number,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "OpenRouterServiceError";
  }

  static configuration(message: string): OpenRouterServiceError {
    return new OpenRouterServiceError(message, SERVICE_ERROR_CODES.CONFIGURATION_ERROR);
  }

  static validation(message: string): OpenRouterServiceError {
    return new OpenRouterServiceError(message, SERVICE_ERROR_CODES.VALIDATION_ERROR, 400);
  }

  static network(message: string, cause?: unknown): OpenRouterServiceError {
    return new OpenRouterServiceError(message, SERVICE_ERROR_CODES.NETWORK_ERROR, undefined, cause);
  }

  static timeout(message: string): OpenRouterServiceError {
    return new OpenRouterServiceError(message, SERVICE_ERROR_CODES.TIMEOUT);
  }

  static http(status: number, message: string, cause?: unknown): OpenRouterServiceError {
    return new OpenRouterServiceError(message, SERVICE_ERROR_CODES.HTTP_ERROR, status, cause);
  }

  static api(status: number, message: string, cause?: unknown): OpenRouterServiceError {
    return new OpenRouterServiceError(message, SERVICE_ERROR_CODES.API_ERROR, status, cause);
  }
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) {
    return "*".repeat(apiKey.length);
  }

  return apiKey
    .split("")
    .map((char, index) => (index < apiKey.length - 4 ? "*" : char))
    .join("");
}

function createConsoleLogger(): Logger {
  return {
    info: (message, meta) => console.info(`[OpenRouterService] ${message}`, meta),
    warn: (message, meta) => console.warn(`[OpenRouterService] ${message}`, meta),
    error: (message, meta) => console.error(`[OpenRouterService] ${message}`, meta),
    debug: (message, meta) => console.debug(`[OpenRouterService] ${message}`, meta),
  };
}

const defaultHttpClient: HttpClient = {
  async post<TResponse>({ url, headers, body, signal, timeoutMs }: HttpClientRequest): Promise<TResponse> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const forwardAbort = (abortSignal: AbortSignal) => {
      if (abortSignal.aborted) {
        controller.abort(abortSignal.reason);
        return;
      }

      const handler = () => controller.abort(abortSignal.reason);
      abortSignal.addEventListener("abort", handler, { once: true });
    };

    if (signal) {
      forwardAbort(signal);
    }

    if (typeof timeoutMs === "number") {
      timeoutId = setTimeout(() => {
        controller.abort(new DOMException("Timeout exceeded", "TimeoutError"));
      }, timeoutMs);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const raw = await response.text();
      const parsed = raw ? safeJsonParse(raw) : null;

      if (!response.ok) {
        let message = `Żądanie OpenRouter zakończyło się statusem ${response.status}`;

        if (
          parsed &&
          typeof parsed === "object" &&
          parsed !== null &&
          "error" in parsed &&
          typeof parsed.error === "object" &&
          parsed.error !== null &&
          "message" in parsed.error &&
          typeof parsed.error.message === "string"
        ) {
          message = parsed.error.message;
        }

        throw OpenRouterServiceError.http(response.status, message, parsed);
      }

      return parsed as TResponse;
    } catch (error) {
      if (error instanceof OpenRouterServiceError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw OpenRouterServiceError.timeout("Przekroczono limit czasu żądania OpenRouter.");
      }

      if ((error as Error)?.name === "AbortError") {
        throw OpenRouterServiceError.timeout("Żądanie OpenRouter zostało przerwane.");
      }

      throw OpenRouterServiceError.network("Wystąpił błąd sieci podczas wywołania OpenRouter.", error);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  },
};

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isJsonSchemaFormat(format: ResponseFormat): format is Extract<ResponseFormat, { type: "json_schema" }> {
  return format.type === "json_schema";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveApiKey(provided?: string): string {
  const fallback = import.meta.env.OPENROUTER_API_KEY;
  const apiKey = provided ?? fallback;

  if (!apiKey) {
    throw OpenRouterServiceError.configuration(
      "Brak klucza API OpenRouter. Ustaw OPENROUTER_API_KEY lub przekaż go w konstruktorze."
    );
  }

  return apiKey;
}

export class OpenRouterService {
  readonly apiKey: string;
  readonly baseUrl: string;
  private _defaultSystemMessage: string;
  private _defaultResponseFormat: ResponseFormat;
  private _defaultModelOptions: ModelOptions;
  private readonly _httpClient: HttpClient;
  private readonly _logger: Logger;
  private readonly _maxRetries: number;
  private readonly _retryDelayMs: number;

  constructor(options: OpenRouterServiceOptions = {}) {
    this.apiKey = resolveApiKey(options.apiKey);
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this._defaultSystemMessage = options.defaultSystemMessage ?? DEFAULT_SYSTEM_MESSAGE;
    this._defaultResponseFormat = options.defaultResponseFormat ?? DEFAULT_RESPONSE_FORMAT;
    this._defaultModelOptions = options.defaultModelOptions ?? { model: DEFAULT_MODEL, temperature: 0.2 };
    this._httpClient = options.httpClient ?? defaultHttpClient;
    this._logger = options.logger ?? createConsoleLogger();
    this._maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this._retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  }

  get defaultSystemMessage(): string {
    return this._defaultSystemMessage;
  }

  get defaultResponseFormat(): ResponseFormat {
    return this._defaultResponseFormat;
  }

  get defaultModelOptions(): ModelOptions {
    return this._defaultModelOptions;
  }

  setSystemMessage(systemMessage: string): void {
    if (typeof systemMessage !== "string" || systemMessage.trim().length === 0) {
      throw OpenRouterServiceError.validation("System message musi być niepustym ciągiem znaków.");
    }

    this._defaultSystemMessage = systemMessage.trim();
  }

  setResponseFormat(responseFormat: ResponseFormat): void {
    if (!responseFormat || typeof responseFormat !== "object") {
      throw OpenRouterServiceError.validation("Response format musi być poprawnym obiektem.");
    }

    if (isJsonSchemaFormat(responseFormat)) {
      if (!responseFormat.json_schema?.name || !responseFormat.json_schema?.schema) {
        throw OpenRouterServiceError.validation("json_schema wymaga pól name oraz schema.");
      }
    }

    this._defaultResponseFormat = responseFormat;
  }

  configureModel(options: ModelOptions): void {
    if (!options?.model || typeof options.model !== "string") {
      throw OpenRouterServiceError.validation("Model jest wymagany w konfiguracji.");
    }

    this._defaultModelOptions = {
      ...this._defaultModelOptions,
      ...options,
    };
  }

  getConfiguration(): ServiceConfiguration {
    return {
      apiKeyMasked: maskApiKey(this.apiKey),
      baseUrl: this.baseUrl,
      systemMessage: this._defaultSystemMessage,
      responseFormat: this._defaultResponseFormat,
      modelOptions: this._defaultModelOptions,
      maxRetries: this._maxRetries,
      retryDelayMs: this._retryDelayMs,
    };
  }

  async sendMessage(message: string, options: RequestOptions = {}): Promise<ResponseData> {
    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    if (trimmedMessage.length === 0) {
      throw OpenRouterServiceError.validation("Treść wiadomości użytkownika jest wymagana.");
    }

    const payload: RequestPayload = {
      userMessage: trimmedMessage,
      systemMessage: options.systemMessage?.trim() ?? this._defaultSystemMessage,
      responseFormat: options.responseFormat ?? this._defaultResponseFormat,
      modelOptions: {
        ...this._defaultModelOptions,
        ...(options.modelOptions ?? {}),
      },
      metadata: options.metadata,
    };

    this._validateRequest(payload);

    const builtRequest = this._buildRequest(payload);

    const maxRetries = options.maxRetries ?? this._maxRetries;
    let attempt = 0;
    let lastError: OpenRouterServiceError | null = null;

    while (attempt <= maxRetries) {
      try {
        const response = await this._httpClient.post<OpenRouterChatCompletionResponse>({
          url: builtRequest.url,
          headers: builtRequest.headers,
          body: builtRequest.body,
          signal: options.signal,
          timeoutMs: options.timeoutMs,
        });

        return this._handleApiResponse(response);
      } catch (error) {
        const normalizedError = this._normalizeError(error);
        lastError = normalizedError;
        const shouldRetry = this._shouldRetry(normalizedError, attempt, maxRetries);

        if (!shouldRetry) {
          this._logError(normalizedError, { attempt });
          throw normalizedError;
        }

        const delay = this._retryDelayMs * Math.pow(2, attempt);
        await wait(delay);
      } finally {
        attempt += 1;
      }
    }

    throw lastError ?? OpenRouterServiceError.network("Nie udało się uzyskać odpowiedzi z OpenRouter.");
  }

  private _validateRequest(payload: RequestPayload): boolean {
    if (!payload.systemMessage || payload.systemMessage.trim().length === 0) {
      throw OpenRouterServiceError.validation("System message jest wymagany.");
    }

    if (!payload.modelOptions?.model) {
      throw OpenRouterServiceError.validation("Model jest wymagany.");
    }

    if (payload.responseFormat.type === "json_schema") {
      const { json_schema: jsonSchema } = payload.responseFormat;
      if (!jsonSchema?.name || !jsonSchema?.schema) {
        throw OpenRouterServiceError.validation("json_schema wymaga pól name oraz schema.");
      }
    }

    return true;
  }

  private _buildRequest(payload: RequestPayload): BuiltRequest {
    const { modelOptions, systemMessage, userMessage, responseFormat, metadata } = payload;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": "https://10xcards.ai",
      "X-Title": "10xCards AI",
    };

    const body: Record<string, unknown> = {
      model: modelOptions.model,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: modelOptions.temperature,
      top_p: modelOptions.topP,
      presence_penalty: modelOptions.presencePenalty,
      frequency_penalty: modelOptions.frequencyPenalty,
      max_tokens: modelOptions.maxTokens,
      seed: modelOptions.seed,
      response_format: responseFormat,
    };

    if (metadata) {
      body.metadata = metadata;
    }

    return {
      url: `${this.baseUrl}/chat/completions`,
      headers,
      body,
    };
  }

  private _handleApiResponse(response: OpenRouterChatCompletionResponse): ResponseData {
    if (!response || typeof response !== "object") {
      throw OpenRouterServiceError.api(500, "Nieprawidłowa odpowiedź z OpenRouter.");
    }

    if (response.error) {
      throw OpenRouterServiceError.api(500, response.error.message ?? "Błąd API OpenRouter.", response.error);
    }

    if (!Array.isArray(response.choices) || response.choices.length === 0) {
      throw OpenRouterServiceError.api(500, "Odpowiedź OpenRouter nie zawiera żadnych opcji.");
    }

    const [firstChoice] = response.choices;
    const { message } = firstChoice;

    if (!message?.content) {
      throw OpenRouterServiceError.api(500, "Odpowiedź OpenRouter nie zawiera treści wiadomości.");
    }

    const content =
      typeof message.content === "string"
        ? message.content
        : message.content
            .map((part) => part.text)
            .filter((text): text is string => typeof text === "string")
            .join("\n")
            .trim();

    if (!content) {
      throw OpenRouterServiceError.api(500, "OpenRouter zwrócił pustą wiadomość.");
    }

    return {
      id: response.id,
      createdAt: response.created,
      model: response.model,
      content,
      usage: response.usage,
      raw: response,
    };
  }

  private _normalizeError(error: unknown): OpenRouterServiceError {
    if (error instanceof OpenRouterServiceError) {
      return error;
    }

    if (error instanceof Error) {
      return OpenRouterServiceError.api(500, error.message, error);
    }

    return OpenRouterServiceError.api(500, "Nieznany błąd OpenRouterService.", error);
  }

  private _shouldRetry(error: OpenRouterServiceError, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false;
    }

    if (error.code === SERVICE_ERROR_CODES.NETWORK_ERROR || error.code === SERVICE_ERROR_CODES.TIMEOUT) {
      return true;
    }

    if (error.status && (error.status === 429 || error.status >= 500)) {
      return true;
    }

    return false;
  }

  private _logError(error: OpenRouterServiceError, context?: Record<string, unknown>): void {
    this._logger.error?.(error.message, {
      code: error.code,
      status: error.status,
      ...context,
    });
  }
}

