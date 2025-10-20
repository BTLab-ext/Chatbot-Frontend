// export const GREETING_MESSAGES = ["How can I help?", "Let's get started."];
export const GREETING_MESSAGES = ["Wie kann ich helfen?", "Lass uns anfangen."];

export function getRandomGreeting(): string {
  return GREETING_MESSAGES[
    Math.floor(Math.random() * GREETING_MESSAGES.length)
  ] as string;
}
