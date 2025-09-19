# Veilo Development Scripts

## Backend Development

1. **Local Backend (Port 3000)**
   ```bash
   # Copy local environment
   cp .env.local .env
   
   # In your veilos_backend directory, make sure package.json has:
   {
     "scripts": {
       "dev": "nodemon server.js --port 3000",
       "start": "node server.js"
     }
   }
   
   # Then run
   npm run dev
   ```

2. **Production Backend (Render)**
   ```bash
   # Copy production environment  
   cp .env.production .env
   
   # Your frontend will now use https://veilos-backend.onrender.com
   npm run dev
   ```

## Quick Switch Commands

```bash
# Switch to local development
cp .env.local .env && echo "✅ Switched to LOCAL backend"

# Switch to production  
cp .env.production .env && echo "✅ Switched to PRODUCTION backend"
```

## Your Backend Structure Should Be:

```
veilos_backend/
├── package.json        # Should have "dev": "nodemon server.js" 
├── server.js          # Your main backend file
├── .env               # Backend environment variables
└── ...other backend files
```