# Cloud Native Platform Monorepo

Welcome to the Cloud Native Platform Monorepo! This project provides a complete cloud-native application platform with containerized services, automated deployment, and developer-friendly tooling.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [SSH Setup](#ssh-setup)
- [Troubleshooting](#troubleshooting)
- [Testing](#testing)

## Overview

This monorepo contains a complete platform with:
- Containerized services using Docker
- Automated deployment with Dokku
- Cloudflare Tunnel integration for secure access
- Network configuration for containerized deployments

## Prerequisites

Before getting started, ensure you have:
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- [Node.js](https://nodejs.org/) (for helper scripts)
- SSH client for key management

## Getting Started

### Quick Start

To start the platform containers:

```bash
npm run start:container
```

This command will:
- Start all required containers
- Initialize necessary services
- Prepare the environment for development

### Development Environment

The platform is organized as a monorepo with the following key directories:
- `api/` - Backend API services
- `platform/` - Frontend and platform services
- `tests/` - Testing suite

## Architecture

The platform uses containerization and the following technologies:
- Docker and Docker Compose for container orchestration
- Dokku for Platform-as-a-Service deployment
- Cloudflare Tunnel for secure external access

## Configuration

### Environment Variables

Copy the example environment files:
```bash
cp .env.example .env
cd api && cp .env.example .env
```

## Deployment

### Testing Deployment

To run a test deployment:

```bash
npm run deploy:test
```

This will perform a complete test of the deployment pipeline.

## SSH Setup

For Dokku container access, you'll need to set up SSH keys:

### 1. Generate SSH Key Pair

Generate a new SSH key pair for Dokku access:

```bash
ssh-keygen -t rsa -b 4096 -C "dokku@server"
```

### 2. Add SSH Key to Dokku Container

Connect to your Dokku container and add the public key:

```bash
docker exec -it <container-id> bash
echo "ssh-rsa <public-key-content>" | dokku ssh-keys:add solusikonsep
```

Replace `<container-id>` with your actual Dokku container ID and `<public-key-content>` with the content of your public key file (usually `~/.ssh/id_rsa.pub`).

## Networking

To configure networking for deployments:

```bash
docker create network <network-name>
dokku network:set --global initial-network devjam
dokku network:set --global attach-post-create devjam
dokku network:set --global attach-post-deploy devjam
```

This creates a Docker network and configures Dokku to use it for all deployments.

## Cloudflare Tunnel Setup

To set up Cloudflare Tunnel for secure access:

1. **Create DNS Record**
   - Type: CNAME
   - Name: `*` (wildcard)
   - Value: `<tunnel-id>.cfargotunnel.com`
   - Proxy: Enabled

2. **Configure Tunnel**
   - Target: `*.<your-domain>`
   - Destination: `http://<dokku-container-host>`

Replace `<tunnel-id>`, `<your-domain>`, and `<dokku-container-host>` with your actual values.

## Troubleshooting

### Check App Configuration

To inspect the nginx configuration for a Dokku app:

```bash
dokku nginx:show-config <app-name>
```

This command displays detailed nginx configuration for debugging deployment issues.

### Common Issues

**Container won't start:**
- Ensure Docker is running
- Check that no other processes are using required ports
- Verify environment variables are properly set

**SSH access issues:**
- Verify the SSH key was added correctly to Dokku
- Check container network connectivity
- Ensure the container ID is correct

**Deployment failures:**
- Check logs with `dokku logs <app-name>`
- Verify Dokku network configuration
- Ensure proper permissions are set

## Testing

Run the complete test suite:

```bash
npm run deploy:test
```

This command runs a comprehensive test of the deployment process to ensure everything is set up correctly.

## Support

If you encounter issues not covered in this README, please open an issue in the repository or contact the development team.

## Contributing

For contributions to this platform, please follow the standard fork-and-pull request workflow. Ensure all tests pass before submitting changes.

## License

This project is licensed under the terms specified in the LICENSE file.
