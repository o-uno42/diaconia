import { useState, useCallback, useRef } from 'react';
import type { Language } from '@shared/types';

const LANG_MAP: Record<Language, string> = {
  it: 'it-IT', en: 'en-US', fr: 'fr-FR', ar: 'ar-SA',
};

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

export function useSpeech(language: Language = 'it') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!isSupported) return;
    const recognition = createRecognition();
    if (!recognition) return;

    recognition.lang = LANG_MAP[language];
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[Object.keys(results).length - 1];
      const text = lastResult?.[0]?.transcript ?? '';
      setTranscript((prev) => prev + ' ' + text);
      onResult(text);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, [language, isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, isSupported, startListening, stopListening };
}

function createRecognition() {
  const W = window as unknown as Record<string, unknown>;
  const SpeechRecognition = W['SpeechRecognition'] ?? W['webkitSpeechRecognition'];
  if (!SpeechRecognition) return null;
  return new (SpeechRecognition as new () => {
    lang: string; continuous: boolean; interimResults: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void; stop: () => void;
  })();
}
