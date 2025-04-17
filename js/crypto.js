/**
 * Encryption/Decryption utility functions
 * Uses CryptoJS for secure local storage
 */

// Simple secret key for demo purposes
// In a real app, you'd use a more secure method of managing encryption keys
const SECRET_KEY = 'violet-wallet-key-2025';

/**
 * Encrypts sensitive data
 * @param {string} data - The data to be encrypted
 * @returns {string} - Encrypted string
 */
function encrypt(data) {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

/**
 * Decrypts encrypted data
 * @param {string} encryptedData - The encrypted data to decrypt
 * @returns {string} - Decrypted string
 */
function decrypt(encryptedData) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
}

/**
 * Saves encrypted data to local storage
 * @param {string} key - The storage key
 * @param {any} data - The data to encrypt and store
 */
function saveEncrypted(key, data) {
    const encryptedData = encrypt(JSON.stringify(data));
    localStorage.setItem(key, encryptedData);
}

/**
 * Retrieves and decrypts data from local storage
 * @param {string} key - The storage key
 * @returns {any|null} - Decrypted data or null if not found
 */
function getEncrypted(key) {
    const encryptedData = localStorage.getItem(key);
    
    if (!encryptedData) {
        return null;
    }
    
    try {
        const decryptedData = decrypt(encryptedData);
        return JSON.parse(decryptedData);
    } catch (error) {
        console.error('Error retrieving encrypted data:', error);
        return null;
    }
}

/**
 * Removes encrypted data from local storage
 * @param {string} key - The storage key to remove
 */
function removeEncrypted(key) {
    localStorage.removeItem(key);
}