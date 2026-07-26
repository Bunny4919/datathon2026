import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' or 'kn'
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'kn-IN';
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'kn-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post(`/chat/query?query=${encodeURIComponent(input)}&session_id=${sessionId}&lang=${language}`);
      const resultsContent = typeof response.data.results === 'string'
        ? response.data.results
        : JSON.stringify(response.data.results, null, 2);

      const botMsg = {
        role: 'bot',
        content: resultsContent,
        sql: response.data.sql
      };
      setMessages(prev => [...prev, botMsg]);
      speak(resultsContent);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Error fetching data.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Crime Intelligence Chat</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="p-1 border rounded text-sm bg-white"
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>
        <button
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
          onClick={() => window.open(`http://localhost:8000/chat/export-pdf?session_id=${sessionId}`)}
        >
          Export PDF
        </button>
      </div>
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-white text-black self-start mr-auto'} max-w-md`}>
            <p>{msg.content}</p>
            {msg.sql && <pre className="text-xs mt-2 opacity-70">SQL: {msg.sql}</pre>}
          </div>
        ))}
        {loading && <p className="text-gray-500">Thinking...</p>}
      </div>
      <div className="flex gap-2">
        <button
          className={`p-2 rounded ${isListening ? 'bg-red-500' : 'bg-gray-300'} text-black`}
          onClick={startListening}
        >
          🎤
        </button>
        <input
          className="flex-1 p-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div}
    </div>
  );
};

export default Chat;
