"use server";

import OpenAI from "openai";

async function imageGen(frame1: string, frame2: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.");
  }

  if (!frame1 || !frame2) {
    throw new Error("Both frame1 and frame2 are required.");
  }

  const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "X-Title": "Video Frame Interpolator",
    },
  });

  const response = await openrouter.chat.completions.create({
    model: "google/gemini-2.5-flash-image-preview",
    messages: [
      {
        role: "system",
        content:
          "You are a video frame interpolation expert. Your task is to generate intermediate frames between two consecutive video frames, focusing on smooth transitions and consistency.",
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: "This is FRAME 1 - the PREVIOUS frame in the video sequence. This is the frame that comes BEFORE the frame I want you to generate.",
          },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame1}`,
            },
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: "This is FRAME 2 - the NEXT frame in the video sequence. This is the frame that comes AFTER the frame I want you to generate. Generate an intermediate frame that smoothly transitions from FRAME 1 to FRAME 2, maintaining visual consistency in motion, lighting, colors, and object positioning.",
          },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame2}`,
            },
          },
        ],
      },
    ],
  });

  const generatedImageUrl = extractImageUrl(response);

  if (!generatedImageUrl) {
    throw new Error("No image generated from the API response.");
  }

  return generatedImageUrl;
}

function extractImageUrl(response: OpenAI.Chat.Completions.ChatCompletion): string | null {
  const choice = response.choices?.[0];
  if (!choice?.message?.content) {
    return null;
  }

  const content = choice.message.content;

  // Handle array content (multiple parts) - this is what we expect for image generation
  if (Array.isArray(content)) {
    for (const segment of content) {
      // Check for image_url in segment
      if (segment.type === "image_url" && "image_url" in segment && segment.image_url?.url) {
        return segment.image_url.url;
      }

      // Check for base64 image in text
      if (segment.type === "text" && "text" in segment && segment.text?.includes("data:image")) {
        const match = segment.text.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
        if (match && match[0]) {
          return match[0];
        }
      }
    }
  }

  // Handle string content (single response) - this is likely what we'll get without response_format
  if (typeof content === "string") {
    // Look for base64 image data in the text response
    const match = content.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
    if (match && match[0]) {
      return match[0];
    }

    // Also check for regular URLs
    const urlMatch = content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i);
    if (urlMatch && urlMatch[0]) {
      return urlMatch[0];
    }
  }

  return null;
}

export { imageGen };
