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

const HISTORY_KEY = 'flowstate_session_history';

// Retrieve saved past sessions
export const getStoredHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load history from local storage.", error);
    return [];
  }
};

// Save session history
export const saveStoredHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history to local storage.", error);
  }
};

// Clear session history
export const clearStoredHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history from local storage.", error);
  }
};

const WATER_GOAL_KEY = 'flowstate_daily_water_goal';

// Retrieve daily water goal (default: 8 glasses)
export const getDailyWaterGoal = () => {
  try {
    const raw = localStorage.getItem(WATER_GOAL_KEY);
    const parsed = raw ? parseInt(raw, 10) : 8;
    return isNaN(parsed) || parsed <= 0 ? 8 : parsed;
  } catch (error) {
    return 8;
  }
};

// Save daily water goal
export const saveDailyWaterGoal = (goal) => {
  try {
    const safeGoal = Math.max(1, Math.min(30, parseInt(goal, 10) || 8));
    localStorage.setItem(WATER_GOAL_KEY, safeGoal.toString());
    return safeGoal;
  } catch (error) {
    console.error("Failed to save water goal to local storage.", error);
    return goal;
  }
};

/**
 * Calculates total water logged today from session history + current active session.
 */
export const getTodayWaterCount = (history = [], currentSessionWater = 0) => {
  const todayStr = new Date().toDateString();
  const pastTodayTotal = (history || []).reduce((acc, session) => {
    if (!session || !session.timestamp) return acc;
    const sessionDate = new Date(session.timestamp).toDateString();
    return sessionDate === todayStr ? acc + (parseInt(session.waterCount, 10) || 0) : acc;
  }, 0);
  return pastTodayTotal + (parseInt(currentSessionWater, 10) || 0);
};

/**
 * Calculates current consecutive day streak.
 * A day counts towards the streak if at least one session was completed.
 * Streak is 0 if no sessions exist, or if the most recent session was before yesterday.
 *
 * BUG FIX: new Date("YYYY-MM-DD") parses as UTC midnight, which shifts to the
 * PREVIOUS day in timezones ahead of UTC (e.g. India +05:30 → "2026-09-28" UTC
 * becomes "2026-09-27" local). We fix this by working entirely with local date
 * strings using the 3-arg Date constructor (year, month, day) which is local time.
 */
export const calculateStreak = (history) => {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return 0;
  }

  // Returns "YYYY-MM-DD" in LOCAL time (not UTC) for a given Date object
  const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Subtracts 1 day from a "YYYY-MM-DD" string, returns new "YYYY-MM-DD" string
  // Uses 3-arg Date constructor so arithmetic stays in local time
  const subtractDay = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d); // local time — no UTC shift
    date.setDate(date.getDate() - 1);
    return toLocalDateStr(date);
  };

  // Extract unique local date strings from session timestamps
  const dateSet = new Set();
  for (const session of history) {
    const rawDate = session.timestamp || session.date;
    if (rawDate) {
      // ISO timestamps (e.g. "2026-09-28T05:00:00.000Z") are absolute points in
      // time — new Date() on them is correct. We then convert to local date string.
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateSet.add(toLocalDateStr(d));
      }
    }
  }

  if (dateSet.size === 0) return 0;

  // Sort descending (newest first)
  const uniqueDates = Array.from(dateSet).sort().reverse();

  const todayStr = toLocalDateStr(new Date());
  const yesterdayStr = subtractDay(todayStr);

  const latestDate = uniqueDates[0];

  // Streak is broken if the most recent session was before yesterday
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return 0;
  }

  // Count consecutive days going backwards
  let streak = 0;
  let expectedStr = latestDate;

  for (const dStr of uniqueDates) {
    if (dStr === expectedStr) {
      streak++;
      expectedStr = subtractDay(expectedStr);
    } else {
      break;
    }
  }

  return streak;
};