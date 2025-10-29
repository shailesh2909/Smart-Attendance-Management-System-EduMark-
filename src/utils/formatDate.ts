import { Timestamp } from "firebase/firestore";

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | Timestamp, format: "short" | "long" | "time" | "datetime" = "short"): string {
  const dateObj = date instanceof Timestamp ? timestampToDate(date) : date;
  
  switch (format) {
    case "short":
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "long":
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    case "time":
      return dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    case "datetime":
      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(date: Date | Timestamp): string {
  const dateObj = date instanceof Timestamp ? timestampToDate(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "Just now";
  }
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }
  
  return "Just now";
}

/**
 * Check if date is today
 */
export function isToday(date: Date | Timestamp): boolean {
  const dateObj = date instanceof Timestamp ? timestampToDate(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in current week
 */
export function isThisWeek(date: Date | Timestamp): boolean {
  const dateObj = date instanceof Timestamp ? timestampToDate(date) : date;
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return dateObj >= weekStart && dateObj <= weekEnd;
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return { start, end };
}

/**
 * Get date range for current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)));
  const end = new Date(now.setDate(now.getDate() - now.getDay() + 7));
  
  return { start, end };
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | Timestamp): string {
  const dateObj = date instanceof Timestamp ? timestampToDate(date) : date;
  return dateObj.toISOString().split("T")[0];
}

/**
 * Parse date from input field
 */
export function parseDateFromInput(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

/**
 * Get academic year based on date
 */
export function getAcademicYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  if (month >= 7) {
    // July onwards is the new academic year
    return `${year}-${year + 1}`;
  } else {
    // January to June is the previous academic year
    return `${year - 1}-${year}`;
  }
}

/**
 * Get current semester based on date
 */
export function getCurrentSemester(date: Date = new Date()): "1" | "2" {
  const month = date.getMonth() + 1;
  
  if (month >= 7 && month <= 12) {
    return "1"; // Odd semester (July - December)
  } else {
    return "2"; // Even semester (January - June)
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | Timestamp, date2: Date | Timestamp): boolean {
  const d1 = date1 instanceof Timestamp ? timestampToDate(date1) : date1;
  const d2 = date2 instanceof Timestamp ? timestampToDate(date2) : date2;
  
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}