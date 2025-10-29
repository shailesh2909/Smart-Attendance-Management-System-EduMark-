/**
 * Calculate attendance percentage
 * @param present Number of present sessions
 * @param total Total number of sessions
 * @param includeLate Whether to include late sessions as present (default: true)
 * @param late Number of late sessions (default: 0)
 * @returns Percentage rounded to 2 decimal places
 */
export function calculateAttendancePercentage(
  present: number,
  total: number,
  includeLate: boolean = true,
  late: number = 0
): number {
  if (total === 0) return 0;
  
  const attendedSessions = includeLate ? present + late : present;
  return Math.round((attendedSessions / total) * 100 * 100) / 100;
}

/**
 * Get attendance status based on percentage
 * @param percentage Attendance percentage
 * @returns Status object with color and label
 */
export function getAttendanceStatus(percentage: number): {
  status: "excellent" | "good" | "average" | "poor" | "critical";
  color: string;
  bgColor: string;
  label: string;
} {
  if (percentage >= 90) {
    return {
      status: "excellent",
      color: "text-green-700",
      bgColor: "bg-green-100",
      label: "Excellent"
    };
  } else if (percentage >= 80) {
    return {
      status: "good",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      label: "Good"
    };
  } else if (percentage >= 70) {
    return {
      status: "average",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      label: "Average"
    };
  } else if (percentage >= 60) {
    return {
      status: "poor",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      label: "Poor"
    };
  } else {
    return {
      status: "critical",
      color: "text-red-700",
      bgColor: "bg-red-100",
      label: "Critical"
    };
  }
}

/**
 * Calculate required attendance to reach target percentage
 * @param currentPresent Current present sessions
 * @param currentTotal Current total sessions
 * @param targetPercentage Target percentage to achieve
 * @returns Number of consecutive present sessions needed
 */
export function calculateRequiredAttendance(
  currentPresent: number,
  currentTotal: number,
  targetPercentage: number = 75
): number {
  if (currentTotal === 0) return 0;
  
  const currentPercentage = (currentPresent / currentTotal) * 100;
  
  if (currentPercentage >= targetPercentage) {
    return 0; // Already achieved target
  }
  
  // Formula: (currentPresent + x) / (currentTotal + x) = targetPercentage / 100
  // Solving for x: x = (targetPercentage * currentTotal - 100 * currentPresent) / (100 - targetPercentage)
  const requiredSessions = Math.ceil(
    (targetPercentage * currentTotal - 100 * currentPresent) / (100 - targetPercentage)
  );
  
  return Math.max(0, requiredSessions);
}

/**
 * Format percentage for display
 * @param percentage Percentage value
 * @param showDecimals Whether to show decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number, showDecimals: boolean = true): string {
  if (showDecimals) {
    return `${percentage.toFixed(1)}%`;
  }
  return `${Math.round(percentage)}%`;
}