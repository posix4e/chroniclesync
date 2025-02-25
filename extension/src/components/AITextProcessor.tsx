import React, { useEffect, useState } from 'react';
import { modelHandler } from '../utils/modelHandler';

interface AITextProcessorProps {
  text: string;
  mode: 'translate' | 'summarize';
  targetLang?: string;
}

export const AITextProcessor: React.FC<AITextProcessorProps> = ({ text, mode, targetLang = 'fra_Latn' }) => {
  const [processedText, setProcessedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processText = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize models if not already done
        await modelHandler.initialize();

        // Process text based on mode
        const result = mode === 'translate' 
          ? await modelHandler.translate(text, targetLang)
          : await modelHandler.summarize(text);

        setProcessedText(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (text) {
      processText();
    }
  }, [text, mode, targetLang]);

  if (isLoading) {
    return <div>Processing...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h3>{mode === 'translate' ? 'Translation' : 'Summary'}</h3>
      <p>{processedText}</p>
    </div>
  );
};