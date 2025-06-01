#!/bin/bash

# RomulusV2 Buffer Maintenance Script
# Usage: ./scripts/maintain-buffer.sh <CONTRACT_ADDRESS> <RPC_URL>

set -e

CONTRACT_ADDRESS=${1:-""}
RPC_URL=${2:-"http://localhost:8545"}
PRIVATE_KEY=${PRIVATE_KEY:-""}

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Usage: $0 <CONTRACT_ADDRESS> [RPC_URL]"
    echo "Example: $0 0x1234... https://eth-mainnet.alchemyapi.io/v2/..."
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY environment variable is required"
    exit 1
fi

echo "🔧 RomulusV2 Buffer Maintenance"
echo "Contract: $CONTRACT_ADDRESS"
echo "RPC: $RPC_URL"
echo ""

# Function to check ring status
check_ring_status() {
    echo "📊 Checking ring buffer status..."
    
    local result=$(cast call $CONTRACT_ADDRESS "getRingStatus()" --rpc-url $RPC_URL)
    local valid_seeds=$(echo $result | cut -d' ' -f1)
    local oldest_age=$(echo $result | cut -d' ' -f2)
    local next_refresh=$(echo $result | cut -d' ' -f3)
    
    echo "  Valid seeds: $((valid_seeds))"
    echo "  Oldest seed age: $((oldest_age)) blocks"
    echo "  Next refresh in: $((next_refresh)) blocks"
    
    # Return values for decision making
    echo "$valid_seeds $oldest_age $next_refresh"
}

# Function to generate new seed
generate_seed() {
    echo "🌱 Generating new seed..."
    
    local tx_hash=$(cast send $CONTRACT_ADDRESS "generateSeed()" \
        --private-key $PRIVATE_KEY \
        --rpc-url $RPC_URL \
        --gas-limit 200000)
    
    echo "  Transaction: $tx_hash"
    
    # Wait for confirmation
    cast receipt $tx_hash --rpc-url $RPC_URL > /dev/null
    echo "  ✅ Seed generated successfully"
}

# Function to check if seed generation is needed
should_generate_seed() {
    local status=($(check_ring_status))
    local valid_seeds=${status[0]}
    local next_refresh=${status[2]}
    
    # Generate if we have few valid seeds or refresh time is due
    if [ $valid_seeds -lt 3 ] || [ $next_refresh -eq 0 ]; then
        return 0  # Should generate
    else
        return 1  # No need to generate
    fi
}

# Main maintenance logic
echo "🔍 Analyzing buffer health..."

if should_generate_seed; then
    echo "⚠️  Buffer needs maintenance"
    generate_seed
    echo ""
    check_ring_status > /dev/null
    echo "✅ Maintenance complete"
else
    echo "✅ Buffer is healthy, no action needed"
fi

echo ""
echo "🎯 For continuous monitoring, run this script periodically with cron:"
echo "# Every 10 minutes"
echo "*/10 * * * * /path/to/maintain-buffer.sh $CONTRACT_ADDRESS $RPC_URL" 