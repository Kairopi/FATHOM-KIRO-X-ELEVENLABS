import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/store';

interface UseVoiceInputReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const setContent = useStore((s) => s.setContent);
  const setSpokenInput = useStore((s) => s.setSpokenInput);
  const user = useStore((s) => s.user);

  const sendAudioForTranscription = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'audio/webm',
      };
      if (user) {
        headers['X-User-Id'] = user.id;
      }

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers,
        body: audioBlob,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Transcription failed' }));
        throw new Error(body.error || 'Transcription failed');
      }

      const data = await res.json();
      const text = data.text?.trim() || '';

      if (text) {
        setContent(text);
        setSpokenInput(text);
      } else {
        toast.error('No speech detected. Please try again.');
      }
    } catch {
      toast.error('Transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [user, setContent, setSpokenInput]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Your browser does not support audio recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        if (audioBlob.size > 0) {
          sendAudioForTranscription(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: unknown) {
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        toast.error('Microphone access required. Please allow microphone permissions.');
      } else {
        toast.error('Could not access microphone. Please check your device settings.');
      }
    }
  }, [sendAudioForTranscription]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  };
}
