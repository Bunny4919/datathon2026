import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Download, 
  Database,
  RefreshCw,
  Terminal,
  HelpCircle
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  sql?: string;
  results?: any;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' or 'kn'
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [currentSql, setCurrentSql] = useState('');
  const [currentResults, setCurrentResults] = useState<any>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 10).toUpperCase());
    
    setMessages([
      {
        role: 'bot',
        content: "System Initialized. I am your Crime Intelligence Assistant. You can query records of FIRs, accused, victims, locations, financial transactions, and spatial crime stats in English or Kannada. Try asking 'How many total FIRs are registered?'",
      }
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!isSpeaking) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : 'kn-IN';
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'kn-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userQuery = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setLoading(true);

    try {
      const response = await api.post(
        `/chat/query?query=${encodeURIComponent(userQuery)}&session_id=${sessionId}&lang=${language}`
      );
      
      const botResponse = response.data.response || 'No analysis could be completed.';
      const generatedSql = response.data.sql || '';
      const rawResults = response.data.results || null;

      setCurrentSql(generatedSql);
      setCurrentResults(rawResults);

      setMessages(prev => [...prev, {
        role: 'bot',
        content: botResponse,
        sql: generatedSql,
        results: rawResults
      }]);

      speakText(botResponse);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: "Error processing query. Re-attempting connection to local intelligence database."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    const baseUrl = api.defaults.baseURL || 'http://localhost:8000';
    window.open(`${baseUrl}/chat/export-pdf?session_id=${sessionId}`);
  };

  const triggerSampleQuery = (q: string) => {
    setInput(q);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] relative">
      {/* Primary Chat Box */}
      <div className="flex-1 bg-white rounded-[24px] border border-slate-200/80 shadow-xl shadow-purple-900/5 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 text-[#7C3AED] flex items-center justify-center font-bold">
              <MessageSquare size={19} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Operational Chat Transcript</p>
              <span className="text-[10px] text-slate-400 font-medium">
                Session ID: <span className="text-[#7C3AED] font-mono font-bold">{sessionId}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Language Selection */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/10 font-bold transition-all"
            >
              <option value="en">English (US)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>

            {/* Audio speaker toggle */}
            <button
              onClick={() => {
                setIsSpeaking(!isSpeaking);
                window.speechSynthesis.cancel();
              }}
              className={`p-2 border rounded-xl transition-all ${
                isSpeaking 
                  ? 'bg-purple-50 border-purple-200 text-[#7C3AED]' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
              title={isSpeaking ? "Mute Voice Out" : "Enable Voice Out"}
            >
              {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
            >
              <Download size={14} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-3 max-w-[75%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-md shadow-purple-500/20' 
                  : 'bg-white border border-slate-200/80 text-slate-600 shadow-xs'
              }`}>
                <MessageSquare size={16} />
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white rounded-tr-none shadow-md shadow-purple-500/15' 
                  : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
                {msg.sql && (
                  <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                      <Terminal size={10} />
                      <span>SQL Query Executed</span>
                    </div>
                    <code className="text-xs font-mono text-purple-300 break-all">{msg.sql}</code>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold pl-2">
              <RefreshCw size={14} className="animate-spin text-[#7C3AED]" />
              <span>Analyzing database context...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-2.5">
          {/* Micro Button */}
          <button
            onClick={startListening}
            className={`p-3.5 rounded-xl transition-all cursor-pointer ${
              isListening 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/30' 
                : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50'
            }`}
            title="Voice Interaction (Mic)"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            className="flex-1 px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all placeholder:text-slate-400"
            placeholder={language === 'en' ? "Ask about crime reports, accused profiles, transactions..." : "ಗುರತಿಸಲಾದ ಅಪರಾಧಗಳು ಅಥವಾ ಆರೋಪಿಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />

          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all cursor-pointer"
          >
            <Send size={16} />
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* SQL Debug / Active Panel */}
      <div className="w-80 bg-white rounded-[24px] border border-slate-200/80 shadow-xl shadow-purple-900/5 flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-4 px-5 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/70">
          <Database size={17} className="text-[#7C3AED]" />
          <h3 className="text-sm font-bold text-slate-900">Active SQL Debugger</h3>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* SQL Panel */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Generated SQL Query</span>
            {currentSql ? (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-purple-300 break-all select-all">
                {currentSql}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-medium">No query has been generated in this session yet.</p>
            )}
          </div>

          {/* Results Panel */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Query Execution Results (JSON)</span>
            {currentResults ? (
              <div className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] text-purple-200 overflow-auto max-h-[280px]">
                <pre>{JSON.stringify(currentResults, null, 2)}</pre>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-medium">No records retrieved.</p>
            )}
          </div>

          {/* Sample Queries */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] text-[#7C3AED] font-bold uppercase tracking-wider block mb-2 flex items-center gap-1">
              <HelpCircle size={11} />
              <span>Sample Queries</span>
            </span>
            <div className="space-y-1.5">
              {[
                "How many FIRs are in the database?",
                "List the top 5 oldest accused offenders",
                "Show all financial transactions above 500,000",
                "Show literacy and unemployment rate of districts",
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => triggerSampleQuery(q)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-[#7C3AED] rounded-xl text-left text-[11px] font-semibold border border-slate-200/70 transition-all truncate cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
