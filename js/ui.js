/**
 * UI functions for the Violet Wallet app
 * Handles UI updates, rendering, and DOM interactions
 */

/**
 * Navigation functions to switch between screens
 */
window.Navigation = {
    /**
     * Show a specific screen and hide all others
     * @param {string} screenId - ID of the screen to show
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
        }
    },
    
    /**
     * Navigate to the home screen
     */
    goToHome() {
        this.showScreen('home-screen');
        this.refreshHomeScreen();
    },
    
    /**
     * Navigate to the add card screen
     */
    goToAddCard() {
        this.showScreen('add-card-screen');
        CardForm.resetForm();
    },
    
    /**
     * Navigate to the card detail screen for a specific card
     * @param {number} cardId - ID of the card to show details for
     */
    goToCardDetail(cardId) {
        this.showScreen('card-detail-screen');
        CardDetailUI.loadCardDetail(cardId);
    },
    
    /**
     * Navigate to the settings screen
     */
    goToSettings() {
        this.showScreen('settings-screen');
        SettingsUI.loadSettings();
    },
    
    /**
     * Refresh the home screen with the latest cards
     */
    refreshHomeScreen() {
        HomeUI.renderCards();
    }
};

/**
 * UI functions for the home screen
 */
const HomeUI = {
    /**
     * Render all cards in the card stack
     */
    renderCards() {
        const cards = CardStore.getCards();
        const cardStackContainer = document.getElementById('card-stack-container');
        const emptyState = document.getElementById('empty-state');
        
        // Clear existing cards
        cardStackContainer.innerHTML = '';
        
        if (cards.length === 0) {
            // Show empty state if no cards
            cardStackContainer.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state and show card stack
        cardStackContainer.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Show max 3 cards in the stack
        const displayCards = cards.slice(0, 3);
        
        // Add cards to the stack
        displayCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-stack-item';
            cardElement.setAttribute('data-card-id', card.id);
            
            // Set color variations based on position in stack
            let fromColor, toColor;
            
            if (index === 0) {
                fromColor = 'rgb(168, 85, 247)';
                toColor = 'rgb(124, 58, 237)';
            } else if (index === 1) {
                fromColor = '#3b82f6';
                toColor = '#1d4ed8';
            } else {
                fromColor = '#ef4444';
                toColor = '#b91c1c';
            }
            
            // Create the card HTML
            cardElement.innerHTML = `
                <div class="credit-card" style="background: linear-gradient(to bottom right, ${fromColor}, ${toColor});">
                    <div class="card-type-indicator">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 3v18h18"></path>
                            <path d="M18.4 3a9.9 9.9 0 0 1 2.5 1.7A10 10 0 0 1 17 21"></path>
                            <path d="M3 8a10 10 0 0 1 14-5"></path>
                            <path d="m3 12 5-1 1-5"></path>
                            <path d="m3 17 5-1 1-5"></path>
                        </svg>
                    </div>
                    <div class="card-body">
                        <div class="card-info-top">
                            <p class="card-type">${card.cardType}</p>
                            <p class="card-holder">${card.cardholderName}</p>
                        </div>
                        <div class="card-info-bottom">
                            <p class="card-number">•••• •••• •••• ${card.lastFourDigits}</p>
                            <div class="card-details">
                                <div class="expiry">
                                    <p class="expiry-label">VALID THRU</p>
                                    <p class="expiry-date">${card.expiryDate}</p>
                                </div>
                                <div class="card-logo">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                        <line x1="2" x2="22" y1="10" y2="10"></line>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add card click event
            cardElement.addEventListener('click', () => {
                this.handleCardClick(card.id);
            });
            
            cardStackContainer.appendChild(cardElement);
        });
    },
    
    /**
     * Handle card click in the stack
     * @param {number} cardId - ID of the clicked card
     */
    handleCardClick(cardId) {
        // Add a class to animate the clicked card
        const cardElements = document.querySelectorAll('.card-stack-item');
        cardElements.forEach(el => {
            if (parseInt(el.getAttribute('data-card-id')) === cardId) {
                el.classList.add('card-active');
            }
        });
        
        // Add a delay to allow the animation to finish before navigation
        setTimeout(() => {
            Navigation.goToCardDetail(cardId);
        }, 300);
    }
};

/**
 * UI functions for the card form
 */
const CardForm = {
    // Form state
    formState: {
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        nickname: ''
    },
    
    // Form errors
    errors: {},
    
    /**
     * Initialize the card form event listeners
     */
    init() {
        // Card number input
        const cardNumberInput = document.getElementById('card-number');
        cardNumberInput.addEventListener('input', (e) => {
            this.handleInputChange('cardNumber', e.target.value);
        });
        
        // Cardholder name input
        const cardholderNameInput = document.getElementById('cardholder-name');
        cardholderNameInput.addEventListener('input', (e) => {
            this.handleInputChange('cardholderName', e.target.value);
        });
        
        // Expiry date input
        const expiryDateInput = document.getElementById('expiry-date');
        expiryDateInput.addEventListener('input', (e) => {
            this.handleInputChange('expiryDate', e.target.value);
        });
        
        // CVV input
        const cvvInput = document.getElementById('cvv');
        cvvInput.addEventListener('input', (e) => {
            this.handleInputChange('cvv', e.target.value);
        });
        
        // Nickname input
        const nicknameInput = document.getElementById('card-nickname');
        nicknameInput.addEventListener('input', (e) => {
            this.handleInputChange('nickname', e.target.value);
        });
        
        // Save button
        const saveButton = document.getElementById('save-card-button');
        saveButton.addEventListener('click', () => {
            this.handleSave();
        });
        
        // NFC button
        const nfcButton = document.getElementById('nfc-button');
        nfcButton.addEventListener('click', () => {
            this.startNFCScanning();
        });
        
        // Cancel NFC button
        const cancelNfcButton = document.getElementById('cancel-nfc');
        cancelNfcButton.addEventListener('click', () => {
            this.stopNFCScanning();
        });
    },
    
    /**
     * Handle input changes in the form
     * @param {string} name - Input field name
     * @param {string} value - Input field value
     */
    handleInputChange(name, value) {
        let formattedValue = value;
        
        // Format specific inputs
        if (name === 'cardNumber') {
            formattedValue = formatCardNumber(value);
            
            // Update the input value with the formatted version
            document.getElementById('card-number').value = formattedValue;
            
            // Update card type in preview
            const cardType = detectCardType(formattedValue.replace(/\\s/g, ''));
            document.getElementById('preview-card-type').textContent = cardType;
            
            // Update card number in preview
            if (formattedValue) {
                document.getElementById('preview-cardnumber').textContent = 
                    '•••• •••• •••• ' + formattedValue.slice(-4);
            } else {
                document.getElementById('preview-cardnumber').textContent = '•••• •••• •••• ••••';
            }
        } else if (name === 'expiryDate') {
            formattedValue = formatExpiryDate(value);
            
            // Update the input value with the formatted version
            document.getElementById('expiry-date').value = formattedValue;
            
            // Update expiry date in preview
            document.getElementById('preview-expiry').textContent = 
                formattedValue || 'MM/YY';
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\\D/g, '').slice(0, 4);
            
            // Update the input value with the formatted version
            document.getElementById('cvv').value = formattedValue;
        } else if (name === 'cardholderName') {
            formattedValue = value.toUpperCase();
            
            // Update the input value with the formatted version
            document.getElementById('cardholder-name').value = formattedValue;
            
            // Update cardholder name in preview
            document.getElementById('preview-cardholder').textContent = 
                formattedValue || 'CARDHOLDER NAME';
        }
        
        // Update form state
        this.formState[name] = formattedValue;
        
        // Validate form
        this.validateForm();
        
        // Update save button
        this.updateSaveButton();
    },
    
    /**
     * Validate the form fields
     */
    validateForm() {
        const newErrors = {};
        
        // Card number validation
        if (this.formState.cardNumber && this.formState.cardNumber.replace(/\\s/g, '').length < 13) {
            newErrors.cardNumber = 'Card number is too short';
        } else if (this.formState.cardNumber && this.formState.cardNumber.replace(/\\s/g, '').length > 19) {
            newErrors.cardNumber = 'Card number is too long';
        }
        
        // Cardholder name validation
        if (this.formState.cardholderName && this.formState.cardholderName.length < 3) {
            newErrors.cardholderName = 'Cardholder name is too short';
        }
        
        // Expiry date validation
        if (this.formState.expiryDate && !(/^\d{2}\//.test)(this.formState.expiryDate)) {
            newErrors.expiryDate = 'Invalid format (MM/YY)';
        } else if (this.formState.expiryDate && !isExpiryDateValid(this.formState.expiryDate)) {
            newErrors.expiryDate = 'Card is expired';
        }
        
        // CVV validation
        const cleanCvv = this.formState.cvv.trim().replace(/\D/g, '');
        if (!/^\d{3,4}$/.test(cleanCvv)) {
            newErrors.cvv = 'CVV must be 3 or 4 digits';
        }

        
        // Update error displays
        this.updateErrorDisplay('card-number-error', newErrors.cardNumber);
        this.updateErrorDisplay('cardholder-name-error', newErrors.cardholderName);
        this.updateErrorDisplay('expiry-date-error', newErrors.expiryDate);
        this.updateErrorDisplay('cvv-error', newErrors.cvv);
        
        // Update errors state
        this.errors = newErrors;
    },
    
    /**
     * Update error display for a specific field
     * @param {string} elementId - Error element ID
     * @param {string} error - Error message or null
     */
    updateErrorDisplay(elementId, error) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = error || '';
    },
    
    /**
     * Check if the form is valid
     * @returns {boolean} - Whether the form is valid
     */
    isFormValid() {
        // Check if all required fields are filled
        const requiredFieldsFilled = 
            this.formState.cardNumber.replace(/\\s/g, '').length >= 13 &&
            this.formState.cardholderName.length > 2 &&
            this.formState.expiryDate.length === 5 &&
            this.formState.cvv.length >= 3;
        
        // Check if there are no errors
        const noErrors = Object.keys(this.errors).length === 0;
        
        return requiredFieldsFilled && noErrors;
    },
    
    /**
     * Update the save button state based on form validity
     */
    updateSaveButton() {
        const saveButton = document.getElementById('save-card-button');
        saveButton.disabled = !this.isFormValid();
    },
    
    /**
     * Handle save button click
     */
    handleSave() {
        if (!this.isFormValid()) {
            return;
        }
        
        try {
            // Get card data from form
            const cardData = {
                cardNumber: this.formState.cardNumber.replace(/\\s/g, ''),
                cardholderName: this.formState.cardholderName,
                expiryDate: this.formState.expiryDate,
                cvv: this.formState.cvv,
                nickname: this.formState.nickname,
                cardType: detectCardType(this.formState.cardNumber.replace(/\\s/g, '')),
            };
            
            // Add card to store
            CardStore.addCard(cardData);
            
            // Show success toast
            showToast('Card Added', 'Your card has been added successfully.', 'success');
            
            // Navigate to home screen
            Navigation.goToHome();
        } catch (error) {
            showToast('Error', 'Failed to add card. Please try again.', 'error');
        }
    },
    
    /**
     * Reset the form to its initial state
     */
    resetForm() {
        // Reset form state
        this.formState = {
            cardNumber: '',
            cardholderName: '',
            expiryDate: '',
            cvv: '',
            nickname: ''
        };
        
        // Reset form fields with null checks
        const elements = {
            'card-number': document.getElementById('card-number'),
            'cardholder-name': document.getElementById('cardholder-name'),
            'expiry-date': document.getElementById('expiry-date'),
            'cvv': document.getElementById('cvv'),
            'card-nickname': document.getElementById('card-nickname')
        };
        
        Object.entries(elements).forEach(([id, element]) => {
            if (element) {
                element.value = '';
            }
        });
        
        // Reset card preview
        document.getElementById('preview-cardnumber').textContent = '•••• •••• •••• ••••';
        document.getElementById('preview-cardholder').textContent = 'CARDHOLDER NAME';
        document.getElementById('preview-expiry').textContent = 'MM/YY';
        document.getElementById('preview-card-type').textContent = 'CARD';
        
        // Reset errors
        this.errors = {};
        this.updateErrorDisplay('card-number-error', null);
        this.updateErrorDisplay('cardholder-name-error', null);
        this.updateErrorDisplay('expiry-date-error', null);
        this.updateErrorDisplay('cvv-error', null);
        
        // Update save button
        this.updateSaveButton();
    },
    
    /**
     * Start NFC card scanning
     */
    startNFCScanning() {
        // Show NFC modal
        const nfcModal = document.getElementById('nfc-modal');
        nfcModal.classList.remove('hidden');
        
        // Use mock NFC scanning for demo
        mockNFCReading(
            // Success callback
            (cardData) => {
                // Fill the form with the scanned card data
                this.handleInputChange('cardNumber', cardData.cardNumber);
                this.handleInputChange('cardholderName', cardData.cardholderName);
                this.handleInputChange('expiryDate', cardData.expiryDate);
                
                // Hide NFC modal
                this.stopNFCScanning();
                
                // Show success toast
                showToast('Card Scanned', 'Card information has been successfully scanned.', 'success');
            },
            // Error callback
            (error) => {
                // Hide NFC modal
                this.stopNFCScanning();
                
                // Show error toast
                showToast('Scan Failed', error.message, 'error');
            }
        );
    },
    
    /**
     * Stop NFC card scanning
     */
    stopNFCScanning() {
        const nfcModal = document.getElementById('nfc-modal');
        nfcModal.classList.add('hidden');
    }
};

/**
 * UI functions for the card detail screen
 */
const CardDetailUI = {
    // Current card ID
    currentCardId: null,
    
    /**
     * Load card details
     * @param {number} cardId - ID of the card to show
     */
    loadCardDetail(cardId) {
        this.currentCardId = cardId;
        
        // Get card data
        const card = CardStore.getCard(cardId);
        if (!card) {
            showToast('Error', 'Card not found', 'error');
            Navigation.goToHome();
            return;
        }
        
        // Render card
        this.renderCard(card);
        
        // Render transactions
        this.renderTransactions(cardId);
    },
    
    /**
     * Render card details
     * @param {Object} card - Card object
     */
    renderCard(card) {
        const cardContainer = document.querySelector('.detail-card-container');
        
        // Create the card HTML
        cardContainer.innerHTML = `
            <div class="credit-card" style="background: linear-gradient(to bottom right, rgb(168, 85, 247), rgb(124, 58, 237));">
                <div class="card-type-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 3v18h18"></path>
                        <path d="M18.4 3a9.9 9.9 0 0 1 2.5 1.7A10 10 0 0 1 17 21"></path>
                        <path d="M3 8a10 10 0 0 1 14-5"></path>
                        <path d="m3 12 5-1 1-5"></path>
                        <path d="m3 17 5-1 1-5"></path>
                    </svg>
                </div>
                <div class="card-body">
                    <div class="card-info-top">
                        <p class="card-type">${card.cardType}</p>
                        <p class="card-holder">${card.cardholderName}</p>
                    </div>
                    <div class="card-info-bottom">
                        <p class="card-number">•••• •••• •••• ${card.lastFourDigits}</p>
                        <div class="card-details">
                            <div class="expiry">
                                <p class="expiry-label">VALID THRU</p>
                                <p class="expiry-date">${card.expiryDate}</p>
                            </div>
                            <div class="card-logo">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                                    <line x1="2" x2="22" y1="10" y2="10"></line>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Update balance
        document.getElementById('card-balance').textContent = formatCurrency(card.balance);
    },
    
    /**
     * Render transaction list
     * @param {number} cardId - ID of the card
     */
    renderTransactions(cardId) {
        const transactions = TransactionStore.getTransactions(cardId);
        const transactionsList = document.getElementById('transactions-list');
        
        // Clear existing transactions
        transactionsList.innerHTML = '';
        
        if (transactions.length === 0) {
            // Show empty state if no transactions
            transactionsList.innerHTML = `
                <div class="empty-transactions">
                    <p>No transactions yet.</p>
                </div>
            `;
            return;
        }
        
        // Add transactions to the list
        transactions.forEach(transaction => {
            const isPositive = parseFloat(transaction.amount) > 0;
            
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item';
            
            transactionElement.innerHTML = `
                <div class="transaction-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" 
                        class="${isPositive ? 'text-green-400' : 'text-primary'}"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        ${this.getTransactionIcon(transaction.icon)}
                    </svg>
                </div>
                <div class="transaction-details">
                    <p class="transaction-name">${transaction.merchantName}</p>
                    <p class="transaction-date">${formatDate(transaction.date)}</p>
                </div>
                <p class="transaction-amount ${isPositive ? 'amount-positive' : 'amount-negative'}">
                    ${isPositive ? '+' : ''}${formatCurrency(transaction.amount)}
                </p>
            `;
            
            transactionsList.appendChild(transactionElement);
        });
    },
    
    /**
     * Get SVG path for transaction icon
     * @param {string} icon - Icon name
     * @returns {string} - SVG path elements
     */
    getTransactionIcon(icon) {
        switch (icon) {
            case 'shopping_bag':
                return `
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                `;
            case 'local_cafe':
                return `
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    <line x1="6" x2="6" y1="2" y2="4" />
                    <line x1="10" x2="10" y1="2" y2="4" />
                    <line x1="14" x2="14" y1="2" y2="4" />
                `;
            case 'account_balance':
                return `
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                `;
            default:
                return `
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="16" />
                    <line x1="8" x2="16" y1="12" y2="12" />
                `;
        }
    },
    
    /**
     * Initialize the card detail screen event listeners
     */
    init() {
        // Delete card button
        const deleteButton = document.getElementById('delete-card-button');
        deleteButton.addEventListener('click', () => {
            this.showDeleteConfirmation();
        });
        
        // Cancel delete button
        const cancelDeleteButton = document.getElementById('cancel-delete');
        cancelDeleteButton.addEventListener('click', () => {
            this.hideDeleteConfirmation();
        });
        
        // Confirm delete button
        const confirmDeleteButton = document.getElementById('confirm-delete');
        confirmDeleteButton.addEventListener('click', () => {
            this.deleteCard();
        });
    },
    
    /**
     * Show delete confirmation modal
     */
    showDeleteConfirmation() {
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.classList.remove('hidden');
    },
    
    /**
     * Hide delete confirmation modal
     */
    hideDeleteConfirmation() {
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.classList.add('hidden');
    },
    
    /**
     * Delete the current card
     */
    deleteCard() {
        try {
            CardStore.deleteCard(this.currentCardId);
            this.hideDeleteConfirmation();
            showToast('Card Deleted', 'Your card has been deleted successfully.', 'success');
            Navigation.goToHome();
        } catch (error) {
            showToast('Error', 'Failed to delete card. Please try again.', 'error');
        }
    }
};

/**
 * UI functions for the settings screen
 */
const SettingsUI = {
    /**
     * Load settings from store
     */
    loadSettings() {
        const settings = SettingsStore.getSettings();
        
        // Update Face ID toggle
        const faceIdToggle = document.getElementById('face-id-toggle');
        faceIdToggle.checked = settings.useFaceId;
    },
    
    /**
     * Initialize settings screen event listeners
     */
    init() {
        // Face ID toggle
        const faceIdToggle = document.getElementById('face-id-toggle');
        faceIdToggle.addEventListener('change', (e) => {
            this.handleFaceIdToggle(e.target.checked);
        });
        
        // Logout button
        const logoutButton = document.getElementById('logout-button');
        logoutButton.addEventListener('click', () => {
            this.handleLogout();
        });
    },
    
    /**
     * Handle Face ID toggle change
     * @param {boolean} checked - Toggle state
     */
    handleFaceIdToggle(checked) {
        // Update setting in store
        SettingsStore.updateSetting('useFaceId', checked);
        
        if (checked) {
            // Check if device supports Face ID
            if ('FaceID' in window || navigator.userAgent.includes('iPhone')) {
                showToast('Face ID Enabled', 'You can now use Face ID to unlock the app', 'success');
            } else {
                showToast('Not Supported', 'Your device doesn\'t support Face ID', 'error');
                
                // Reset toggle if not supported
                document.getElementById('face-id-toggle').checked = false;
                SettingsStore.updateSetting('useFaceId', false);
            }
        }
    },
    
    /**
     * Handle logout button click
     */
    handleLogout() {
        showToast('Logged Out', 'You have been logged out successfully.', 'success');
        Navigation.goToHome();
    }
};