from transformers import AutoTokenizer, AutoModelForSeq2SeqGeneration
import os
import shutil

model_name = "Xenova/bart-small-cnn"
output_dir = "models/bart-small-cnn"

# Download and save tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.save_pretrained(output_dir)

# Download and save model
model = AutoModelForSeq2SeqGeneration.from_pretrained(model_name)
model.save_pretrained(output_dir)

print("Model files downloaded successfully!")