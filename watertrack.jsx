import React, { useState, useEffect } from 'react';
import { saveWaterEvent, getSessionData } from '../utils/storage';

export default function WaterTracker({ isDrinkingGesture }) {
  const [waterCount, setWaterCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);

  // 1. Initialize count on load so data doesn't disappear on refresh
  useEffect(() => {
    const data = getSessionData();
    setWaterCount(data.waterCount);
  }, []);

  // 2. Listen to Person 1's vision model
  useEffect(() => {
    if (isDrinkingGesture && !cooldown) {
      handleLogWater();
    }
  }, [isDrinkingGesture, cooldown]);

  const handleLogWater = () => {
    if (cooldown) return; 
    
    // Save to storage and update UI state
    const updatedData = saveWaterEvent();
    setWaterCount(updatedData.waterCount);
    
    // Lock out the function for 5 seconds to prevent spamming from the webcam
    setCooldown(true);
    setTimeout(() => setCooldown(false), 5000); 
  };

  return (
    <div className="water-tracker-panel">
      <h3>Water Breaks: {waterCount}</h3>
      {cooldown && <p className="success-text">💧 Logged!</p>}
      
      {/* DEMO FALLBACK: Do not remove this button. */}
      <button onClick={handleLogWater} disabled={cooldown}>
        {cooldown ? 'Cooldown Active' : 'Log Manually'}
      </button>
    </div>
  );
}