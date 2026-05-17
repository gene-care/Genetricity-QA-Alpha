import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { DisclaimerNotice } from "./components/DisclaimerNotice";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { CommonQuestions } from "./components/CommonQuestions";
import { sendChat, fetchQuestions, fetchPresetAnswer } from "./services/api";
import type { Message, QuestionItem } from "./types";
import logo from "../assets/logo.png";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [suggestedQuestions] = useState<string[]>([
    "What is the cancer risk with BRCA mutations?",
    "What screening is recommended for BRCA carriers?",
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuestions()
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, []);

  const handleSendMessage = async (content: string) => {
    setMessages([]);
    setCurrentQuestion(content);
    const userMessage: Message = { id: Date.now().toString(), type: "user", content, timestamp: new Date() };
    setMessages([userMessage]);
    setIsTyping(true);
    try {
      const result = await sendChat(content);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: "bot", content: result.answer, references: result.references, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: "bot", content: "Sorry, something went wrong. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePresetQuestion = async (question: string) => {
    setMessages([]);
    setCurrentQuestion(question);
    const userMessage: Message = { id: Date.now().toString(), type: "user", content: question, timestamp: new Date() };
    setMessages([userMessage]);
    setIsTyping(true);
    try {
      const result = await fetchPresetAnswer(question);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: "bot", content: result.answer, references: result.references, timestamp: new Date() }]);
    } catch {
      try {
        const result = await sendChat(question);
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: "bot", content: result.answer, references: result.references, timestamp: new Date() }]);
      } catch {
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: "bot", content: "Sorry, something went wrong. Please try again.", timestamp: new Date() }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (followUpQuestion.trim()) {
      await handleSendMessage(followUpQuestion.trim());
      setFollowUpQuestion("");
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setCurrentQuestion("");
    setFollowUpQuestion("");
  };

  const hasResponse = messages.some((m) => m.type === "bot");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <img src={logo} alt="Genetricity" className="h-10" />
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: hasResponse ? 0 : "4rem" }}>
        <div className="flex-1 overflow-hidden max-w-4xl w-full mx-auto px-6 pt-4 flex gap-4">

          {/* LEFT: disclaimer + input + messages */}
          <div className="flex-[2] flex flex-col overflow-hidden">
            <div className="flex flex-col gap-4 flex-shrink-0">
              <DisclaimerNotice />
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isTyping}
                value={currentQuestion}
                onChange={setCurrentQuestion}
                showExportButtons={hasResponse}
              />
            </div>

            {/* Messages flow directly below input */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2">
              {messages.map(
                (message) =>
                  message.type === "bot" && (
                    <ChatMessage key={message.id} message={message} />
                  )
              )}

              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* RIGHT: questions panel */}
          <div className="flex-[1] overflow-hidden">
            <CommonQuestions
              questions={questions}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectQuestion={(q) => handlePresetQuestion(q)}
            />
          </div>

        </div>
      </div>

      
      {/* Bottom bar: follow-up when response exists
      {hasResponse && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <form onSubmit={handleFollowUpSubmit}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={isTyping || !followUpQuestion.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Send
                </button>
              </div>
            </form>

            <div className="mt-3">
              {suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border border-gray-300"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
              <button
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer flex items-center gap-1"
                onClick={handleClearConversation}
              >
                <Trash2 className="w-3 h-3" />
                Clear Conversation
              </button>
            </div>
          </div>
        </div>
      )} */}
      {/* Clear Conversation Button */}
      {hasResponse && (<div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200 z-50">
        <div className="max-w-4xl mx-auto">
          <button
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={handleClearConversation}
          >
            <Trash2 className="w-4 h-4 mr-1 inline-block" />
            Clear Conversation
          </button>
        </div>
      </div>)}
    </div>
  );
}