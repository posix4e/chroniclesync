import React, { useState } from 'react';
import { EncryptedSyncService } from '../services/EncryptedSyncService';

interface SeedPhraseManagerProps {
  onInitialized: () => void;
}

export const SeedPhraseManager: React.FC<SeedPhraseManagerProps> = ({ onInitialized }) => {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [mode, setMode] = useState<'input' | 'generate'>('input');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateNew = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const syncService = await EncryptedSyncService.getInstance();
      const newSeed = await syncService.generateNewSeed();
      setSeedPhrase(newSeed);
      setMode('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate seed phrase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const syncService = await EncryptedSyncService.getInstance();
      await syncService.initializeWithSeed(seedPhrase);
      onInitialized();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize with seed phrase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="seed-phrase-manager">
      <h2>Initialize Encryption</h2>
      
      <div className="mode-selector">
        <button
          onClick={() => setMode('input')}
          className={mode === 'input' ? 'active' : ''}
          disabled={isLoading}
        >
          Enter Existing Seed
        </button>
        <button
          onClick={handleGenerateNew}
          className={mode === 'generate' ? 'active' : ''}
          disabled={isLoading}
        >
          Generate New Seed
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {mode === 'generate' && (
          <div className="seed-display">
            <p>Your new seed phrase is:</p>
            <div className="seed-words">
              {seedPhrase.split(' ').map((word, i) => (
                <span key={i} className="seed-word">{word}</span>
              ))}
            </div>
            <p className="warning">
              ⚠️ Save this phrase securely! You&apos;ll need it to recover your data.
            </p>
          </div>
        )}

        <div className="seed-input">
          <label htmlFor="seedPhrase">
            {mode === 'input' ? 'Enter your 12-word seed phrase:' : 'Confirm your seed phrase:'}
          </label>
          <textarea
            id="seedPhrase"
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            placeholder="Enter 12 words separated by spaces"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!seedPhrase.trim() || isLoading}
        >
          {isLoading ? 'Initializing...' : 'Initialize Encryption'}
        </button>
      </form>

      <style>{`
        .seed-phrase-manager {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }

        .mode-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .mode-selector button {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          background: #fff;
          cursor: pointer;
        }

        .mode-selector button.active {
          background: #007bff;
          color: white;
          border-color: #0056b3;
        }

        .error-message {
          color: #dc3545;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #dc3545;
          border-radius: 4px;
        }

        .seed-display {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .seed-words {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 10px 0;
        }

        .seed-word {
          background: #e9ecef;
          padding: 5px 10px;
          border-radius: 4px;
          font-family: monospace;
        }

        .warning {
          color: #dc3545;
          margin-top: 10px;
        }

        .seed-input {
          margin-bottom: 20px;
        }

        .seed-input label {
          display: block;
          margin-bottom: 8px;
        }

        .seed-input textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: monospace;
        }

        button[type="submit"] {
          width: 100%;
          padding: 12px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button[type="submit"]:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};