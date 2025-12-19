export function parseCorrectAnswer(raw: string | null | undefined): string[] {
  if (!raw) return []
  if (raw.startsWith("{") && raw.endsWith("}")) {
    return raw
      .slice(1, -1) // remove {}
      .split(",")
      .map((s) => s.replace(/"/g, "").trim())
      .filter(Boolean)
  }
  return [raw]
}

export function parseCorrectAnswer0(raw: string | null | undefined) {
  if (!raw) return [];

  // Remove outer braces if they exist
  let trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    trimmed = trimmed.slice(1, -1);
  }

  // Split by '","' that separates the stringified objects
  const parts = trimmed.split(/","/);

  // Remove leading/trailing quotes and unescape inner quotes
  return parts.map((s) => {
    const cleaned = s.replace(/^"|"$/g, '').replace(/\\"/g, '"');
    return JSON.parse(cleaned);
  });
}

