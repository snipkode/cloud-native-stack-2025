# Vite React TypeScript Starter

This is a modern web application built with Vite, React, and TypeScript.

## Environment Variables

This project uses environment variables to configure API endpoints and other settings. To set up environment variables:

1. Create a `.env` file in the root directory
2. Copy the contents from `.env.example` 
3. Update the values with your actual configuration

### Available Environment Variables

- `VITE_BASE_URL` - The base URL for the API (e.g., `https://api-v2.obskt.xyz`)
- `VITE_MIDTRANS_CLIENT_KEY` - The client key for Midtrans payment integration

> **Note:** All environment variables must be prefixed with `VITE_` to be accessible in the client-side code.

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (copy from `.env.example`)

## Development

Create a `.env` file with your API configuration:
```
VITE_BASE_URL=https://api-v2.obskt.xyz
VITE_MIDTRANS_CLIENT_KEY=your_client_key
```

Then start the development server:
```bash
npm run dev
```

> **Note:** When developing, make sure your `.env` file is properly configured with the correct API base URL to avoid connection issues.

## Build

```bash
npm run build
```