# Platform Service Modes

This system supports both mock and real environments for flexible development and deployment.

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `development` for development, `production` for production
- `MOCK_MODE`: Set to `true` for mock mode, `false` for real deployment (default: `false`)
- `PLATFORM_PROVIDER`: Set the platform provider (`dokku`, `heroku`, `vercel`, `kubernetes`)
- `PLATFORM_DOMAIN`: The domain for your platform (e.g., `your-platform.com`)

## Modes

### 1. Mock Mode (Development)

Set `MOCK_MODE=true` in development environment for:
- Fast frontend testing without real deployments
- Simulated responses with configurable delays and errors
- No actual platform commands executed

**Example:**
```bash
NODE_ENV=development MOCK_MODE=true npm run dev
```

### 2. Real Mode (Production)

Default mode with real platform integration:
- Executes actual deployment commands
- Works with Dokku, Heroku, Vercel, or Kubernetes
- Full production-like behavior

**Example:**
```bash
NODE_ENV=production MOCK_MODE=false npm start
```

## Platform Providers

The system supports multiple platform providers:

### Dokku (Default)
- Command: `dokku`
- Domain: `your-app.your-dokku-domain.com`

### Heroku
- Set `PLATFORM_PROVIDER=heroku`
- Command: `heroku`
- Domain: `your-app.herokuapp.com`

### Vercel
- Set `PLATFORM_PROVIDER=vercel`
- Command: `vercel`
- Domain: `your-app.vercel.app`

### Kubernetes
- Set `PLATFORM_PROVIDER=kubernetes`
- Command: `kubectl`

## Quick Start for Frontend Testing

For fast frontend development:

1. Set mock mode:
   ```bash
   MOCK_MODE=true npm run dev
   ```

2. The API will respond instantly with simulated data
3. Deployments will appear to work without actual platform commands
4. Perfect for frontend testing and development

## Production Deployment

For real deployments:

1. Set `MOCK_MODE=false`
2. Configure the appropriate `PLATFORM_PROVIDER`
3. Ensure the platform CLI tool is installed and configured
4. The system will execute real deployment commands