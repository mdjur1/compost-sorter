// Talks to the Gemini API. Nothing here ever stores or hard-codes a key:
// the key is passed in from the app, which gets it from the user.

// Models to try in order. If one is busy or unavailable, we move on to the next.
const MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const apiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const PROMPT = `You are a waste-sorting assistant. Look at the item in the photo and decide
whether it belongs in COMPOST, RECYCLE, or TRASH.

Reply with JSON only, in exactly this shape:
{
  "item": "short name of the item",
  "category": "compost" | "recycle" | "trash",
  "reason": "one sentence explaining why",
  "tip": "one short practical tip (e.g. rinse it, remove the lid), or an empty string"
}

If the photo does not clearly show an item, use category "trash" and say so in "reason".
Rules vary by city, so go with the most common guidelines in the US.`;

// Turns an image File into base64 text, which is what the API expects.
// Shrinks the photo to at most 1024px and converts it to base64 text,
// which is what the API expects. Smaller uploads mean faster answers.
function imageToBase64(file, maxSize = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      // Keep only the part after the comma: "data:image/jpeg;base64,AAAA..."
      resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

export async function classifyImage(file, apiKey) {
  if (!apiKey) {
    throw new Error("Add your Gemini API key first, or turn on demo mode.");
  }

  const base64 = await imageToBase64(file);

  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { inline_data: { mime_type: "image/jpeg", data: base64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  });

  let response;
  for (const model of MODELS) {
    response = await fetch(apiUrl(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(30000),
      body,
    });
    // 503 = busy, 429 = rate limited, 404 = model not available to this key.
    // In those cases, try the next model. Anything else, stop and handle it below.
    if (![503, 429, 404].includes(response.status)) break;
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new Error("Gemini rejected the request. Check that your API key is correct.");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Wait a minute and try again.");
    }
    if (response.status === 503) {
      throw new Error("Gemini is busy right now. Try again in a minute.");
    }
    throw new Error(`Gemini request failed (error ${response.status}).`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no answer. Try a clearer photo.");
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("Could not understand Gemini's answer. Try again.");
  }

  // Make sure the category is one we know how to display
  const allowed = ["compost", "recycle", "trash"];
  if (!allowed.includes(result.category)) {
    result.category = "trash";
  }
  return result;
}

// Used when there is no API key, so anyone can try the app.
const DEMO_RESULTS = [
  { item: "Banana peel", category: "compost", reason: "Fruit scraps break down into soil.", tip: "Remove any sticker first." },
  { item: "Plastic water bottle", category: "recycle", reason: "Clean plastic bottles are widely accepted.", tip: "Empty it and put the cap back on." },
  { item: "Chip bag", category: "trash", reason: "Mixed-material wrappers can't be recycled.", tip: "" },
];

export async function demoClassify() {
  await new Promise((resolve) => setTimeout(resolve, 800)); // fake loading time
  return DEMO_RESULTS[Math.floor(Math.random() * DEMO_RESULTS.length)];
}