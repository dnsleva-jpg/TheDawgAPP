import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────

export interface ScreenTimeGoal {
  dailyHoursGoal: number;      // Target hours per day (e.g., 2)
  startingHours: number;       // What they reported in onboarding (e.g., 6)
  reductionPerWeek: number;    // Hours to reduce per week (auto-calculated)
  currentWeekGoal: number;     // This week's target (decreases over time)
}

export interface WeeklyReport {
  weekNumber: number;          // Week 1, 2, 3...
  date: string;                // YYYY-MM-DD when reported
  reportedHours: number;       // What user entered from Screen Time
  goalHours: number;           // What their goal was that week
  metGoal: boolean;            // Did they beat it?
}

export interface ScreenTimeCheckIn {
  date: string;
  hours: number;
  minutes: number;
}

// ─── Storage ─────────────────────────────────────────────

const GOAL_KEY = 'dawg_screentime_goal';
const REPORTS_KEY = 'dawg_screentime_reports';
const LAST_CHECKIN_KEY = 'dawg_screentime_last_checkin';

// ─── Goal Management ─────────────────────────────────────

export async function setScreenTimeGoal(startingHours: number): Promise<ScreenTimeGoal> {
  // Target: reduce to 2 hours/day over 12 weeks (90 days)
  const targetHours = Math.max(1, Math.min(startingHours * 0.33, 3)); // Aim for 1/3 of current, max 3hrs
  const totalReduction = startingHours - targetHours;
  const reductionPerWeek = totalReduction / 12; // Gradual over 12 weeks

  const goal: ScreenTimeGoal = {
    dailyHoursGoal: targetHours,
    startingHours,
    reductionPerWeek,
    currentWeekGoal: startingHours, // Starts at current level, reduces each week
  };

  await AsyncStorage.setItem(GOAL_KEY, JSON.stringify(goal));
  return goal;
}

export async function getScreenTimeGoal(): Promise<ScreenTimeGoal | null> {
  try {
    const data = await AsyncStorage.getItem(GOAL_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Get this week's screen time target based on weeks elapsed.
 * Gradually reduces from starting hours to target over 12 weeks.
 */
export async function getCurrentWeekGoal(weekNumber: number): Promise<number> {
  const goal = await getScreenTimeGoal();
  if (!goal) return 4; // default

  const reduction = goal.reductionPerWeek * Math.min(weekNumber, 12);
  return Math.max(goal.dailyHoursGoal, goal.startingHours - reduction);
}

// ─── Weekly Reports ──────────────────────────────────────

export async function saveWeeklyReport(reportedHours: number): Promise<WeeklyReport> {
  const all = await getWeeklyReports();
  const weekNumber = all.length + 1;
  const goalHours = await getCurrentWeekGoal(weekNumber);

  const report: WeeklyReport = {
    weekNumber,
    date: new Date().toISOString().split('T')[0],
    reportedHours,
    goalHours: Math.round(goalHours * 10) / 10,
    metGoal: reportedHours <= goalHours,
  };

  all.push(report);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(all));
  return report;
}

export async function getWeeklyReports(): Promise<WeeklyReport[]> {
  try {
    const data = await AsyncStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getLatestReport(): Promise<WeeklyReport | null> {
  const all = await getWeeklyReports();
  return all.length > 0 ? all[all.length - 1] : null;
}

// ─── Check if weekly report is due ───────────────────────

export async function isWeeklyReportDue(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(LAST_CHECKIN_KEY);
    if (!data) return true; // Never reported

    const lastDate = new Date(data);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
  } catch {
    return true;
  }
}

export async function markWeeklyReportDone(): Promise<void> {
  await AsyncStorage.setItem(LAST_CHECKIN_KEY, new Date().toISOString().split('T')[0]);
}

// ─── Score Contribution ──────────────────────────────────

/**
 * Calculate the screen time score component (0-100).
 * Based on how well user is tracking against their weekly goal.
 */
export async function getScreenTimeScore(): Promise<{ score: number; detail: string }> {
  const report = await getLatestReport();
  const goal = await getScreenTimeGoal();

  if (!report || !goal) {
    return { score: 50, detail: 'No data yet' }; // Neutral
  }

  // How far under/over goal
  const ratio = report.reportedHours / report.goalHours;

  let score: number;
  if (ratio <= 0.5) score = 100;       // Way under goal
  else if (ratio <= 0.75) score = 85;  // Well under
  else if (ratio <= 1.0) score = 70;   // Met goal
  else if (ratio <= 1.25) score = 45;  // Slightly over
  else if (ratio <= 1.5) score = 25;   // Over
  else score = 10;                      // Way over

  const diff = report.goalHours - report.reportedHours;
  const detail = diff >= 0
    ? `${Math.abs(diff).toFixed(1)}h under goal`
    : `${Math.abs(diff).toFixed(1)}h over goal`;

  return { score, detail };
}

/**
 * Get improvement percentage from start to latest report.
 */
export async function getImprovementPercent(): Promise<number | null> {
  const goal = await getScreenTimeGoal();
  const report = await getLatestReport();

  if (!goal || !report) return null;
  if (goal.startingHours <= 0) return null;

  return Math.round(((goal.startingHours - report.reportedHours) / goal.startingHours) * 100);
}
