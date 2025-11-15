/**
 * Serwis OpenRouter - integracja z API OpenRouter dla generowania fiszek
 *
 * Odpowiedzialności:
 * - Wysyłanie sformatowanych zapytań do API OpenRouter
 * - Walidacja i przetwarzanie odpowiedzi zgodnie z JSON Schema
 * - Konfiguracja parametrów modelu i obsługa błędów
 * - Mechanizmy retry dla błędów przejściowych
 */

// ============================================================================
// Typy i interfejsy
// ============================================================================

/**
 * Konfiguracja modelu LLM
 */
export type ModelOptions = {
  /** Nazwa modelu w OpenRouter (np. "openai/gpt-4o-mini") */
  model: string;
  /** Temperatura próbkowania (0.0 - 2.0) */
  temperature?: number;
  /** Maksymalna liczba tokenów w odpowiedzi */
  maxTokens?: number;
  /** Top-p próbkowanie */
  topP?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
};

/**
 * Format odpowiedzi zgodny z JSON Schema
 */
export type ResponseFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

/**
 * Pojedyncza wiadomość w konwersacji
 */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Opcje dla pojedynczego żądania
 */
export type RequestOptions = {
  /** Nadpisanie domyślnego modelu dla tego żądania */
  model?: string;
  /** Nadpisanie domyślnej temperatury */
  temperature?: number;
  /** Nadpisanie domyślnej liczby tokenów */
  maxTokens?: number;
  /** Timeout dla żądania w ms */
  timeout?: number;
};

/**
 * Payload żądania do API OpenRouter
 */
type RequestPayload = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
};

/**
 * Odpowiedź z API OpenRouter
 */
type OpenRouterResponse = {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Przetworzona odpowiedź dla klienta
 */
export type ResponseData<T = unknown> = {
  /** Sparsowana zawartość odpowiedzi */
  content: T;
  /** Model użyty do generowania */
  model: string;
  /** Statystyki użycia tokenów */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

/**
 * Aktualna konfiguracja serwisu
 */
export type ServiceConfiguration = {
  baseUrl: string;
  model: string;
  systemMessage: string;
  responseFormat?: ResponseFormat;
  modelOptions: ModelOptions;
};

/**
 * Opcje konfiguracyjne konstruktora
 */
export type OpenRouterServiceConfig = {
  /** Klucz API OpenRouter */
  apiKey: string;
  /** Adres bazowy API (opcjonalny) */
  baseUrl?: string;
  /** Domyślny komunikat systemowy */
  systemMessage?: string;
  /** Domyślny format odpowiedzi */
  responseFormat?: ResponseFormat;
  /** Domyślne opcje modelu */
  modelOptions?: Partial<ModelOptions>;
};

// ============================================================================
// Błędy
// ============================================================================

/**
 * Błąd serwisu OpenRouter
 */
export class OpenRouterServiceError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    readonly originalError?: unknown
  ) {
    super(message);
    this.name = "OpenRouterServiceError";
  }
}

const ERROR_CODES = {
  INVALID_API_KEY: "INVALID_API_KEY",
  INVALID_REQUEST: "INVALID_REQUEST",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  API_ERROR: "API_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RESPONSE_PARSE_ERROR: "RESPONSE_PARSE_ERROR",
  INVALID_RESPONSE_FORMAT: "INVALID_RESPONSE_FORMAT",
} as const;

const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_API_KEY]: "Nieprawidłowy klucz API OpenRouter.",
  [ERROR_CODES.INVALID_REQUEST]: "Nieprawidłowe dane żądania.",
  [ERROR_CODES.NETWORK_ERROR]: "Błąd połączenia sieciowego.",
  [ERROR_CODES.TIMEOUT_ERROR]: "Przekroczono limit czasu żądania.",
  [ERROR_CODES.RATE_LIMIT_ERROR]: "Przekroczono limit zapytań do API.",
  [ERROR_CODES.API_ERROR]: "Błąd API OpenRouter.",
  [ERROR_CODES.VALIDATION_ERROR]: "Błąd walidacji danych.",
  [ERROR_CODES.RESPONSE_PARSE_ERROR]: "Nie udało się sparsować odpowiedzi.",
  [ERROR_CODES.INVALID_RESPONSE_FORMAT]: "Odpowiedź nie jest zgodna z oczekiwanym formatem.",
} as const;

// ============================================================================
// Domyślne wartości
// ============================================================================

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_SYSTEM_MESSAGE = "Jesteś pomocnym asystentem do generowania fiszek edukacyjnych.";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT = 30000; // 30 sekund
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 sekunda

// ============================================================================
// Główna klasa serwisu
// ============================================================================

/**
 * Serwis do komunikacji z API OpenRouter
 */
export class OpenRouterService {
  // Pola prywatne
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private systemMessage: string;
  private responseFormat?: ResponseFormat;
  private modelOptions: ModelOptions;

  /**
   * Konstruktor serwisu OpenRouter
   *
   * @param config - Konfiguracja serwisu
   * @throws {OpenRouterServiceError} - Gdy brak wymaganej konfiguracji
   */
  constructor(config: OpenRouterServiceConfig) {
    // Walidacja wymaganej konfiguracji
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new OpenRouterServiceError("Klucz API jest wymagany", ERROR_CODES.INVALID_API_KEY);
    }

    // Inicjalizacja pól
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.systemMessage = config.systemMessage ?? DEFAULT_SYSTEM_MESSAGE;
    this.responseFormat = config.responseFormat;

    // Inicjalizacja opcji modelu z domyślnymi wartościami
    this.modelOptions = {
      model: config.modelOptions?.model ?? DEFAULT_MODEL,
      temperature: config.modelOptions?.temperature ?? DEFAULT_TEMPERATURE,
      maxTokens: config.modelOptions?.maxTokens ?? DEFAULT_MAX_TOKENS,
      topP: config.modelOptions?.topP,
      frequencyPenalty: config.modelOptions?.frequencyPenalty,
      presencePenalty: config.modelOptions?.presencePenalty,
    };
  }

  // ============================================================================
  // Metody publiczne
  // ============================================================================

  /**
   * Wysyła wiadomość do API OpenRouter
   *
   * @param message - Treść wiadomości użytkownika
   * @param options - Opcjonalne parametry żądania
   * @returns Przetworzona odpowiedź z API
   * @throws {OpenRouterServiceError} - W przypadku błędu komunikacji lub walidacji
   */
  async sendMessage<T = unknown>(message: string, options?: RequestOptions): Promise<ResponseData<T>> {
    // Walidacja wejścia
    if (!message || message.trim().length === 0) {
      throw new OpenRouterServiceError("Wiadomość nie może być pusta", ERROR_CODES.VALIDATION_ERROR);
    }

    // Budowanie payloadu
    const payload = this._buildRequest(message, options);

    // Walidacja payloadu
    this._validateRequest(payload);

    // Wysłanie żądania z retry
    const response = await this._sendRequestWithRetry(payload, options?.timeout);

    // Przetworzenie odpowiedzi
    return this._handleApiResponse<T>(response);
  }

  /**
   * Ustawia komunikat systemowy
   *
   * @param systemMessage - Nowy komunikat systemowy
   */
  setSystemMessage(systemMessage: string): void {
    if (!systemMessage || systemMessage.trim().length === 0) {
      throw new OpenRouterServiceError("Komunikat systemowy nie może być pusty", ERROR_CODES.VALIDATION_ERROR);
    }

    this.systemMessage = systemMessage;
  }

  /**
   * Ustawia format odpowiedzi zgodny z JSON Schema
   *
   * @param responseFormat - Format odpowiedzi
   */
  setResponseFormat(responseFormat: ResponseFormat): void {
    if (!responseFormat || responseFormat.type !== "json_schema") {
      throw new OpenRouterServiceError("Format odpowiedzi musi być typu json_schema", ERROR_CODES.VALIDATION_ERROR);
    }

    if (!responseFormat.json_schema?.name || !responseFormat.json_schema?.schema) {
      throw new OpenRouterServiceError("Format odpowiedzi musi zawierać nazwę i schemat", ERROR_CODES.VALIDATION_ERROR);
    }

    this.responseFormat = responseFormat;
  }

  /**
   * Konfiguruje opcje modelu
   *
   * @param options - Nowe opcje modelu
   */
  configureModel(options: Partial<ModelOptions>): void {
    if (options.model !== undefined) {
      if (!options.model || options.model.trim().length === 0) {
        throw new OpenRouterServiceError("Nazwa modelu nie może być pusta", ERROR_CODES.VALIDATION_ERROR);
      }
      this.modelOptions.model = options.model;
    }

    if (options.temperature !== undefined) {
      if (options.temperature < 0 || options.temperature > 2) {
        throw new OpenRouterServiceError("Temperatura musi być w zakresie 0-2", ERROR_CODES.VALIDATION_ERROR);
      }
      this.modelOptions.temperature = options.temperature;
    }

    if (options.maxTokens !== undefined) {
      if (options.maxTokens < 1) {
        throw new OpenRouterServiceError(
          "Maksymalna liczba tokenów musi być większa od 0",
          ERROR_CODES.VALIDATION_ERROR
        );
      }
      this.modelOptions.maxTokens = options.maxTokens;
    }

    if (options.topP !== undefined) {
      this.modelOptions.topP = options.topP;
    }

    if (options.frequencyPenalty !== undefined) {
      this.modelOptions.frequencyPenalty = options.frequencyPenalty;
    }

    if (options.presencePenalty !== undefined) {
      this.modelOptions.presencePenalty = options.presencePenalty;
    }
  }

  /**
   * Zwraca aktualną konfigurację serwisu
   *
   * @returns Kopia aktualnej konfiguracji
   */
  getConfiguration(): ServiceConfiguration {
    return {
      baseUrl: this.baseUrl,
      model: this.modelOptions.model,
      systemMessage: this.systemMessage,
      responseFormat: this.responseFormat ? { ...this.responseFormat } : undefined,
      modelOptions: { ...this.modelOptions },
    };
  }

  // ============================================================================
  // Metody prywatne
  // ============================================================================

  /**
   * Buduje obiekt żądania do API
   *
   * @param message - Wiadomość użytkownika
   * @param options - Opcjonalne parametry
   * @returns Payload żądania
   */
  private _buildRequest(message: string, options?: RequestOptions): RequestPayload {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: this.systemMessage,
      },
      {
        role: "user",
        content: message,
      },
    ];

    const payload: RequestPayload = {
      model: options?.model ?? this.modelOptions.model,
      messages,
      temperature: options?.temperature ?? this.modelOptions.temperature,
      max_tokens: options?.maxTokens ?? this.modelOptions.maxTokens,
    };

    // Dodanie opcjonalnych parametrów
    if (this.modelOptions.topP !== undefined) {
      payload.top_p = this.modelOptions.topP;
    }

    if (this.modelOptions.frequencyPenalty !== undefined) {
      payload.frequency_penalty = this.modelOptions.frequencyPenalty;
    }

    if (this.modelOptions.presencePenalty !== undefined) {
      payload.presence_penalty = this.modelOptions.presencePenalty;
    }

    if (this.responseFormat) {
      payload.response_format = this.responseFormat;
    }

    return payload;
  }

  /**
   * Waliduje payload żądania
   *
   * @param payload - Payload do walidacji
   * @throws {OpenRouterServiceError} - Gdy payload jest nieprawidłowy
   */
  private _validateRequest(payload: RequestPayload): void {
    if (!payload.model || payload.model.trim().length === 0) {
      throw new OpenRouterServiceError("Model jest wymagany", ERROR_CODES.VALIDATION_ERROR);
    }

    if (!payload.messages || payload.messages.length === 0) {
      throw new OpenRouterServiceError("Wiadomości są wymagane", ERROR_CODES.VALIDATION_ERROR);
    }

    // Sprawdzenie czy wszystkie wiadomości mają wymagane pola
    for (const msg of payload.messages) {
      if (!msg.role || !msg.content) {
        throw new OpenRouterServiceError("Każda wiadomość musi mieć rolę i treść", ERROR_CODES.VALIDATION_ERROR);
      }
    }
  }

  /**
   * Wysyła żądanie do API z mechanizmem retry
   *
   * @param payload - Payload żądania
   * @param timeout - Timeout żądania w ms
   * @returns Odpowiedź z API
   */
  private async _sendRequestWithRetry(payload: RequestPayload, timeout?: number): Promise<OpenRouterResponse> {
    let lastError: unknown;
    let retryDelay = INITIAL_RETRY_DELAY;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this._sendRequest(payload, timeout);
      } catch (error) {
        lastError = error;

        // Nie retry dla błędów walidacji i autoryzacji
        if (
          error instanceof OpenRouterServiceError &&
          (error.code === ERROR_CODES.INVALID_API_KEY ||
            error.code === ERROR_CODES.VALIDATION_ERROR ||
            error.code === ERROR_CODES.INVALID_REQUEST)
        ) {
          throw error;
        }

        // Dla rate limit i błędów sieciowych - retry z exponential backoff
        if (attempt < MAX_RETRIES - 1) {
          await this._delay(retryDelay);
          retryDelay *= 2; // Exponential backoff
        }
      }
    }

    // Jeśli wszystkie próby się nie powiodły
    throw lastError;
  }

  /**
   * Wysyła pojedyncze żądanie do API
   *
   * @param payload - Payload żądania
   * @param timeout - Timeout żądania w ms
   * @returns Odpowiedź z API
   */
  private async _sendRequest(payload: RequestPayload, timeout?: number): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout ?? DEFAULT_TIMEOUT);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://10xcards.app",
          "X-Title": "10xCards",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Obsługa błędów HTTP
      if (!response.ok) {
        await this._handleHttpError(response);
      }

      const data = await response.json();
      return data as OpenRouterResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      // Obsługa timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterServiceError(
          ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
          ERROR_CODES.TIMEOUT_ERROR,
          408,
          error
        );
      }

      // Obsługa błędów sieciowych
      if (error instanceof TypeError) {
        throw new OpenRouterServiceError(
          ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
          ERROR_CODES.NETWORK_ERROR,
          undefined,
          error
        );
      }

      throw error;
    }
  }

  /**
   * Obsługuje błędy HTTP z API
   *
   * @param response - Odpowiedź HTTP
   * @throws {OpenRouterServiceError}
   */
  private async _handleHttpError(response: Response): Promise<never> {
    let errorBody: unknown;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    // Mapowanie kodów HTTP na kody błędów
    switch (response.status) {
      case 401:
      case 403:
        throw new OpenRouterServiceError(
          ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
          ERROR_CODES.INVALID_API_KEY,
          response.status,
          errorBody
        );

      case 400:
        throw new OpenRouterServiceError(
          ERROR_MESSAGES[ERROR_CODES.INVALID_REQUEST],
          ERROR_CODES.INVALID_REQUEST,
          response.status,
          errorBody
        );

      case 429:
        throw new OpenRouterServiceError(
          ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_ERROR],
          ERROR_CODES.RATE_LIMIT_ERROR,
          response.status,
          errorBody
        );

      default:
        throw new OpenRouterServiceError(
          ERROR_MESSAGES[ERROR_CODES.API_ERROR],
          ERROR_CODES.API_ERROR,
          response.status,
          errorBody
        );
    }
  }

  /**
   * Przetwarza odpowiedź z API
   *
   * @param response - Surowa odpowiedź z API
   * @returns Przetworzona odpowiedź
   * @throws {OpenRouterServiceError} - Gdy odpowiedź jest nieprawidłowa
   */
  private _handleApiResponse<T>(response: OpenRouterResponse): ResponseData<T> {
    // Walidacja struktury odpowiedzi
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterServiceError(
        ERROR_MESSAGES[ERROR_CODES.INVALID_RESPONSE_FORMAT],
        ERROR_CODES.INVALID_RESPONSE_FORMAT
      );
    }

    const choice = response.choices[0];

    if (!choice.message || !choice.message.content) {
      throw new OpenRouterServiceError(
        ERROR_MESSAGES[ERROR_CODES.INVALID_RESPONSE_FORMAT],
        ERROR_CODES.INVALID_RESPONSE_FORMAT
      );
    }

    // Parsowanie contentu
    let content: T;

    try {
      // Jeśli mamy response_format, oczekujemy JSON
      if (this.responseFormat) {
        content = JSON.parse(choice.message.content) as T;
      } else {
        content = choice.message.content as T;
      }
    } catch (error) {
      throw new OpenRouterServiceError(
        ERROR_MESSAGES[ERROR_CODES.RESPONSE_PARSE_ERROR],
        ERROR_CODES.RESPONSE_PARSE_ERROR,
        undefined,
        error
      );
    }

    // Budowanie odpowiedzi
    const result: ResponseData<T> = {
      content,
      model: response.model,
    };

    // Dodanie statystyk użycia jeśli dostępne
    if (response.usage) {
      result.usage = {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      };
    }

    return result;
  }

  /**
   * Pomocnicza funkcja do opóźnienia
   *
   * @param ms - Czas opóźnienia w ms
   */
  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Loguje błąd (do rozszerzenia w przyszłości)
   *
   * @param error - Błąd do zalogowania
   * @param context - Dodatkowy kontekst
   */
  private _logError(error: Error, context?: unknown): void {
    // TODO: Integracja z systemem logowania
    console.error("[OpenRouterService]", error.message, context);
  }
}
