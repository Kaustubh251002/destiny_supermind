// components/AIChat.js
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
    <div className="rounded-xl p-6 bg-opacity-60 backdrop-blur-md">
      <h2 className="text-l font-semibold mb-4">AI Assistant</h2>
      <div className="chat-container mb-4" style={{ height: '400px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'} text-sm`}
          >
            <div
              className={`rounded-lg p-3 max-w-[90%] ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-gray-800'}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <i className="fa fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default AIChat;
