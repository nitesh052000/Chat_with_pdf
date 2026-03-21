'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getApiBaseUrl } from '@/lib/api';
import { ArrowUp, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Doc {
  pageContent?: string;
  metdata?: {
    loc?: { pageNumber?: number };
    source?: string;
  };
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
  isLoading?: boolean; // 👈 new field
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false); // 👈 new state

  const apiBaseUrl = getApiBaseUrl();

  const handleChatMessage = async () => {
    if (!message.trim() || isGenerating) return; // prevent double-send

    const currentMessage = message;
    setMessage('');
    setError(null);

    // Add user message + a placeholder assistant "loading" bubble
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: currentMessage },
      { role: 'assistant', isLoading: true }, // 👈 loading bubble
    ]);
    setIsGenerating(true);

    try {
      const res = await fetch(
        `${apiBaseUrl}/chat?message=${encodeURIComponent(currentMessage)}`
      );

      const text = await res.text();
      const data = (() => {
        try { return JSON.parse(text); }
        catch { return null; }
      })();

      if (!res.ok) {
        const serverMsg =
          (data && (data.message || data.error)) ||
          `Request failed with status ${res.status}`;
        setError(String(serverMsg));
        // Remove the loading bubble on error
        setMessages((prev) => prev.filter((m) => !m.isLoading));
        return;
      }

      // Replace the loading bubble with the real response
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? { role: 'assistant', content: data?.message, documents: data?.docs }
            : m
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setMessages((prev) => prev.filter((m) => !m.isLoading));
    } finally {
      setIsGenerating(false); // 👈 reset generating state
    }
  };

  return (
    <div className="p-4 h-screen flex flex-col text-white">
      {/* Header */}
      <div className="text-lg font-semibold mb-2">Chat with PDF</div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 flex flex-col">
        {error ? (
          <div className="p-3 rounded-lg bg-red-700/40 border border-red-500/40">
            {error}
          </div>
        ) : null}

        {messages.length === 0 && !error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white text-3xl gap-6">
            <Image
  src="/undraw_upload_cucu.svg"
  alt="Upload"
  width={200}
  height={200}
  className="mx-auto"
/>
            Upload a pdf to start chatting
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] ${
              message.role === 'user'
                ? 'bg-blue-600 self-end ml-auto'
                : 'bg-[#2a2a2a] self-start'
            }`}
          >
            {message.role === 'assistant' ? (
              message.isLoading ? (
                // 👇 Generating bubble
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating answer...</span>
                </div>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content ?? ''}
                  </ReactMarkdown>
                </div>
              )
            ) : (
              <span className="whitespace-pre-wrap">{message.content}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="mt-4 flex items-center gap-2 bg-[#2a2a2a] p-3 rounded-lg">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleChatMessage()} // 👈 optional: Enter to send
          className="flex-1 bg-transparent text-white placeholder-gray-400 px-4 py-2 focus:outline-none"
          placeholder="Ask anything about your PDF..."
          disabled={isGenerating} // 👈 disable input while generating
        />
        <button
          onClick={handleChatMessage}
          disabled={isGenerating} // 👈 disable button while generating
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition px-4 py-2 rounded-lg text-white"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" /> // 👈 spinner on button too
          ) : (
            <ArrowUp />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;

