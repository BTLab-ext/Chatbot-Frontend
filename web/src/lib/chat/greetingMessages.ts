// export const GREETING_MESSAGES = ["How can I help?", "Let's get started."];
export const GREETING_MESSAGES = ["Willkommen bei chat.BAI!", "Wie kann chat.BAI Ihnen helfen?"];

export function getRandomGreeting(): string {
  return GREETING_MESSAGES[
    Math.floor(Math.random() * GREETING_MESSAGES.length)
  ] as string;
}
