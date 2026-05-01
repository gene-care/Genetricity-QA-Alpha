import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const MAX_RECORDING_SECONDS = 5 * 60; // 5 minutes

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function ChatInput({ onSendMessage, disabled, value, onChange }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync with external value prop
  useEffect(() => {
    if (value !== undefined) setInput(value);
  }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleInputChange = (text: string) => {
    setInput(text);
    onChange?.(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) onSendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // ── Recording ────────────────────────────────────────────────────────────────

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setRecordingSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
        await transcribeAudio(new Blob(chunksRef.current, { type: mimeType }), mimeType);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      // Tick every second; auto-stop at 5 minutes
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access was denied. Please allow microphone access and try again.");
    }
  };

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const audio = await blobToBase64(blob);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio, mimeType }),
      });
      const data = await res.json();
      if (data.text) {
        const existing = textareaRef.current?.value ?? "";
        handleInputChange(existing ? `${existing} ${data.text}` : data.text);
      }
    } catch {
      console.error("Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  // ── Render ───────────────────────────────────────────────────────────────────

  const micBusy = isRecording || isTranscribing;

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4 h-full flex flex-col">
      <div className="flex items-start gap-2 flex-1">
        <div className="flex-1 relative flex flex-col h-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            disabled={disabled || micBusy}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-full min-h-[120px] disabled:opacity-60"
            rows={1}
          />

          {/* Recording / transcribing status overlay */}
          {(isRecording || isTranscribing) && (
            <div className="absolute bottom-3 left-4 flex items-center gap-2 text-sm">
              {isRecording ? (
                <>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-red-600 font-medium">
                    {formatTime(recordingSeconds)} / {formatTime(MAX_RECORDING_SECONDS)}
                  </span>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-blue-600">Transcribing...</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Mic button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={disabled || isTranscribing}
            className={`p-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || disabled || micBusy}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2 mb-2">
        Press Enter to send, Shift + Enter for new line
        {isRecording && (
          <span className="ml-3 text-red-500 font-medium">
            Recording stops automatically at 5:00
          </span>
        )}
      </p>
    </form>
  );
}
