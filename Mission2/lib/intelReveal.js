/**
 * Full dossier for every difficulty — keeps the game simple to learn.
 * (Difficulty still affects suspect behavior in the AI prompt, not how much you read beforehand.)
 */
export function getIntelDisplay(suspect) {
  const facts = Array.isArray(suspect?.known_facts) ? suspect.known_facts : [];
  return {
    subjectName: suspect?.name ?? "—",
    age: String(suspect?.age ?? "—"),
    occupation: suspect?.occupation ?? "—",
    appearance: suspect?.appearance ?? "—",
    facts,
    banner: null,
  };
}
