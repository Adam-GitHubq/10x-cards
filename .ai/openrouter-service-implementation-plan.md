# Przewodnik wdrożenia usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter umożliwia integrację z API OpenRouter w celu uzupełniania czatów opartych na modelach LLM. Odpowiada za:

- Wysyłanie sformatowanych zapytań zawierających komunikaty systemowe oraz użytkownika.
- Przyjmowanie i walidację odpowiedzi, w tym ustrukturyzowanego formatu odpowiedzi (response_format) zgodnie z ustalonym JSON Schema.
- Konfigurację parametrów modelu (nazwa modelu, parametry modelu) oraz centralną obsługę błędów.

## 2. Opis konstruktora

Konstruktor usługi powinien:

- Inicjalizować konfigurację domyślną (model, parametry, klucze autoryzacyjne).
- Przyjmować opcjonalne parametry umożliwiające nadpisanie wartości domyślnych.
- Łączyć komponenty walidacji, komunikacji API oraz obsługi błędów.
- Zapewniać mechanizmy monitoringu i logowania błędów.

## 3. Publiczne metody i pola

### Metody:

1. sendMessage(message: string, options?: RequestOptions): Promise<ResponseData>
   - Wysyła komunikat użytkownika do API, dołączając komunikat systemowy oraz opinie z konfiguracji.
2. setSystemMessage(systemMessage: string): void
   - Ustawia lub aktualizuje komunikat systemowy dla sesji.
3. setResponseFormat(responseFormat: ResponseFormat): void
   - Konfiguruje strukturę odpowiedzi zgodnie z ustalonym JSON Schema.
4. configureModel(options: ModelOptions): void
   - Umożliwia ustawienie parametrów modelu, takich jak nazwa modelu oraz specyficzne parametry (temperature, max_tokens, itp.).
5. getConfiguration(): ServiceConfiguration
   - Zwraca aktualne ustawienia usługi.

### Pola:

- piKey: string – Klucz API do autoryzacji wywołań.
- aseUrl: string – Adres bazowy API OpenRouter.
- defaultSystemMessage: string – Domyślny komunikat systemowy.
- defaultResponseFormat: ResponseFormat – Domyślny schemat odpowiedzi.
- defaultModelOptions: ModelOptions – Domyślna konfiguracja modelu.

## 4. Prywatne metody i pola

### Metody:

1. \_validateRequest(payload: RequestPayload): boolean
   - Prywatna metoda walidująca kompletność i poprawność danych wejściowych.
2. \_buildRequest(payload: RequestPayload): BuiltRequest
   - Buduje obiekt żądania w odpowiednim formacie wymaganym przez API.
3. \_handleApiResponse(response: any): ResponseData
   - Przetwarza odpowiedź z API, weryfikując zgodność z defaultResponseFormat.
4. \_logError(error: Error, context?: any): void
   - Rejestracja błędów i dodatkowych informacji wspomagających debugowanie.

### Pola:

- \_httpClient – Instancja klienta HTTP odpowiedzialna za wywołania zewnętrzne.
- \_logger – Moduł logujący zdarzenia i błędy.

## 5. Obsługa błędów

### Scenariusze i strategie:

1. **Błąd sieciowy / timeout**
   - Mechanizm ponawiania żądań (retry) z wykładniczym backoffem.
2. **Błąd walidacji danych wejściowych**
   - Weryfikacja formatu zapytań przed wysłaniem oraz zwracanie błędnego statusu z informacją, które dane są niepoprawne.
3. **Nieprawidłowa konfiguracja parametrów**
   - Walidacja konfiguracji w konstruktorze oraz podczas dynamicznej zmiany ustawień.
4. **Błąd autoryzacji**
   - Sprawdzenie poprawności klucza API i jednoznaczne komunikaty o braku autoryzacji.
5. **Niewłaściwa odpowiedź API**
   - Weryfikacja odpowiedzi względem defaultResponseFormat (np. sprawdzanie czy odpowiedź ma strukturę:
     { "type": "json_schema", "json_schema": { "name": "flashcardResponse", "strict": true, "schema": { "question": "string", "answer": "string" } } }
     ) oraz odpowiednie logowanie i fallback w przypadku niezgodności.

## 6. Kwestie bezpieczeństwa

- **Autoryzacja i uwierzytelnianie:** Użycie bezpiecznego przechowywania klucza API i wdrożenie mechanizmów zapobiegających wyciekowi danych.
- **Walidacja danych:** Zapewnienie, że wszystkie dane wejściowe są walidowane przed wysłaniem zapytań do API.
- **SSL/TLS:** Wykorzystywanie bezpiecznych protokołów komunikacyjnych przy wywołaniach API.
- **Logowanie i monitorowanie:** Ograniczenie logowania danych wrażliwych oraz monitorowanie nieautoryzowanych prób dostępu.
- **Obsługa wyjątków:** Bezpieczne zarządzanie wyjątkami tak, aby nie ujawniać szczegółowych informacji o infrastrukturze.

## 7. Plan wdrożenia krok po kroku

1. **Przygotowanie środowiska**
   - Skonfigurować zmienne środowiskowe (klucz API, adres OpenRouter API, domyślne ustawienia modelu).
   - Utworzyć dedykowany moduł konfiguracji, który umożliwi łatwe modyfikowanie parametrów bez ingerencji w kod.
2. **Implementacja głównych komponentów**
   - Zaimplementować komponent komunikacji API, uwzględniając budowanie żądań oraz obsługę struktury odpowiedzi.
   - Wdrożyć moduł walidacji danych wejściowych oraz budowy zapytania (\_validateRequest, \_buildRequest).
   - Zaimplementować konfigurację modelu z możliwością dynamicznego ustawiania nazwy modelu i parametrów.
3. **Implementacja obsługi błędów**
   - Utworzyć centralny mechanizm logowania błędów (\_logError) oraz wdrożyć retry mechanism przy błędach sieci.
   - Testować scenariusze nieprawidłowych danych i niezgodności odpowiedzi API.
4. **Integracja response_format**
   - Zapewnienie, że komunikaty przesyłane i odbierane z API spełniają ustalony format:
     - Przykład konfiguracji:
       { "type": "json_schema", "json_schema": { "name": "flashcardResponse", "strict": true, "schema": { "question": "string", "answer": "string" } } }
   - Walidacja odpowiedzi przy użyciu JSON Schema.
5. **Integracja komunikatów**
   - Skonfigurować mechanizm ustawiania komunikatu systemowego oraz możliwość zmiany komunikatu użytkownika.
   - Zaimplementować metody setSystemMessage oraz obsługę komunikatów wewnętrznych w ramach zapytań.
