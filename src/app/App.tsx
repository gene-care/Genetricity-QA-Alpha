import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { DisclaimerNotice } from "./components/DisclaimerNotice";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { CommonQuestions } from "./components/CommonQuestions";
import { FeedbackForm } from "./components/FeedbackForm";
import { LoginBox } from "./components/LoginBox";
import { sendChat, fetchQuestions, fetchPresetAnswer } from "./services/api";
import type { Message, AuthState, QuestionItem } from "./types";
import logo from "../assets/logo.png";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, userId: null });
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuestions()
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!auth.isAuthenticated || !auth.userId) return;

    setMessages([]);
    setCurrentQuestion(content);
    setActiveRecordId(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages([userMessage]);
    setIsTyping(true);

    try {
      const result = await sendChat(content, auth.userId);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: result.answer,
        references: result.references,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setActiveRecordId(result.recordId);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePresetQuestion = async (question: string) => {
    if (!auth.isAuthenticated || !auth.userId) return;

    setMessages([]);
    setCurrentQuestion(question);
    setActiveRecordId(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages([userMessage]);
    setIsTyping(true);

    try {
      const result = await fetchPresetAnswer(question, auth.userId);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: result.answer,
        references: result.references,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setActiveRecordId(result.recordId);
    } catch {
      // Fall back to live RAG if the question isn't in V2_Train
      try {
        const result = await sendChat(question, auth.userId);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: result.answer,
          references: result.references,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setActiveRecordId(result.recordId);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), type: "bot", content: "Sorry, something went wrong. Please try again.", timestamp: new Date() },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setCurrentQuestion("");
    setActiveRecordId(null);
  };

  return (
    <div className="size-full flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <div className="rounded-lg">
              <img
                src={logo}
                alt="Genetricity logo"
                className="w-16 h-14 object-contain rounded-2xl"
              />
            </div>
            <span className="text-5xl font-semibold tracking-tight leading-none">
              <span className="text-[#22235B]">Gene</span>
              <span className="text-[#1F7A5C]">tricity</span>
            </span>
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Input Area with Disclaimer and Top Questions */}
        <div className="px-6 pt-4 pb-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {/* Input Area - hidden when a category is selected */}
              {!selectedCategory && (
                <div className="col-span-2 h-64 flex flex-col gap-4">
                  <DisclaimerNotice />
                  <div className="flex-1">
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      disabled={isTyping || !auth.isAuthenticated}
                      value={currentQuestion}
                      onChange={setCurrentQuestion}
                    />
                  </div>
                </div>
              )}

              {/* Top Questions - expands to full width when category selected */}
              <div className={`h-64 transition-all duration-300 ${selectedCategory ? "col-span-3" : "col-span-1"}`}>
                {auth.isAuthenticated && (
                  <CommonQuestions
                    questions={questions}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    onSelectQuestion={(q) => handlePresetQuestion(q)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 pb-16">
          <div className={`max-w-4xl mx-auto pb-4 ${selectedCategory ? "pt-0" : "pt-10"}`}>
            {/* Messages */}
            <div className="space-y-2">
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
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Feedback and Login Section */}
            <div className="mt-6 bg-gray-100 p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Feedback Form - Takes 2 columns */}
                <div className="col-span-2">
                  <FeedbackForm
                    recordId={activeRecordId}
                    onSubmitComplete={() => setActiveRecordId(null)}
                  />
                </div>

                {/* Login Box - Takes 1 column */}
                <div className="col-span-1">
                  <LoginBox auth={auth} onAuthChange={setAuth} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Conversation Button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200 z-50">
        <div className="max-w-4xl mx-auto">
          <button
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={handleClearConversation}
          >
            <Trash2 className="w-4 h-4 mr-1 inline-block" />
            Clear Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
