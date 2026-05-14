import { useState, useCallback, useRef } from 'react';
import type { Language } from '@shared/types';
import { apiUpload } from '../lib/api';

const LANG_MAP: Record<Language, string> = {
  it: 'it', en: 'en', fr: 'fr', ar: 'ar',
};

export function useSpeech(language: Language = 'it') {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onResultRef = useRef<((text: string) => void) | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined';

  const startListening = useCallback(
    (onResult: (text: string) => void) => {
      if (!isSupported || isListening) return;
      onResultRef.current = onResult;
      chunksRef.current = [];

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Prefer webm/opus → ogg/opus → wav fallback
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
              ? 'audio/ogg;codecs=opus'
              : 'audio/webm';

          const recorder = new MediaRecorder(stream, { mimeType });

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
            // Stop all tracks so the browser releases the mic
            stream.getTracks().forEach((t) => t.stop());

            const blob = new Blob(chunksRef.current, { type: mimeType });
            if (blob.size === 0) return;

            setIsTranscribing(true);
            try {
              const formData = new FormData();
              const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
              formData.append('audio', blob, `recording.${ext}`);

              const lang = LANG_MAP[language];
              const res = await apiUpload<{ transcript: string }>(
                `/api/transcribe?language=${lang}`,
                formData,
              );

              if (res.data?.transcript) {
                onResultRef.current?.(res.data.transcript);
              } else if (res.error) {
                console.error('[useSpeech] Transcription error:', res.error);
              }
            } catch (err) {
              console.error('[useSpeech] Transcription failed:', err);
            } finally {
              setIsTranscribing(false);
            }
          };

          mediaRecorderRef.current = recorder;
          recorder.start(1000); // collect chunks every 1s
          setIsListening(true);
        })
        .catch((err) => {
          console.error('[useSpeech] Mic access denied:', err);
        });
    },
    [language, isSupported, isListening],
  );

  const stopListening = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsListening(false);
  }, []);

  return {
    /** True while the microphone is actively recording */
    isListening,
    /** True while waiting for Deepgram to return the transcript */
    isTranscribing,
    /** False if the browser doesn't support MediaRecorder or getUserMedia */
    isSupported,
    startListening,
    stopListening,
  };
}
