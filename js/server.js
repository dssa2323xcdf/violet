const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { promisify } = require('util');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Get API key from environment
//const API_KEY = process.env.GEMINI_API_KEY;
const API_KEY = ""; // Replace with your actual API key

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

// File paths for static files
const STATIC_FILES = {
  '/': path.join(__dirname, 'index.html'),
  '/index.html': path.join(__dirname, 'index.html'),
  '/styles.css': path.join(__dirname, 'styles.css'),
  '/script.js': path.join(__dirname, 'script.js')
};

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

// Create the server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle API requests
  if (pathname.startsWith('/api/scan-card') && req.method === 'POST') {
    handleCardScan(req, res);
    return;
  }

  // Handle static file requests
  const filePath = STATIC_FILES[pathname] || path.join(__dirname, pathname);
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('File not found');
    }
  } catch (error) {
    res.writeHead(500);
    res.end('Internal server error');
    console.error(error);
  }
});

// Helper function to read request body
async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const bodyParts = [];
    req.on('data', (chunk) => {
      bodyParts.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(bodyParts).toString();
      resolve(body);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// Function to handle card scanning using Gemini
async function handleCardScan(req, res) {
  try {
    // Read the image data from the request
    const body = await readRequestBody(req);
    const { imageData } = JSON.parse(body);
    
    // The image data is a base64 string, we need to strip the prefix
    const base64Image = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    // Configure the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });    
    // Prepare the prompt with detailed instructions for Gemini 1.5 Flash
    const prompt = `Analyze this credit card image carefully and extract ONLY the following information in JSON format:
1. Card number (16 digits, no spaces)
2. Cardholder name (in ALL CAPS exactly as shown on card)
3. Expiration date in MM/YY format (e.g., 05/27)

Return ONLY a valid JSON object like this: {"cardNumber": "1234567890123456", "cardHolder": "JOHN DOE", "expDate": "01/25"}

Important:
- If you cannot read the card number clearly, return empty string for cardNumber
- If you cannot read the name clearly, return empty string for cardHolder
- If you cannot read the expiration date clearly, return empty string for expDate
- Do not include any explanations or markdown, ONLY return the JSON object`;
    
    // Convert base64 to the format expected by the Gemini API
    const imageFile = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };
    
    // Call the Gemini API with improved error handling
    console.log('Calling Gemini API with model: gemini-1.5-flash');
    let text = '';
    
    try {
      const result = await model.generateContent([prompt, imageFile]);
      console.log('Gemini API call successful');
      const response = await result.response;
      text = response.text();
      console.log('Gemini API response text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      throw new Error(`Gemini API error: ${apiError.message}`);
    }
    
    // Extract JSON from response (Gemini might wrap it in markdown code blocks)
    let jsonData = null;
    try {
      // Try to parse the response as JSON
      jsonData = JSON.parse(text);
      console.log('Successfully parsed JSON directly');
    } catch (e) {
      console.log('Could not parse direct JSON, trying to extract from markdown...');
      
      // If it's not direct JSON, try to extract it from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          jsonData = JSON.parse(jsonMatch[1]);
          console.log('Successfully parsed JSON from markdown code block');
        } catch (innerError) {
          console.error("Could not parse JSON from markdown:", innerError);
        }
      }
      
      // If still not parsed, look for JSON-like patterns
      if (!jsonData) {
        console.log('Trying to extract JSON using pattern matching...');
        const jsonPattern = /{[\s\S]*?"cardNumber"[\s\S]*?"cardHolder"[\s\S]*?"expDate"[\s\S]*?}/;
        const match = text.match(jsonPattern);
        if (match) {
          try {
            jsonData = JSON.parse(match[0]);
            console.log('Successfully parsed JSON using pattern matching');
          } catch (innerError) {
            console.error("Could not parse JSON from pattern:", innerError);
          }
        }
      }
    }
    
    if (jsonData) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(jsonData));
    } else {
      // If we couldn't parse proper JSON, return a formatted error
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Could not parse card data',
        rawResponse: text
      }));
    }
    
  } catch (error) {
    console.error('Error processing card:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to process card image' }));
  }
}

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
