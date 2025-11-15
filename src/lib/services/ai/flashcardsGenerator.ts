import type { FlashcardProposalDto } from "../../../types";

type GenerateFlashcardProposalsParams = {
  sourceText: string;
};

export async function generateFlashcardProposals({
  sourceText,
}: GenerateFlashcardProposalsParams): Promise<FlashcardProposalDto[]> {
  if (typeof sourceText !== "string" || sourceText.trim().length === 0) {
    throw new Error("sourceText must be a non-empty string");
  }

  const sentences = sourceText
    .split(/[\r\n]+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => paragraph.split(/(?<=[.?!])\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [];
  }

  const proposals = sentences.slice(0, 5).map<FlashcardProposalDto>((sentence, index) => {
    const question = `O czym mówi zdanie nr ${index + 1}?`;
    return {
      front: question,
      back: sentence,
      source: "ai-full",
    };
  });

  return proposals;
}
