'use client';

import * as React from 'react';
import { Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getApiBaseUrl } from '@/lib/api';

interface Doc {
  pageContent?: string;
  metdata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}

interface IMessage {
    role:'assistant' | 'user';
    content?:string;
    documents?:Doc[];
}

const ChatComponent: React.FC = () =>{

    const [message,setMessage] = React.useState<string>('');
    const [messages,setMessages] = React.useState<IMessage[]>([]);
    const [loading , setLoading] = React.useState<boolean>(false);

 const apiBaseUrl = getApiBaseUrl();

 const handleChatMessage = async() =>{
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);
       const res = await fetch(`${apiBaseUrl}/chat?message=${encodeURIComponent(message)}`);

       const data = await res.json();

       console.log("res",res);

       setMessages((prev)=>[
        ...prev ,{ role: 'assistant',
        content: data?.message,
        documents: data?.docs,}
       ]);
       setLoading(false);
       setMessage("");
 };

 return (
  <div className="p-4  h-screen flex flex-col text-white">
  {/* Header */}
  <div className="text-lg font-semibold mb-2">Chat with PDF</div>

  {/* Chat Messages Area */}
  <div className="flex-1 overflow-y-auto space-y-3 p-2">
    {messages.map((message, index) => (
      <div
        key={index}
        className={`p-3 rounded-lg max-w-[80%] ${
          message.role === "user"
            ? "bg-blue-600 self-end ml-auto"
            : "bg-[#2a2a2a] self-start"
        }`}
      >
        {message.role === "assistant" ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content ?? ""}
            </ReactMarkdown>
          </div>
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
      onChange={(e) =>setMessage(e.target.value)}
      className="flex-1 bg-transparent text-white placeholder-gray-400 px-4 py-2 focus:outline-none"
      placeholder="Type your message..."
    />
    <button
      onClick={handleChatMessage}
      className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-white"
    >
       {loading ? <Loader />:<h1>Send</h1>}
    </button>
  </div>
</div>


 )
}

export default ChatComponent;

