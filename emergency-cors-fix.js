/**
 * Emergency CORS Fix - Add this to your backend server.js if deployment doesn't work
 */

// Add this BEFORE your existing CORS configuration in server.js
app.use((req, res, next) => {
  // Emergency CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token, auth-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

console.log('🚨 Emergency CORS fix applied - allows all origins');