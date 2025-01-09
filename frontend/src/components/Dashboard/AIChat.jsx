'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown'; // Ensure you have installed `react-markdown`

const AIChat = ({ username }) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your InstaBuddy AI assistant. How can I help you analyze your Instagram profile?", sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Query the backend API
      const response = await fetch(`${backendUrl}/getInsights?username=${username}&query=${input}`);
      const data = await response.json();

      // Add AI response to the messages
      setMessages((prev) => [
        ...prev,
        { text: data.response || "I'm sorry, I couldn't process your request.", sender: 'ai' },
      ]);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setMessages((prev) => [
        ...prev,
        { text: "Something went wrong while processing your query. Please try again later.", sender: 'ai' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl p-6 bg-white bg-opacity-80 backdrop-blur-lg shadow-xl w-full mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">AI Assistant</h2>
      <div className="chat-container mb-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col space-y-4 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-4 rounded-2xl max-w-[90%] ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-blue-50 text-gray-700'}`}
              style={{
                marginBottom: '10px',
                animation: 'fadeIn 0.5s ease-in-out',
              }}
            >
              {msg.sender === 'ai' ? (
                <ReactMarkdown
                  components={{
                    // Custom render for Markdown elements like code, tables, etc.
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full table-auto border-collapse text-sm text-gray-600">
                          <thead>
                            <tr>
                              {children[0].props.children.map((th, i) => (
                                <th key={i} className="px-4 py-2 text-left border-b border-gray-300">{th}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {children.slice(1).map((tr, i) => (
                              <tr key={i} className="hover:bg-gray-100">
                                {tr.props.children.map((td, j) => (
                                  <td key={j} className="px-4 py-2 border-b border-gray-300">{td}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ),
                    code: ({ node, inline, className, children }) => {
                      const language = className?.replace(/language-/, '');
                      return inline ? (
                        <code className="bg-gray-100 px-2 py-1 rounded-md font-mono text-sm">{children}</code>
                      ) : (
                        <pre className="bg-gray-800 text-white p-4 rounded-md my-2 overflow-x-auto">
                          <code className={`language-${language}`}>{children}</code>
                        </pre>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="p-4 rounded-2xl max-w-[85%] bg-blue-50 text-gray-700 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-3 mt-4">
        <input
          type="text"
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && input.trim() && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()} // Disable button when input is empty
          className={`p-3 rounded-2xl transition-all duration-300 ${
            input.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <i className="fa fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default AIChat;
