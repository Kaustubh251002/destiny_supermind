'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TypeWriter = ({ text, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 10); // Changed from 30 to 10 for faster typing speed

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <span className="whitespace-pre-wrap">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <span className="inline">{children}</span>,
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return (
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <span className="inline">{children}</span>;
          },
          table: ({ children }) => (
            <span className="block w-full overflow-x-auto my-4">
              <table className="min-w-full table-auto border-collapse">
                {children}
              </table>
            </span>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {children}
            </td>
          ),
        }}
      >
        {displayText}
      </ReactMarkdown>
    </span>
  );
};

// Rest of the code remains exactly the same...
const AIChat = ({ username }) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your InstaBuddy AI assistant. How can I help you analyze your Instagram profile?", sender: 'ai', completed: true },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markMessageAsComplete = (index) => {
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, completed: true } : msg
    ));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user', completed: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/getInsights?username=${username}&query=${input}`);
      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { text: data.response || "I'm sorry, I couldn't process your request.", sender: 'ai', completed: false },
      ]);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setMessages(prev => [
        ...prev,
        { text: "Something went wrong while processing your query. Please try again later.", sender: 'ai', completed: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl p-6 bg-white shadow-xl w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">AI Assistant</h2>
      
      <div className="chat-container mb-4 overflow-y-auto h-[200px] pr-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div
              className={`rounded-lg p-4 max-w-[80%] ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.sender === 'ai' && !msg.completed ? (
                <TypeWriter 
                  text={msg.text} 
                  onComplete={() => markMessageAsComplete(index)}
                />
              ) : (
                <span className="whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <span className="inline">{children}</span>,
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return (
                          <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre({ children }) {
                        return <span className="inline">{children}</span>;
                      },
                      table: ({ children }) => (
                        <span className="block w-full overflow-x-auto my-4">
                          <table className="min-w-full table-auto border-collapse">
                            {children}
                          </table>
                        </span>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-50">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {loading && (
          <div className="flex items-start">
            <div className="rounded-lg p-4 max-w-[80%] bg-gray-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3 mt-4">
        <input
          type="text"
          className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && input.trim() && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className={`px-6 py-3 rounded-lg transition-all duration-300 ${
            input.trim() && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChat;