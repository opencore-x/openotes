#!/bin/bash

# openotes MCP Server - Cloudflare Tunnel Setup Script

set -e

echo "=== openotes Cloudflare Tunnel Setup ==="
echo ""

# Check for cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "cloudflared is not installed."
    echo ""
    echo "Install with Homebrew:"
    echo "  brew install cloudflared"
    echo ""
    echo "Or download from:"
    echo "  https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"
    exit 1
fi

echo "✓ cloudflared is installed"
echo ""

# Check if logged in
if ! cloudflared tunnel list &> /dev/null; then
    echo "Not logged in to Cloudflare. Running login..."
    cloudflared login
fi

echo "✓ Logged in to Cloudflare"
echo ""

# Prompt for tunnel name
read -p "Enter tunnel name (default: openotes): " TUNNEL_NAME
TUNNEL_NAME=${TUNNEL_NAME:-openotes}

# Check if tunnel already exists
if cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo "Tunnel '$TUNNEL_NAME' already exists."
    read -p "Use existing tunnel? (y/n): " USE_EXISTING
    if [[ "$USE_EXISTING" != "y" ]]; then
        echo "Aborting."
        exit 1
    fi
else
    echo "Creating tunnel '$TUNNEL_NAME'..."
    cloudflared tunnel create "$TUNNEL_NAME"
fi

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"
echo ""

# Prompt for hostname
read -p "Enter hostname (e.g., openotes.yourdomain.com): " HOSTNAME
if [[ -z "$HOSTNAME" ]]; then
    echo "Hostname is required."
    exit 1
fi

# Create config directory
CONFIG_DIR="$HOME/.cloudflared"
mkdir -p "$CONFIG_DIR"

# Create tunnel config
CONFIG_FILE="$CONFIG_DIR/config-openotes.yml"
cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/$TUNNEL_ID.json

ingress:
  - hostname: $HOSTNAME
    service: http://localhost:3000
  - service: http_status:404
EOF

echo "✓ Created tunnel config: $CONFIG_FILE"
echo ""

# Route DNS
echo "Setting up DNS route..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME" || echo "DNS route may already exist"
echo ""

echo "=== Setup Complete ==="
echo ""
echo "To start the tunnel, run:"
echo "  cloudflared tunnel --config $CONFIG_FILE run"
echo ""
echo "Or add to your start.sh script:"
echo "  cloudflared tunnel --config $CONFIG_FILE run &"
echo ""
echo "Configure Cloudflare Access at:"
echo "  https://one.dash.cloudflare.com/"
echo ""
