import { useMemo } from "react";

const MIN_LENGTH = 1000;
const MAX_LENGTH = 10000;

export function useCharCounter(value: string) {
  const trimmedLength = useMemo(() => value.trim().length, [value]);

  const isTooShort = trimmedLength > 0 && trimmedLength < MIN_LENGTH;
  const isTooLong = trimmedLength > MAX_LENGTH;
  const isEmpty = trimmedLength === 0;
  const isWithinRange = !isEmpty && !isTooShort && !isTooLong;

  return {
    trimmedLength,
    isTooShort,
    isTooLong,
    isEmpty,
    isWithinRange,
    min: MIN_LENGTH,
    max: MAX_LENGTH,
  };
}
