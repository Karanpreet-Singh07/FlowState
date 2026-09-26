import React, { useState, useEffect } from 'react';

export default function CoachModal({ isSlouching, postureScore }) {
  const [advice, setAdvice] = useState('Analyzing your posture...');
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isSlouching) {
      setIsOpen(true);
      fetchCoachingAdvice();
    }
  }, [isSlouching]);

  const fetchCoachingAdvice = async () => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `The user's posture score is ${postureScore}. Give a 1-sentence strict correction and a 10-second stretch instruction.` }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        setAdvice(data.candidates[0].content.parts[0].text);
      } else {
        setAdvice("Sit up straight and roll your shoulders back!");
      }
    } catch (error) {
      console.error("API Error:", error);
      setAdvice("Sit up straight and roll your shoulders back!");
    }
  };

  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0 && !isCompleted) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0) {
      setIsCompleted(true);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown, isCompleted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-red-500/50 p-6 rounded-2xl max-w-md w-full text-white shadow-2xl">
        <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Posture Alert</h2>
        <p className="text-gray-300 mb-6 text-lg">{advice}</p>

        <div className="bg-gray-800 p-4 rounded-xl text-center mb-6">
          <p className="text-sm text-gray-400 mb-1">Hold your stretch:</p>
          <span className="text-3xl font-extrabold text-blue-400">{countdown}s</span>
        </div>

        <button
          disabled={!isCompleted}
          onClick={() => { setIsOpen(false); setCountdown(10); setIsCompleted(false); }}
          className={`w-full py-3 rounded-xl font-bold transition-all ${isCompleted ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
        >
          {isCompleted ? "Resume Work" : "Complete Stretch First"}
        </button>
      </div>
    </div>
  );
}