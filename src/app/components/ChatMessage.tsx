import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Message, Reference } from "../types";

interface ChatMessageProps {
  message: Message;
}

function buildCopyText(message: Message): string {
  let text = message.content;

  if (message.references && message.references.length > 0) {
    text += "\n\nReferences:\n";
    message.references.forEach((ref, index) => {
      text += `\n${index + 1}. ${ref.fileName}${ref.pageNo ? ` (Page ${ref.pageNo})` : ""}\n   ${ref.url}`;
      if (ref.f70) text += `\n   "${ref.f70}..."`;
    });
  }

  return text;
}

function ReferenceList({ references }: { references: Reference[] }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-300">
      <p className="font-semibold mb-2 text-black">References:</p>
      <div className="space-y-3">
        {references.map((ref, index) => (
          <div key={index}>
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-start gap-1 group"
            >
              <span className="flex-1">
                {index + 1}.{ref.pageNo ? ` Page ${ref.pageNo} —` : ""}{" "}
                <em>{ref.fileName}</em>
              </span>
              <ExternalLink className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600 opacity-80 group-hover:opacity-100" />
            </a>
            {ref.f70 && (
              <p className="mt-2 pl-3 italic text-black border-l-2 border-gray-300">
                "{ref.f70}..."
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    try {
      const text = buildCopyText(message);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div
      className={`flex ${
        message.type === "user" ? "justify-end" : "justify-start"
      } mb-4`}
    >
      <div
        className={`relative ${
          message.type === "user"
            ? "max-w-[80%] rounded-lg bg-blue-600 text-white px-4 py-3"
            : "w-full bg-gray-100 text-black px-4 py-3 pr-14"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {message.references && message.references.length > 0 && (
          <ReferenceList references={message.references} />
        )}

        <p className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        {message.type === "bot" && (
          <button
            className="absolute top-2 right-2 text-blue-600 hover:text-blue-700"
            onClick={handleCopy}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
          >
            {isCopied ? (
              <Check className="w-6 h-6" />
            ) : (
              <Copy className="w-6 h-6" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
