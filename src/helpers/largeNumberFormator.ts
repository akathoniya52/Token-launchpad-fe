// Function to format numbers in billions, millions, etc.
export function formatNumber(num) {
    if (num >= 1e9) {
      return (num / 1e9) + 'B'; // Format as billions
    } else if (num >= 1e6) {
      return (num / 1e6) + 'M'; // Format as millions
    } else if (num >= 1e3) {
      return (num / 1e3) + 'K'; // Format as thousands
    }
    return num.toString(); // Return as is for smaller numbers
  }