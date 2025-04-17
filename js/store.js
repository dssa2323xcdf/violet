/**
 * Data store for the Violet Wallet app
 * Handles CRUD operations for cards and transactions
 */

// Storage keys for encrypted local storage
const STORAGE_KEYS = {
    CARDS: 'violetWallet_cards',
    TRANSACTIONS: 'violetWallet_transactions',
    SETTINGS: 'violetWallet_settings'
};

// Demo user ID (in a real app, this would come from authentication)
const DEMO_USER_ID = 1;

/**
 * Card store for managing card data
 */
const CardStore = {
    /**
     * Get all cards from storage
     * @returns {Array} - Array of card objects
     */
    getCards() {
        return getEncrypted(STORAGE_KEYS.CARDS) || [];
    },
    
    /**
     * Get a single card by ID
     * @param {number} id - Card ID
     * @returns {Object|undefined} - Card object if found, undefined otherwise
     */
    getCard(id) {
        const cards = this.getCards();
        return cards.find(card => card.id === id);
    },
    
    /**
     * Add a new card
     * @param {Object} cardData - Card data to add
     * @returns {Object} - The newly created card
     */
    addCard(cardData) {
        const cards = this.getCards();
        
        const newCard = {
            id: generateId(),
            userId: DEMO_USER_ID,
            cardNumber: cardData.cardNumber,
            cardholderName: cardData.cardholderName,
            expiryDate: cardData.expiryDate,
            cvv: cardData.cvv,
            nickname: cardData.nickname || '',
            cardType: detectCardType(cardData.cardNumber),
            balance: cardData.balance || "1000.00", // Demo balance
            createdAt: new Date(),
            lastFourDigits: cardData.cardNumber.slice(-4),
        };
        
        cards.push(newCard);
        saveEncrypted(STORAGE_KEYS.CARDS, cards);
        
        // Add a sample transaction for demo purposes
        const currentDate = new Date();
        TransactionStore.addTransaction(newCard.id, {
            merchantName: "Card Activation",
            amount: "0.00",
            date: currentDate,
            icon: "account_balance",
            description: "Card activated successfully"
        });
        
        return newCard;
    },
    
    /**
     * Update card nickname
     * @param {number} id - Card ID to update
     * @param {string} nickname - New nickname
     * @returns {Object} - Updated card
     */
    updateCardNickname(id, nickname) {
        const cards = this.getCards();
        
        const updatedCards = cards.map(card => 
            card.id === id ? { ...card, nickname } : card
        );
        
        saveEncrypted(STORAGE_KEYS.CARDS, updatedCards);
        return this.getCard(id);
    },
    
    /**
     * Delete a card
     * @param {number} id - Card ID to delete
     * @returns {boolean} - Whether deletion was successful
     */
    deleteCard(id) {
        const cards = this.getCards();
        const updatedCards = cards.filter(card => card.id !== id);
        
        saveEncrypted(STORAGE_KEYS.CARDS, updatedCards);
        
        // Also delete associated transactions
        const transactions = TransactionStore.getAllTransactions();
        delete transactions[id];
        saveEncrypted(STORAGE_KEYS.TRANSACTIONS, transactions);
        
        return true;
    },
    
    /**
     * Update card balance
     * @param {number} id - Card ID
     * @param {number} amount - Amount to add to balance (negative for deduction)
     * @returns {Object} - Updated card
     */
    updateCardBalance(id, amount) {
        const cards = this.getCards();
        
        const updatedCards = cards.map(card => {
            if (card.id === id) {
                const currentBalance = parseFloat(card.balance);
                const newBalance = (currentBalance + amount).toFixed(2);
                return { ...card, balance: newBalance };
            }
            return card;
        });
        
        saveEncrypted(STORAGE_KEYS.CARDS, updatedCards);
        return this.getCard(id);
    }
};

/**
 * Transaction store for managing transaction data
 */
const TransactionStore = {
    /**
     * Get all transactions grouped by card ID
     * @returns {Object} - Object with card IDs as keys and arrays of transactions as values
     */
    getAllTransactions() {
        return getEncrypted(STORAGE_KEYS.TRANSACTIONS) || {};
    },
    
    /**
     * Get transactions for a specific card
     * @param {number} cardId - Card ID
     * @returns {Array} - Array of transaction objects
     */
    getTransactions(cardId) {
        const allTransactions = this.getAllTransactions();
        return allTransactions[cardId] || [];
    },
    
    /**
     * Add a new transaction
     * @param {number} cardId - Card ID
     * @param {Object} transaction - Transaction data
     * @returns {Object} - The newly created transaction
     */
    addTransaction(cardId, transaction) {
        const allTransactions = this.getAllTransactions();
        
        const newTransaction = {
            id: generateId(),
            cardId,
            date: transaction.date || new Date(),
            merchantName: transaction.merchantName,
            amount: transaction.amount,
            icon: transaction.icon || "shopping_bag",
            description: transaction.description || "",
        };
        
        // Initialize the card's transaction array if it doesn't exist
        if (!allTransactions[cardId]) {
            allTransactions[cardId] = [];
        }
        
        allTransactions[cardId].unshift(newTransaction); // Add to the beginning for most recent first
        saveEncrypted(STORAGE_KEYS.TRANSACTIONS, allTransactions);
        
        // Update card balance
        CardStore.updateCardBalance(cardId, parseFloat(transaction.amount));
        
        return newTransaction;
    }
};

/**
 * Settings store for managing app settings
 */
const SettingsStore = {
    /**
     * Get all app settings
     * @returns {Object} - Settings object
     */
    getSettings() {
        return getEncrypted(STORAGE_KEYS.SETTINGS) || {
            theme: 'dark',
            useFaceId: false,
            notifications: true
        };
    },
    
    /**
     * Update a specific setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Object} - Updated settings
     */
    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        saveEncrypted(STORAGE_KEYS.SETTINGS, settings);
        return settings;
    }
};