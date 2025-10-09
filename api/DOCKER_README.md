# Docker Setup for SAAS-PAAS-Platform

This Dockerfile creates a container for the SAAS-PAAS-Platform API using Node.js 22 (Debian Bookworm) for SSH compatibility.

## Features
- Uses Node.js 22 with Debian (Bookworm) for better SSH compatibility
- Installs openssh-client for SSH operations
- Sets up default SSH configuration that avoids interactive prompts
- Runs database migrations and seeders automatically before starting the application
- Runs as a non-root user for security
- Exposes port 3000

## How to Build and Run

### Build the Docker Image
```bash
docker build -t saas-paas-platform .
```

### Run the Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=your_database_url \
  -e SUPABASE_DB_URL=your_supabase_url \
  saas-paas-platform
```

### With Environment Variables from a File
```bash
docker run -p 3000:3000 \
  --env-file .env \
  saas-paas-platform
```

## Environment Variables
Make sure to provide the necessary environment variables for your database connection:
- `DATABASE_URL` - PostgreSQL database URL
- `SUPABASE_DB_URL` - Supabase database URL (if using Supabase)
- Other environment variables from your `.env` file

## Process Flow
1. Install dependencies
2. Copy source code
3. Run database migrations (`npm run migrate`)
4. Run database seeders (`npm run seed`)
5. Start the application (`npm start`)

## Dockerfile Commands

### Build
The build process will:
- Install all dependencies
- Copy source files
- Set up a non-root user for security

### Runtime
At runtime, the container will:
1. Execute database migrations
2. Execute database seeders
3. Start the application server

## Mounting SSH Keys

To mount your SSH keys from `~/.ssh/id_rsa` into the container for SSH operations:

```bash
docker run -p 3000:3000 \
  -v ~/.ssh/id_rsa:/home/dokkuapi/.ssh/id_rsa:ro \
  -v ~/.ssh/id_rsa.pub:/home/dokkuapi/.ssh/id_rsa.pub:ro \
  --env-file .env \
  saas-paas-platform
```

For extra security, you can create a dedicated SSH config directory:

```bash
# Create a temporary SSH directory (or use a permanent one)
mkdir -p ./ssh-config
cp ~/.ssh/id_rsa ./ssh-config/
chmod 600 ./ssh-config/id_rsa

# Run container with SSH keys mounted
docker run -p 3000:3000 \
  -v $(pwd)/ssh-config:/home/dokkuapi/.ssh:ro \
  --env-file .env \
  saas-paas-platform
```

Note: When mounting SSH keys, make sure the container user has the proper access to the SSH directory and that the permissions are correctly set. The `.ssh` directory in the container will need appropriate permissions to allow SSH operations.

You might also want to create an SSH config file to handle known hosts and other SSH settings:

```bash
# Create SSH config directory with proper setup
mkdir -p ./ssh-config
cp ~/.ssh/id_rsa ./ssh-config/
chmod 600 ./ssh-config/id_rsa
touch ./ssh-config/config
chmod 600 ./ssh-config/config

# Add configuration for known hosts (to avoid interactive prompts)
echo "Host *" > ./ssh-config/config
echo "    StrictHostKeyChecking no" >> ./ssh-config/config
echo "    UserKnownHostsFile /dev/null" >> ./ssh-config/config

# Run container with SSH keys and config mounted
docker run -p 3000:3000 \
  -v $(pwd)/ssh-config:/home/dokkuapi/.ssh:ro \
  --env-file .env \
  saas-paas-platform
```

This creates an SSH config that avoids interactive prompts when connecting to SSH servers, which is important for automated operations within the container.

## Security Considerations for SSH Keys

For production deployments, consider these security practices:

### 1. Build-time SSH Key Injection (NOT Recommended for Private Keys)
If you absolutely must include SSH keys in the image, use Docker build secrets or multi-stage builds:

```dockerfile
# Example for a build secret (do not use for production private keys)
COPY --chown=dokkuapi:dokkuapi ssh-private-key /tmp/temp-key
RUN mkdir -p /home/dokkuapi/.ssh && \
    mv /tmp/temp-key /home/dokkuapi/.ssh/id_rsa && \
    chmod 600 /home/dokkuapi/.ssh/id_rsa && \
    rm -f /tmp/temp-key
```

⚠️ **Warning**: This approach embeds your private key in the Docker image, which is a security risk. Never use this approach with real private keys in production.

### 2. Runtime Mounting (Recommended)
The recommended approach is to mount SSH keys at runtime as shown in the examples above. This keeps secrets out of the Docker image.

### 3. SSH Agent Forwarding
For more advanced setups, you can use SSH agent forwarding:

```bash
docker run -p 3000:3000 \
  --env SSH_AUTH_SOCK="$SSH_AUTH_SOCK" \
  -v "$SSH_AUTH_SOCK:$SSH_AUTH_SOCK" \
  --env-file .env \
  saas-paas-platform
```

This forwards your local SSH agent to the container, eliminating the need to copy private keys.

### 4. Using Docker Secrets (for Docker Swarm)
If using Docker Swarm, store SSH keys as secrets:

```bash
echo "$(cat ~/.ssh/id_rsa)" | docker secret create ssh_private_key -
```

Then mount it in your service definition.