/**
 * Utility functions for the Violet Wallet app
 */

/**
 * Formats a card number with proper spacing
 * @param {string} cardNumber - The card number to format
 * @returns {string} - Formatted card number
 */
function formatCardNumber(cardNumber) {
    // Remove any non-digit characters
    const digits = cardNumber.replace(/[^0-9]/g, '');

    // Add space every 4 digits
    const groups = [];
    for (let i = 0; i < digits.length; i += 4) {
        groups.push(digits.slice(i, i + 4));
    }

    return groups.join(' ');
}

/**
 * Formats an expiry date with a slash separator
 * @param {string} expiryDate - The expiry date to format
 * @returns {string} - Formatted expiry date (MM/YY)
 */
function formatExpiryDate(expiryDate) {
    // Remove any non-digit characters
    const digits = expiryDate.replace(/\D/g, '');

    // Format as MM/YY
    if (digits.length <= 2) {
        return digits;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

/**
 * Checks if an expiry date is valid and not expired
 * @param {string} expiryDate - The expiry date to check (MM/YY format)
 * @returns {boolean} - Whether the date is valid and not expired
 */
function isExpiryDateValid(expiryDate) {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        return false;
    }

    const [month, year] = expiryDate.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10) + 2000; // Convert to 4-digit year

    // Check if month is valid
    if (expMonth < 1 || expMonth > 12) {
        return false;
    }

    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = now.getFullYear();

    // Check if card is expired
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        return false;
    }

    return true;
}

/**
 * Detects the card type based on card number patterns
 * @param {string} cardNumber - The card number to check
 * @returns {string} - Card type (VISA, MASTERCARD, AMEX, etc.)
 */
function detectCardType(cardNumber) {
    // Remove spaces and non-digit characters
    const number = cardNumber.replace(/\D/g, '');

    // Visa: Starts with 4
    if (/^4/.test(number)) {
        return 'VISA';
    }

    // Mastercard: Starts with 51-55 or 2221-2720
    if (/^5[1-5]/.test(number) || /^(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[0-1][0-9]|2720)/.test(number)) {
        return 'MASTERCARD';
    }

    // American Express: Starts with 34 or 37
    if (/^3[47]/.test(number)) {
        return 'AMEX';
    }

    // Discover: Starts with 6011, 622126-622925, 644-649, or 65
    if (/^(6011|65|64[4-9]|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[01][0-9]|92[0-5]))/.test(number)) {
        return 'DISCOVER';
    }

    // Generic fallback
    return 'CARD';
}

/**
 * Formats a currency amount with proper symbol and decimals
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency amount
 */
function formatCurrency(amount) {
    // Parse the amount to a number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Format with $ symbol and 2 decimal places
    return `$${numAmount.toFixed(2)}`;
}

/**
 * Formats a date to a user-friendly string
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;

    // Format as Month Day, Year
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
}

/**
 * Generates a unique ID
 * @returns {number} - Unique ID based on timestamp
 */
function generateId() {
    return Date.now();
}

/**
 * Creates a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, info)
 * @param {number} duration - How long to show the toast (milliseconds)
 */
function showToast(title, message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Set toast content
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${title}</span>
            <button class="toast-close">×</button>
        </div>
        <div class="toast-message">${message}</div>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Handle close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.add('exit');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });

    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('exit');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }, duration);
}

/**
 * Simulates NFC card detection with a sample card
 * @param {Function} onSuccess - Callback with card data on success
 * @param {Function} onError - Callback with error on failure
 */
function mockNFCReading(onSuccess, onError) {
    // Simulate a delay for realistic NFC scanning
    setTimeout(() => {
        // 80% chance of success, 20% chance of failure for demo purposes
        if (Math.random() < 0.8) {
            const mockCardData = {
                cardNumber: '4111111111111111',
                cardholderName: 'NFC USER',
                expiryDate: '12/25',
                cvv: '123', // In real NFC, CVV is usually not available
            };

            onSuccess(mockCardData);
        } else {
            onError(new Error('Failed to read card. Please try again.'));
        }
    }, 2000);
}