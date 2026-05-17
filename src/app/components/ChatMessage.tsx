import { ExternalLink, Copy, Check } from "lucide-react";
import { marked } from "marked";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message, Reference } from "../types";

marked.setOptions({ gfm: true, breaks: true });

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 mb-3 space-y-2 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-6 mb-3 space-y-2 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em>{children}</em>,
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-semibold mb-3">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold mb-2">{children}</h3>
  ),
};

interface ChatMessageProps {
  message: Message;
}

/** References block in original plain-text format (not markdown). */
function buildReferencesPlainText(references: Reference[]): string {
  let text = "\n\n\nReferences:\n";
  references.forEach((ref, index) => {
    text += `\n${index + 1}. ${ref.fileName}${ref.pageNo ? ` (Page ${ref.pageNo})` : ""}\n   ${ref.url}`;
    if (ref.f70) text += `\n   "${ref.f70}..."`;
  });
  return text;
}

function referencesToHtml(references: Reference[]): string {
  const lines = references.map((ref, index) => {
    let block = `${index + 1}. ${escapeHtml(ref.fileName)}${ref.pageNo ? ` (Page ${escapeHtml(ref.pageNo)})` : ""}<br>&nbsp;&nbsp;&nbsp;${escapeHtml(ref.url)}`;
    if (ref.f70) block += `<br>&nbsp;&nbsp;&nbsp;"${escapeHtml(ref.f70)}..."`;
    return `<p style="margin: 0 0 8px 0;">${block}</p>`;
  });
  return `<p style="margin: 16px 0 8px 0;"><strong>References:</strong></p>${lines.join("")}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToPlainText(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^- /gm, "• ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function wrapHtmlForClipboard(fragment: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><!--StartFragment-->${fragment}<!--EndFragment--></body></html>`;
}

async function copyFormattedContent(message: Message): Promise<void> {
  const answerMarkdown = message.content.trim();
  const refsPlain =
    message.references && message.references.length > 0
      ? buildReferencesPlainText(message.references)
      : "";

  const htmlBody = await marked.parse(answerMarkdown);
  const refsHtml =
    message.references && message.references.length > 0
      ? referencesToHtml(message.references)
      : "";

  const html = wrapHtmlForClipboard(
    `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5;">${htmlBody}${refsHtml}</div>`
  );
  const plain = markdownToPlainText(answerMarkdown) + refsPlain;

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      }),
    ]);
    return;
  }

  // Fallback: inject HTML via copy event (works in more browsers than writeText alone)
  const onCopy = (e: ClipboardEvent) => {
    e.clipboardData?.setData("text/html", html);
    e.clipboardData?.setData("text/plain", plain);
    e.preventDefault();
  };
  document.addEventListener("copy", onCopy);
  const ok = document.execCommand("copy");
  document.removeEventListener("copy", onCopy);
  if (!ok) await navigator.clipboard.writeText(plain);
}

function ReferenceList({ references }: { references: Reference[] }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold mb-3 text-black">References:</p>
      <div className="space-y-3">
        {references.map((ref, index) => (
          <div key={index} className="p-3 border border-gray-300 rounded-lg bg-white">
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-start gap-1 group cursor-pointer text-sm"
            >
              <span className="flex-1">
                {index + 1}. {ref.fileName}, p. {ref.pageNo ? `${ref.pageNo}` : ""}
              </span>
              <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 opacity-80 group-hover:opacity-100" />
            </a>
            {ref.f70 && (
              <p className="mt-2 pl-3 text-sm text-gray-700">
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

  const handleCopy = async () => {
    try {
      await copyFormattedContent(message);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy formatted text:", err);
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
        {message.type === "bot" ? (
          <div className="prose-sm max-w-none text-black [&>*:first-child]:mt-0">
            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

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
            title={isCopied ? "Copied!" : "Copy formatted text"}
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
