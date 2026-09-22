/** "Nombre (Congregación)"; omits the parentheses when the congregation is empty. */
export function formatSpeaker(
  name: string | null | undefined,
  congregation: string | null | undefined,
): string {
  const speaker = name?.trim() ?? ""
  const origin = congregation?.trim() ?? ""
  if (!origin) return speaker
  return speaker ? `${speaker} (${origin})` : `(${origin})`
}
