function parseCorrectAnswer(raw: string | null | undefined): string[] {
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

export default parseCorrectAnswer