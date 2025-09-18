# Veilo Platform - Frontend

## Project Overview

Veilo is an anonymous support and guidance platform that connects users with verified experts through various communication channels. The platform focuses on providing safe, anonymous spaces for users to seek help and guidance.

## Technology Stack

This project is built with:

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin for fast compilation
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Veilo brand colors and animations
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM v6
- **Real-time**: Socket.io client for WebSocket connections
- **Video/Audio**: Agora RTC SDK for video calls
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: i18next with react-i18next

## Core Features

- **Anonymous Identity System**: Users maintain anonymity with generated aliases and avatars
- **Expert Verification**: Professional verification system for experts/beacons
- **Multiple Communication Channels**: Chat, video, voice sessions
- **Sanctuary System**: Group support sessions with breakout rooms
- **Flagship Sanctuaries**: Enhanced group sessions with advanced features
- **Real-time Communication**: Socket.io-based real-time messaging and notifications
- **Multi-language Support**: i18n implementation with multiple language support

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd veilo-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=https://veilos-backend.onrender.com
   VITE_BACKEND_URL=https://veilos-backend.onrender.com
   VITE_API_URL=https://veilos-backend.onrender.com
   VITE_AGORA_APP_ID=your_agora_app_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8080`

## Development Commands

```bash
npm run dev          # Start Vite dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat and messaging components
│   ├── sanctuary/      # Group session components
│   ├── flagship/       # Enhanced sanctuary features
│   └── ui/             # Base UI components (shadcn/ui)
├── pages/              # Route-level page components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── services/           # API clients and external services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── lib/                # Shared libraries and configurations
└── i18n/               # Internationalization files
```

## Breakout Room System

### Overview
The platform includes a sophisticated breakout room system for flagship sanctuaries, allowing participants to create smaller discussion groups within larger sessions.

### Recent Fixes (Permission System)
We've implemented comprehensive fixes for breakout room permission issues:

#### Frontend Debugging Tools
- **Debug Functions**: Available in browser console
  ```javascript
  // Debug breakout room permissions
  debugBreakoutPermissions('session-id')
  
  // Test permission validation
  testBreakoutPermissions('session-id')
  ```

#### Permission Validation
- Enhanced session permission validation with fallback logic
- Improved token parsing for different JWT payload formats
- Automatic user role detection and assignment

#### Key Files
- `src/utils/sessionPermissions.ts` - Permission validation logic
- `src/utils/authUtils.ts` - Enhanced authentication utilities
- `src/utils/debugBreakoutPermissions.ts` - Debugging tools
- `src/services/flagshipBreakoutService.ts` - Breakout room service

### Troubleshooting Breakout Rooms

If you encounter permission issues:

1. **Check Authentication**
   ```javascript
   // In browser console
   debugBreakoutPermissions('your-session-id')
   ```

2. **Verify Session Data**
   - Ensure user is properly authenticated
   - Check if user is added to session participants
   - Verify host/moderator status

3. **Backend Debug Endpoints**
   ```
   GET /api/debug-breakout/{sessionId}/debug-permissions
   POST /api/debug-breakout/{sessionId}/test-breakout-creation
   ```

## API Integration

The frontend communicates with the backend through:
- REST API endpoints (`/api/*`)
- WebSocket connections for real-time features
- Agora SDK for video/audio calls

### Authentication
- JWT tokens stored in localStorage (`veilo-auth-token`)
- Automatic token refresh and validation
- Multiple token format support

## Configuration

### Path Aliases
- `@/*` resolves to `./src/*` for cleaner imports

### Environment Variables
- `VITE_API_BASE_URL` - Backend API base URL (https://veilos-backend.onrender.com)
- `VITE_BACKEND_URL` - Backend server URL for Socket.io connections
- `VITE_API_URL` - Alternative API URL for compatibility
- `VITE_AGORA_APP_ID` - Agora application ID

## Contributing

1. Follow the established code structure and naming conventions
2. Use TypeScript for all new components and utilities
3. Implement proper error handling and loading states
4. Add appropriate logging for debugging
5. Test breakout room functionality thoroughly

## Support

For issues related to:
- **Breakout Room Permissions**: Use the debug tools mentioned above
- **Authentication**: Check token validity and user session state
- **Real-time Features**: Verify WebSocket connection status
- **Video/Audio**: Ensure Agora SDK is properly configured
