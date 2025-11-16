import { useState, useCallback } from "react";
import { LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserSafe } from "@/types";

type UserMenuProps = {
  user: UserSafe;
};

export default function UserMenu({ user }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Przekieruj do strony logowania po wylogowaniu
        window.location.href = "/auth/login";
      } else {
        // eslint-disable-next-line no-console
        console.error("[Auth] Logout failed:", response.status);
        alert("Nie udało się wylogować. Spróbuj ponownie.");
        setIsLoggingOut(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Auth] Logout error:", error);
      alert("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
      setIsLoggingOut(false);
    }
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-10 rounded-full" disabled={isLoggingOut}>
          <User className="size-5" />
          <span className="sr-only">Menu użytkownika</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Moje konto</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/generate" className="cursor-pointer">
            Generuj fiszki
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/flashcards" className="cursor-pointer">
            Moje fiszki
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-destructive"
          onSelect={(e) => {
            // Zapobiegaj zamknięciu dropdown podczas wylogowywania
            e.preventDefault();
          }}
        >
          <LogOut className="mr-2 size-4" />
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
