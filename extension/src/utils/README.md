# Client-side AI Features

This extension includes client-side AI capabilities for text translation and summarization using Transformers.js. These features run entirely in the browser without requiring a server.

## Features

- **Translation**: Translate text between languages using a quantized NLLB model
- **Summarization**: Generate concise summaries of long texts using a quantized DistilBART model

## Usage

```tsx
import { AITextProcessor } from '../components/AITextProcessor';

// For translation
<AITextProcessor 
  text="Hello, how are you?"
  mode="translate"
  targetLang="fra_Latn" // French
/>

// For summarization
<AITextProcessor 
  text="Long text to summarize..."
  mode="summarize"
/>
```

## Technical Details

- Uses Transformers.js for client-side inference
- Employs quantized models for better performance
- Models are loaded on-demand and cached
- Supports all languages available in NLLB-200

## Model Information

- Translation: `Xenova/nllb-200-distilled-600M-int8`
  - Quantized 8-bit model
  - Supports 200+ languages
  - Efficient size and performance

- Summarization: `Xenova/distilbart-cnn-6-6-int8`
  - Quantized 8-bit model
  - Optimized for news articles
  - Generates concise summaries