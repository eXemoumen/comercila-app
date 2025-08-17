/**
 * Interface for month-year data
 */
export interface MonthYear {
    month: number; // 0-11 (JavaScript month format)
    year: number;
}

/**
 * French month names mapping for sorting and formatting
 */
export const FRENCH_MONTHS: Record<string, number> = {
    janvier: 0,
    février: 1,
    mars: 2,
    avril: 3,
    mai: 4,
    juin: 5,
    juillet: 6,
    août: 7,
    septembre: 8,
    octobre: 9,
    novembre: 10,
    décembre: 11,
};

/**
 * Get current month and year
 * @returns Object with current month (0-11) and year
 */
export function getCurrentMonth(): MonthYear {
    const currentDate = new Date();
    return {
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
    };
}

/**
 * Get array of dates for the last N days
 * @param n - Number of days to include
 * @returns Array of Date objects for the last N days (oldest to newest)
 */
export function getLastNDays(n: number): Date[] {
    return Array.from({ length: n }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
    }).reverse();
}

/**
 * Format month and year in French locale with proper capitalization
 * @param date - Date to format
 * @param locale - Locale string (default: "fr-FR")
 * @returns Formatted month-year string with capitalized first letter
 */
export function formatMonthYear(date: Date, locale: string = "fr-FR"): string {
    const monthYear = date.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
    });

    // Capitalize the first letter of the month
    return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
}

/**
 * Check if a date is in the current month
 * @param date - Date to check
 * @returns True if the date is in the current month and year
 */
export function isCurrentMonth(date: Date): boolean {
    const current = new Date();
    return (
        date.getMonth() === current.getMonth() &&
        date.getFullYear() === current.getFullYear()
    );
}

/**
 * Check if a date is in a specific month and year
 * @param date - Date to check
 * @param month - Month (0-11)
 * @param year - Year
 * @returns True if the date is in the specified month and year
 */
export function isInMonth(date: Date, month: number, year: number): boolean {
    return date.getMonth() === month && date.getFullYear() === year;
}

/**
 * Sort monthly data entries by chronological order
 * @param entries - Array of [monthYearString, data] tuples
 * @returns Sorted array of entries
 */
export function sortMonthlyData<T>(entries: Array<[string, T]>): Array<[string, T]> {
    return entries.sort((a, b) => {
        // Extract month and year from the formatted strings
        const monthA = a[0].split(" ")[0].toLowerCase();
        const yearA = a[0].split(" ")[1];
        const monthB = b[0].split(" ")[0].toLowerCase();
        const yearB = b[0].split(" ")[1];

        // Compare years first
        if (yearA !== yearB) {
            return parseInt(yearA) - parseInt(yearB);
        }

        // If years are equal, compare months
        return (
            (FRENCH_MONTHS[monthA] || 0) -
            (FRENCH_MONTHS[monthB] || 0)
        );
    });
}

/**
 * Get the start and end dates of a month
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Object with start and end dates of the month
 */
export function getMonthBounds(month: number, year: number): { start: Date; end: Date } {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return { start, end };
}

/**
 * Filter array of items by date within a specific month
 * @param items - Array of items with date property
 * @param month - Month (0-11)
 * @param year - Year
 * @param dateProperty - Property name containing the date (default: "date")
 * @returns Filtered array of items
 */
export function filterByMonth<T extends Record<string, unknown>>(
    items: T[],
    month: number,
    year: number,
    dateProperty: string = "date"
): T[] {
    return items.filter((item) => {
        const itemDate = new Date(item[dateProperty] as string);
        return isInMonth(itemDate, month, year);
    });
}

/**
 * Filter array of items by date within the current month
 * @param items - Array of items with date property
 * @param dateProperty - Property name containing the date (default: "date")
 * @returns Filtered array of items from current month
 */
export function filterByCurrentMonth<T extends Record<string, unknown>>(
    items: T[],
    dateProperty: string = "date"
): T[] {
    const { month, year } = getCurrentMonth();
    return filterByMonth(items, month, year, dateProperty);
}

/**
 * Get abbreviated month name in French
 * @param monthIndex - Month index (0-11)
 * @returns Abbreviated French month name (3 characters)
 */
export function getAbbreviatedFrenchMonth(monthIndex: number): string {
    const monthNames = [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
        "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"
    ];

    return monthNames[monthIndex] || "";
}

/**
 * Parse French month-year string to Date object
 * @param monthYearString - String in format "Janvier 2024"
 * @returns Date object for the first day of that month
 */
export function parseFrenchMonthYear(monthYearString: string): Date {
    const [monthName, yearString] = monthYearString.split(" ");
    const month = FRENCH_MONTHS[monthName.toLowerCase()];
    const year = parseInt(yearString);

    if (month === undefined || isNaN(year)) {
        throw new Error(`Invalid French month-year string: ${monthYearString}`);
    }

    return new Date(year, month, 1);
}

/**
 * Get weekday name in French (short format)
 * @param date - Date object
 * @param locale - Locale string (default: "fr-FR")
 * @returns Short weekday name in French
 */
export function getFrenchWeekday(date: Date, locale: string = "fr-FR"): string {
    return date.toLocaleDateString(locale, { weekday: "short" });
}

/**
 * Check if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
}

/**
 * Get the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between the dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
    const timeDifference = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
}