// Currency Formatter
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

// Date Formatter
export const formatDate = (dateString, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    return new Date(dateString).toLocaleDateString(
        'en-US', 
        { ...defaultOptions, ...options }
    );
};

// Number Formatter
export const formatNumber = (value, decimals = 2) => {
    return Number(value).toFixed(decimals);
};

// Percentage Formatter
export const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
};

// Truncate Text
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength 
        ? `${text.substring(0, maxLength)}...` 
        : text;
};
