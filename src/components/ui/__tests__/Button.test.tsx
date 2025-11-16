import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

/**
 * Testy jednostkowe dla komponentu Button
 * Wykorzystują Vitest + Testing Library
 */
describe("Button", () => {
  it("powinien renderować przycisk z tekstem", () => {
    render(<Button>Kliknij mnie</Button>);

    const button = screen.getByRole("button", { name: /kliknij mnie/i });
    expect(button).toBeInTheDocument();
  });

  it("powinien wywoływać onClick gdy zostanie kliknięty", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Kliknij</Button>);

    const button = screen.getByRole("button", { name: /kliknij/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("powinien być wyłączony gdy disabled=true", () => {
    render(<Button disabled>Wyłączony</Button>);

    const button = screen.getByRole("button", { name: /wyłączony/i });
    expect(button).toBeDisabled();
  });

  it("powinien renderować różne warianty", () => {
    const { container } = render(
      <>
        <Button variant="default">Domyślny</Button>
        <Button variant="destructive">Destrukcyjny</Button>
        <Button variant="outline">Obrysowany</Button>
        <Button variant="ghost">Duch</Button>
      </>
    );

    expect(container).toBeInTheDocument();
  });

  it("powinien renderować różne rozmiary", () => {
    const { container } = render(
      <>
        <Button size="default">Domyślny</Button>
        <Button size="sm">Mały</Button>
        <Button size="lg">Duży</Button>
        <Button size="icon">Ikona</Button>
      </>
    );

    expect(container).toBeInTheDocument();
  });

  it("powinien przyjmować className z zewnątrz", () => {
    const { container } = render(<Button className="custom-class">Przycisk</Button>);

    const button = container.querySelector(".custom-class");
    expect(button).toBeInTheDocument();
  });

  it("powinien renderować jako child (asChild)", () => {
    render(
      <Button asChild>
        <a href="/test">Link jako przycisk</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: /link jako przycisk/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });
});
