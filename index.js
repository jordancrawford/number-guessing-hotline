const WELCOME_MESSAGE = "Welcome to the number guessing hotline.";
const GUESS_PROMPT = "What is your guess?";
const WRONG_INPUT_MESSAGE = "Huh? I didn't understand. Could you try again?";
const TOO_HIGH_MESSAGE = "You guessed too high!";
const TOO_LOW_MESSAGE = "You guessed too low!";
const WON_MESSAGE = "You're the best! Congrats!";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/" && ["GET", "POST"].includes(request.method)) {
      const randomNumber = Math.floor(Math.random() * 99) + 1;
      const responseXml = [
        "<Response>",
        `<Say>${xmlEscape(WELCOME_MESSAGE)}</Say>`,
        buildGuessPrompt(url.origin, randomNumber),
        "</Response>",
      ].join("");

      return twimlResponse(responseXml);
    }

    if (url.pathname === "/guess" && request.method === "POST") {
      const numberParam = url.searchParams.get("number");
      const formData = await request.formData();
      const guessParam = formData.get("Digits");

      if (!/^\d{1,2}$/.test(numberParam ?? "") || typeof guessParam !== "string") {
        return new Response("Invalid guess request", { status: 400 });
      }

      const randomNumber = Number(numberParam);
      const guess = Number.parseInt(guessParam, 10);
      const responseParts = ["<Response>"];

      console.log("The player guessed:", guess);
      console.log("The actual number is:", randomNumber);

      if (guess === randomNumber) {
        responseParts.push(`<Say>${xmlEscape(WON_MESSAGE)}</Say>`);
      } else {
        if (guess > randomNumber) {
          responseParts.push(`<Say>${xmlEscape(TOO_HIGH_MESSAGE)}</Say>`);
        } else if (guess < randomNumber) {
          responseParts.push(`<Say>${xmlEscape(TOO_LOW_MESSAGE)}</Say>`);
        } else {
          responseParts.push(`<Say>${xmlEscape(WRONG_INPUT_MESSAGE)}</Say>`);
        }

        responseParts.push(buildGuessPrompt(url.origin, randomNumber));
      }

      responseParts.push("</Response>");
      return twimlResponse(responseParts.join(""));
    }

    return new Response("Not found", { status: 404 });
  },
};

function buildGuessPrompt(origin, randomNumber) {
  const actionUrl = new URL("/guess", origin);
  actionUrl.searchParams.set("number", String(randomNumber));
  const musicUrl = new URL("/elevator_music.mp3", origin);

  return [
    `<Gather action="${xmlEscape(actionUrl.href)}" method="POST" timeout="10" numDigits="2">`,
    `<Say>${xmlEscape(GUESS_PROMPT)}</Say>`,
    `<Play>${xmlEscape(musicUrl.href)}</Play>`,
    "</Gather>",
    `<Say>${xmlEscape(WRONG_INPUT_MESSAGE)}</Say>`,
  ].join("");
}

function twimlResponse(xml) {
  return new Response(xml, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
