export const GREETING_MESSAGES = ["Wie kann ich behilflich sein?", "Dann starten wir mal.."];

export function getRandomGreeting(): string {
  return GREETING_MESSAGES[
    Math.floor(Math.random() * GREETING_MESSAGES.length)
  ] as string;
}
