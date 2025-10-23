This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Video Upscaler

This project implements AI-powered video frame interpolation using Google's Gemini 2.5 Flash Image Preview model through OpenRouter's chat completions API.

### Setup

1. **Environment Variables**: Create a `.env.local` file with your OpenRouter API key:

   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

2. **Get OpenRouter API Key**: Sign up at [OpenRouter](https://openrouter.ai/) and get your API key.

### Usage

The `imageGen` function in `app/actions/imageGen.ts` generates intermediate frames between two consecutive video frames:

```typescript
import { imageGen } from "./app/actions/imageGen";

// Convert your frames to base64 strings
const frame1Base64 = "base64_encoded_frame_1";
const frame2Base64 = "base64_encoded_frame_2";

try {
  const imageUrl = await imageGen(frame1Base64, frame2Base64);
  console.log("Generated frame URL:", imageUrl);
} catch (error) {
  console.error("Error:", error instanceof Error ? error.message : "Unknown error");
}
```

The function focuses on maintaining consistency in:

- Motion and object positioning
- Lighting and shadows
- Color tones and saturation
- Background elements
- Temporal flow between frames

### Technical Details

This implementation uses OpenRouter's chat completions API through the OpenAI SDK with vision capabilities, allowing the model to:

- Analyze both input frames in separate, clearly labeled messages
- Generate intermediate frames based on explicit chronological context
- Maintain consistency through structured frame-by-frame processing

The implementation uses a multi-message approach:

1. **System message**: Sets the context as a video frame interpolation expert
2. **Frame 1 message**: Clearly labels the previous frame with explicit context
3. **Frame 2 message**: Clearly labels the next frame with explicit context

This ensures the LLM understands the chronological relationship and generates consistent intermediate frames. The Gemini 2.5 Flash Image Preview model processes the frames sequentially with clear temporal context.

### Error Handling

The function throws errors that you can catch and handle in your calling code:

```typescript
try {
  const imageUrl = await imageGen(frame1Base64, frame2Base64);
  // Use the generated image URL
} catch (error) {
  if (error instanceof Error) {
    console.error("Image generation failed:", error.message);
    // Handle specific error types
    if (error.message.includes("API key")) {
      // Handle missing API key
    } else if (error.message.includes("network")) {
      // Handle network issues
    } else if (error.message.includes("Request failed")) {
      // Handle API errors
    }
  }
}
```

**Error types thrown:**

- Missing API key configuration
- Invalid input parameters
- API authentication errors
- Network connectivity issues
- Rate limiting
- Invalid API responses
- Generic API errors

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
