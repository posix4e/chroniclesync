# Local Models Directory

This directory is used to store local ML models for the summarization feature.

The SummarizationService will look for models in this directory before attempting to download them from Hugging Face.

## Supported Models

- `Xenova/distilbart-cnn-6-6-fp16` (tiny model)
- `Xenova/distilbart-cnn-6-6` (small model)
- `Xenova/distilbart-xsum-12-3` (fallback model)

## Manual Installation

If you're experiencing issues with model downloading, you can manually download the models from Hugging Face and place them in this directory.

Visit: https://huggingface.co/Xenova/distilbart-cnn-6-6-fp16

## Fallback Behavior

If no models can be loaded, the extension will fall back to a simple text-based summarization approach that extracts the first few sentences from the content.