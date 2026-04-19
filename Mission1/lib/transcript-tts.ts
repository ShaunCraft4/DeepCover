/** Strip bracket timestamps and join transcript lines for TTS (shared server + client). */
export function linesToTtsText(lines: string[]): string {
  return lines
    .map((line) => line.replace(/^\s*\[[^\]]*]\s*/, "").trim())
    .filter(Boolean)
    .join(" ");
}
