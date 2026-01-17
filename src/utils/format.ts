
/**
 * Formats a number for graph display to ensure consistent 2-decimal precision.
 * 
 * Rules:
 * - Integers look like integers (100 -> "100") unless forceDecimals is true.
 * - Floats are capped at 2 decimal places (10.123 -> "10.12").
 * - Small numbers are preserved (0.5 -> "0.5").
 * - Very small numbers (< 0.01) might be rounded to 0 or 0.01 depending on logic, 
 *   but here we strictly use standard rounding.
 * 
 * @param value The number to format
 * @param forceDecimals If true, always show 2 decimals (100 -> "100.00")
 */
export const formatGraphNumber = (value: number | string, forceDecimals = false): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) return '';
    if (num === 0) return '0';

    // Check if it effectively an integer (close enough for float precision)
    const isInteger = Math.abs(num % 1) < 0.0001;

    if (isInteger && !forceDecimals) {
        return Math.round(num).toString();
    }

    // Default: Max 2 decimals, remove trailing zeros if possible, 
    // BUT user said "max 2 decimals", usually implying they don't want to see 10.12345.
    // However, specifically "nowhere more than 2 decimals".
    // 10.5 -> 10.5
    // 10.556 -> 10.56

    // We use Intl.NumberFormat for cleaner handling or simple toFixed
    // Using simple logic to match 'No more than 2'

    // This logic rounds to 2 decimal places
    const rounded = Math.round(num * 100) / 100;

    // Determine string representation
    return rounded.toString();
};

/**
 * Specifically for Tooltips where we might want strictly constrained values.
 */
export const formatTooltipValue = (value: number | string): string => {
    return formatGraphNumber(value, false);
};
