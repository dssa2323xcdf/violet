
/**
 * Main application for Violet Wallet
 * Initializes the app and sets up event listeners
 */

// DOM Elements
const scanButton = document.getElementById('scanButton');
const scannerOverlay = document.getElementById('scannerOverlay');
const closeScannerBtn = document.getElementById('closeScanner');
const cameraFeed = document.getElementById('cameraFeed');
const captureButton = document.getElementById('captureButton');
const capturedImageContainer = document.getElementById('capturedImageContainer');
const capturedImage = document.getElementById('capturedImage');
const permissionDenied = document.getElementById('permissionDenied');
const retryPermission = document.getElementById('retryPermission');

// Form Elements
const cardNumberInput = document.getElementById('cardNumber');
const cardHolderInput = document.getElementById('cardHolder');
const expDateInput = document.getElementById('expDate');
const cvvInput = document.getElementById('cvv');

// Current app state
let appState = {
    isInitialized: false,
    currentScreen: 'splash-screen'
};
let stream = null;
let captureContext = null;

/**
 * Format card number with spaces
 */
function formatCardNumber(value) {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Format expiration date MM/YY
 */
function formatExpDate(value) {
    value = value.replace(/\D/g, '');
    if (value.length > 2) {
        return value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    return value;
}









// Add input formatters
cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    e.target.value = formatCardNumber(value);
});

expDateInput.addEventListener('input', (e) => {
    e.target.value = formatExpDate(e.target.value);
});

cvvInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// Open scanner
scanButton.addEventListener('click', () => {
    openScanner();
});

// Close scanner and stop camera
function closeScanner() {
    scannerOverlay.classList.remove('active');
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    capturedImageContainer.classList.remove('active');
}

closeScannerBtn.addEventListener('click', () => {
    closeScanner();
});

// Open scanner and initialize camera
function openScanner() {
    scannerOverlay.classList.add('active');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        })
        .then((mediaStream) => {
            stream = mediaStream;
            cameraFeed.srcObject = stream;
            cameraFeed.play();
        })
        .catch((err) => {
            console.error('Camera access error:', err);
            permissionDenied.classList.add('active');
            scannerOverlay.classList.remove('active');
        });
    } else {
        alert('Sorry, your browser does not support camera access');
        scannerOverlay.classList.remove('active');
    }
}

// Retry camera permission
retryPermission.addEventListener('click', () => {
    permissionDenied.classList.remove('active');
    openScanner();
});

// Capture image from camera
captureButton.addEventListener('click', () => {
    if (!stream) return;

    const canvas = capturedImage;
    const context = canvas.getContext('2d');
    captureContext = context;

    // Set canvas dimensions to match video
    canvas.width = cameraFeed.videoWidth;
    canvas.height = cameraFeed.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);

    // Show captured image container with loading animation
    capturedImageContainer.classList.add('active');

    // Process the captured image after a short delay
    setTimeout(() => {
        processCardImage();
    }, 2000);
});

// Luhn algorithm check for credit card validation
function luhnCheck(cardNumber) {
    if (!cardNumber) return false;

    let sum = 0;
    let shouldDouble = false;

    // Loop through values starting from the rightmost digit
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i));

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return (sum % 10) === 0;
}

// Helper function to parse OCR text and extract card information
function parseCardInfo(text) {
    const result = {
        cardNumber: null,
        cardHolder: null,
        expDate: null
    };

    // Clean up the text - remove weird characters and normalize spaces
    text = text.replace(/[^\w\s\/]/gi, '');

    // First try to find a credit card number in the entire text (more reliable)
    // Look for sequences of digits that match credit card patterns (12-19 digits)
    const allDigits = text.replace(/\D/g, '');
    const cardNumberCandidates = [];

    // Find all possible card number segments
    for (let i = 0; i <= allDigits.length - 12; i++) {
        for (let length = 16; length >= 12; length--) {
            if (i + length <= allDigits.length) {
                cardNumberCandidates.push(allDigits.substring(i, i + length));
            }
        }
    }

    // Find the most likely card number (one that passes Luhn check if possible)
    for (const candidate of cardNumberCandidates) {
        if (candidate.length >= 12 && candidate.length <= 19) {
            if (luhnCheck(candidate)) {
                result.cardNumber = candidate;
                break;
            }
        }
    }

    // If no valid card found, take the first candidate that's the right length
    if (!result.cardNumber && cardNumberCandidates.length > 0) {
        for (const candidate of cardNumberCandidates) {
            if (candidate.length >= 12 && candidate.length <= 19) {
                result.cardNumber = candidate;
                break;
            }
        }
    }

    // Process the OCR text line by line
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const line of lines) {
        // Look for expiration date patterns: MM/YY or MM/YYYY format
        const expDateMatches = line.match(/\b(0[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})\b/g);
        if (expDateMatches && expDateMatches.length > 0 && !result.expDate) {
            result.expDate = expDateMatches[0].replace(/\s/g, '');
            continue;
        }

        // Check for name patterns (words with 2+ capital letters)
        if (!result.cardHolder) {
            const nameMatches = line.match(/([A-Z][A-Z]+\s+[A-Z][A-Z]+)/g);
            if (nameMatches && nameMatches.length > 0) {
                const name = nameMatches[0].trim();
                if (name.length > 4 && name.split(/\s+/).length >= 2) {
                    result.cardHolder = name;
                }
            }
        }
    }

    // If we still don't have a cardholder name, look for any capitalized words
    if (!result.cardHolder) {
        const capitalizedWords = [];
        for (const line of lines) {
            const words = line.split(/\s+/);
            for (const word of words) {
                if (word.length > 1 && /^[A-Z][A-Za-z]*$/.test(word)) {
                    capitalizedWords.push(word);
                }
            }
        }

        if (capitalizedWords.length >= 2) {
            result.cardHolder = capitalizedWords.slice(0, 2).join(' ');
        }
    }

    return result;
}

// Process the captured card image using Gemini API
function processCardImage() {
    const canvas = capturedImage;
    const imageDataUrl = canvas.toDataURL('image/jpeg');

    // Add animated spinner with rotating elements
    const loadingSpinner = document.querySelector('.loading-spinner i');
    loadingSpinner.className = 'fas fa-spinner fa-spin fa-pulse';

    // Update loading text
    const loadingText = document.querySelector('.loading-spinner p');
    loadingText.textContent = 'Scanning your card with AI...';
    loadingText.style.color = '#ffffff';

    console.log("Processing image with Gemini API...");

    // Call our server API that uses Gemini
            fetch('https://0.0.0.0:5000/api/scan-card', {            method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageData: imageDataUrl })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API request failed');
        }
        return response.json();
    })
    .then(cardInfo => {
        console.log("Gemini API Result:", cardInfo);

        // Populate form fields with the extracted data
        if (cardInfo.cardNumber) {
            cardNumberInput.value = formatCardNumber(cardInfo.cardNumber);
        }

        if (cardInfo.cardHolder) {
            cardHolderInput.value = cardInfo.cardHolder;
        }

        if (cardInfo.expDate) {
            expDateInput.value = cardInfo.expDate;
        }

        // Close scanner after populating data
        closeScanner();

        // Add highlight effect to show populated fields
        highlightInputs();

        // Alert if no information was found
        if (!cardInfo.cardNumber && !cardInfo.cardHolder && !cardInfo.expDate) {
            alert('No card information was detected. Please try again with better lighting and positioning.');
        }
    })
    .catch(err => {
        console.error('Card Scan Error:', err);

        // Show error in the scanner UI with a retry button
        loadingSpinner.className = 'fas fa-exclamation-circle';
        loadingSpinner.style.color = '#ff3b30';
        loadingText.textContent = 'Error scanning card. Please try again.';

        // Add retry button to the loading container
        const loadingContainer = document.querySelector('.loading-spinner');

        // Check if retry button already exists
        let retryButton = document.getElementById('retryScanButton');
        if (!retryButton) {
            retryButton = document.createElement('button');
            retryButton.id = 'retryScanButton';
            retryButton.className = 'retry-scan-button';
            retryButton.innerHTML = '<i class="fas fa-redo"></i> Try Again';
            loadingContainer.appendChild(retryButton);

            // Add event listener to retry button
            retryButton.addEventListener('click', () => {
                capturedImageContainer.classList.remove('active');

                // Remove retry button
                if (retryButton.parentNode) {
                    retryButton.parentNode.removeChild(retryButton);
                }

                // Reset loading spinner
                loadingSpinner.className = 'fas fa-circle-notch fa-spin';
                loadingSpinner.style.color = '';
                loadingText.textContent = 'Scanning your card with AI...';
            });
        }

        // Don't close scanner automatically on error
    });
}

// Enhance image for better OCR recognition
function enhanceImageForOCR(canvas) {
    return new Promise((resolve) => {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Increase contrast and convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Convert to grayscale
            const gray = 0.3 * r + 0.59 * g + 0.11 * b;

            // Apply threshold to increase contrast
            const threshold = 127;
            const newValue = gray > threshold ? 255 : 0;

            data[i] = newValue;     // R
            data[i + 1] = newValue; // G
            data[i + 2] = newValue; // B
        }

        ctx.putImageData(imageData, 0, 0);

        // Create a new canvas for the processed image
        const processedCanvas = document.createElement('canvas');
        processedCanvas.width = canvas.width;
        processedCanvas.height = canvas.height;
        const processedCtx = processedCanvas.getContext('2d');

        // Draw the processed image with higher contrast
        processedCtx.drawImage(canvas, 0, 0);

        resolve(processedCanvas.toDataURL('image/png'));
    });
}

// Highlight input fields that were populated
function highlightInputs() {
    const inputs = [cardNumberInput, cardHolderInput, expDateInput, cvvInput];

    inputs.forEach(input => {
        if (input.value) {
            input.style.transition = 'background-color 0.5s';
            input.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';

            setTimeout(() => {
                input.style.backgroundColor = '';
            }, 1500);
        }
    });
}








/**
 * Hide splash screen and show home screen
 */
function hideSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');

    // Fade out splash screen
    splashScreen.style.opacity = '0';
    splashScreen.style.transition = 'opacity 0.5s ease-out';

    // After animation, hide splash and show home
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.classList.remove('visible');
            splashScreen.classList.add('hidden');
            if (window.Navigation && typeof window.Navigation.goToHome === 'function') {
                window.Navigation.goToHome();
            }
        }
    }, 500);
}

/**
 * Set up event listeners for navigation
 */
function setupEventListeners() {
    // Add card buttons
    document.getElementById('add-card-button').addEventListener('click', () => {
        window.Navigation.goToAddCard();
    });

    document.getElementById('add-first-card-btn').addEventListener('click', () => {
        window.Navigation.goToAddCard();
    });

    // Back buttons
    document.getElementById('back-button-add').addEventListener('click', () => {
        window.Navigation.goToHome();
    });

    document.getElementById('back-button-detail').addEventListener('click', () => {
        window.Navigation.goToHome();
    });

    document.getElementById('back-button-settings').addEventListener('click', () => {
        window.Navigation.goToHome();
    });

    // Settings button in header
    document.getElementById('settings-button').addEventListener('click', () => {
        window.Navigation.goToSettings();
    });

    // Settings in bottom nav
    document.getElementById('nav-settings').addEventListener('click', () => {
        window.Navigation.goToSettings();
    });
}

/**
 * Initialize the app
 */
function initApp() {
    if (appState.isInitialized) {
        return;
    }

    setupEventListeners();
    hideSplashScreen();
    appState.isInitialized = true;
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
