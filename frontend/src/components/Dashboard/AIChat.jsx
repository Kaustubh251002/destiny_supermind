'use client'
import React, { useState } from 'react';

const AIChat = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your InstaBuddy AI assistant. How can I help you analyze your Instagram profile?", sender: 'ai' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);

    setTimeout(() => {
      const aiResponse = {
        text: 'Based on your profile analytics, your engagement rate is highest with carousel posts. Would you like to know more about optimizing your content strategy?',
        sender: 'ai',
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);

    setInput('');
  };

  return (
    <div className="rounded-xl p-6 bg-white bg-opacity-80 backdrop-blur-lg shadow-xl w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">AI Assistant</h2>
      <div className="chat-container mb-4 overflow-y-auto" style={{ maxHeight: '350px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col space-y-4 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-4 rounded-2xl max-w-[85%] ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-blue-50 text-gray-700'}`}
              style={{ marginBottom: '10px' }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-3 mt-4">
        <input
          type="text"
          className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-800"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
        >
          <i className="fa fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default AIChat;
