/**
 * Utility functions for Indian Rupee (INR) currency and number formatting.
 */

/**
 * Format a number or numeric string as Indian Rupee currency (e.g. ₹2,980.50, ₹10,00,000.00).
 */
export const formatCurrency = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0.00';
  const num = Number(val);
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format a number or numeric string in the Indian number system (en-IN).
 */
export const formatNumber = (
  val: number | string | undefined | null,
  fractionDigits: number = 2
): string => {
  if (val === undefined || val === null || isNaN(Number(val))) return '0.00';
  const num = Number(val);
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

