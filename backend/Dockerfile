# Use Node.js 22 with Debian (Bookworm) for better SSH compatibility
FROM node:22

# Set working directory
WORKDIR /app

# Update system packages and install any needed dependencies for SSH
RUN apt-get update && apt-get install -y \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create a non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs dokkuapi

# Create .ssh directory for the user and set proper ownership
RUN mkdir -p /home/dokkuapi/.ssh && \
    chown dokkuapi:nodejs /home/dokkuapi/.ssh && \
    chmod 700 /home/dokkuapi/.ssh

# Set up a default SSH config that avoids interactive prompts (can be overridden at runtime)
RUN echo "Host *" > /home/dokkuapi/.ssh/config && \
    echo "    StrictHostKeyChecking no" >> /home/dokkuapi/.ssh/config && \
    echo "    UserKnownHostsFile /dev/null" >> /home/dokkuapi/.ssh/config && \
    chown dokkuapi:nodejs /home/dokkuapi/.ssh/config && \
    chmod 600 /home/dokkuapi/.ssh/config

# Change ownership of the app directory
RUN chown -R dokkuapi:nodejs /app
USER dokkuapi

# Expose port (use the same as in your application)
EXPOSE 3000

# Start the application with migrations and seeders
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]