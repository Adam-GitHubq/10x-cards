```mermaid
sequenceDiagram
autonumber
participant Browser as "Przeglądarka"
participant MW as "Middleware"
participant API as "Astro API"
participant AUTH as "Supabase Auth"

Note over Browser,MW: Wejście na stronę chronioną
Browser->>MW: Żądanie strony
activate MW
MW->>AUTH: Sprawdź sesję (ciasteczka)
alt Sesja ważna
  AUTH-->>MW: OK
  MW-->>Browser: Render (200)
  deactivate MW
else Sesja wygasła
  MW->>AUTH: Odśwież sesję (refresh)
  alt Refresh OK
    AUTH-->>MW: Nowa sesja
    MW-->>Browser: Render (200)
    deactivate MW
  else Refresh BŁĄD
    AUTH-->>MW: Brak sesji
    MW-->>Browser: Redirect do logowania
    deactivate MW
  end
end

Note over Browser,API: Logowanie
Browser->>API: POST login (email, hasło)
activate API
API->>AUTH: signInWithPassword
alt Sukces
  AUTH-->>API: Sesja + cookies
  API-->>Browser: 200 + set-cookie
  deactivate API
  Browser->>MW: GET next/generator
  activate MW
  MW->>AUTH: Weryfikacja sesji
  AUTH-->>MW: OK
  MW-->>Browser: 200
  deactivate MW
else Błąd
  AUTH-->>API: invalid_credentials
  API-->>Browser: 401 + komunikat
  deactivate API
end

Note over Browser,API: Rejestracja
Browser->>API: POST signup
activate API
API->>AUTH: signUp (email, hasło, redirectTo)
alt Weryfikacja WYŁ
  AUTH-->>API: Sesja aktywna
  API-->>Browser: 200 + set-cookie
  deactivate API
  Browser->>MW: GET generator
  activate MW
  MW->>AUTH: Weryfikacja sesji
  AUTH-->>MW: OK
  MW-->>Browser: 200
  deactivate MW
else Weryfikacja WŁ
  AUTH-->>API: Mail z linkiem
  API-->>Browser: 200 info
  deactivate API
  Browser->>AUTH: Klik link z e‑maila
  AUTH-->>Browser: Redirect do strony potwierdzenia
  Browser->>API: POST reset complete (nowe hasło)
  activate API
  API->>AUTH: updateUser (hasło)
  AUTH-->>API: OK
  API-->>Browser: 200 + redirect do logowania
  deactivate API
end

Note over Browser,API: Reset hasła
Browser->>API: POST reset request (email)
activate API
API->>AUTH: resetPasswordForEmail
AUTH-->>API: OK
API-->>Browser: 200 (neutralny)
deactivate API
Browser->>AUTH: Klik link resetu
AUTH-->>Browser: Redirect do strony reset
Browser->>API: POST reset complete
activate API
API->>AUTH: updateUser (hasło)
AUTH-->>API: OK
API-->>Browser: 200 + redirect do logowania
deactivate API

Note over Browser,API: Wylogowanie
Browser->>API: POST logout
activate API
API->>AUTH: signOut
AUTH-->>API: OK
API-->>Browser: 204
deactivate API
Browser->>MW: GET strona
activate MW
MW-->>Browser: Redirect do logowania
deactivate MW

Note over Browser,API: Usunięcie konta
Browser->>API: POST account delete (hasło)
activate API
API->>AUTH: Re‑auth (signInWithPassword)
alt Hasło OK
  AUTH-->>API: OK
  API->>AUTH: Admin usuń użytkownika
  AUTH-->>API: 204
  API-->>Browser: 204 + signOut
  deactivate API
else Błąd hasła
  AUTH-->>API: invalid_credentials
  API-->>Browser: 401
  deactivate API
end
```
