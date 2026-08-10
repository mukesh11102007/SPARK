import React, { useState, useEffect } from 'react';
import { generateAppFromVoice } from '../services/AIOrchestrator';

export const VoiceAssistant = ({ onAppGenerated }) => {
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      console.warn("Speech Recognition API not supported.");
    }
  }, []);

  const processInput = async (input) => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const generatedCode = await generateAppFromVoice(input);
      onAppGenerated(generatedCode);
    } catch (e) {
      console.error(e);
      alert("Failed to generate code via Gemini.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      await processInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    processInput(textInput);
    setTextInput('');
  };

  return (
    <div className="sidebar-section">
      <h3>INTENT TO APP (GEMINI)</h3>
      <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input 
          type="text" 
          placeholder="Describe component..." 
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          disabled={isListening || isProcessing}
          className="ide-input"
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="ide-btn" onClick={handleListen} disabled={isListening || isProcessing} style={{ flex: 1, backgroundColor: isListening ? '#f14c4c' : '' }}>
              {isListening ? '...' : 'Speak'}
          </button>
          <button type="submit" className="ide-btn ide-btn-secondary" disabled={!textInput.trim() || isListening || isProcessing} style={{ flex: 1 }}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
