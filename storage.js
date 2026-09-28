const SESSION_KEY = 'flowstate_current_session';

// Safely retrieve data for Person 2's Dashboard to read
export const getSessionData = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    // Initialize a fresh schema if nothing exists
    return raw ? JSON.parse(raw) : { waterCount: 0, waterLogs: [], slouchCount: 0 };
  } catch (error) {
    console.error("Local storage corrupted. Resetting data.", error);
    localStorage.removeItem(SESSION_KEY);
    return { waterCount: 0, waterLogs: [], slouchCount: 0 };
  }
};

// Write function for your WaterTracker
export const saveWaterEvent = () => {
  const data = getSessionData();
  data.waterCount += 1;
  data.waterLogs.push(new Date().toISOString());
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Storage write failed. Quota exceeded or blocked.", error);
    return data; // Return in-memory data so the UI doesn't break
  }
};

// Person 2 will need this for the "End Session" button
export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};