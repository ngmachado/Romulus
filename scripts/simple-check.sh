#!/bin/bash

export FOUNDRY_DISABLE_NIGHTLY_WARNING=1

# RomulusV2 Buffer Health Check (Simple)
CONTRACT=${1:-"0x3E0b9b582B715967Ec6Fff2ec2a954cFF7528Ea5"}
RPC_URL=${2:-"https://mainnet.base.org"}

echo "🔍 RomulusV2 Buffer Health Check"
echo "================================"
echo "📍 Contract: $CONTRACT"
echo ""

# Use cast to get individual values
echo "📊 Fetching data..."

# Get ring status using cast with proper ABI decoding
RING_CALL=$(cast call $CONTRACT --rpc-url $RPC_URL "getRingStatus()")
if [ $? -ne 0 ]; then
    echo "❌ Failed to call getRingStatus()"
    exit 1
fi

# Parse the hex response manually - each value is 32 bytes (64 hex chars)
HEX_DATA=$(echo $RING_CALL | sed 's/0x//')
VALID_SEEDS_HEX=$(echo $HEX_DATA | cut -c1-64 | sed 's/^0*//')
OLDEST_AGE_HEX=$(echo $HEX_DATA | cut -c65-128 | sed 's/^0*//')
NEXT_REFRESH_HEX=$(echo $HEX_DATA | cut -c129-192 | sed 's/^0*//')

# Convert to decimal (handle empty strings)
VALID_SEEDS=$((16#${VALID_SEEDS_HEX:-0}))
OLDEST_AGE=$((16#${OLDEST_AGE_HEX:-0}))
NEXT_REFRESH=$((16#${NEXT_REFRESH_HEX:-0}))

# Calculate time estimates (2 second blocks)
OLDEST_AGE_MIN=$((OLDEST_AGE * 2 / 60))
NEXT_REFRESH_MIN=$((NEXT_REFRESH * 2 / 60))

echo ""
echo "📊 Ring Buffer Status"
echo "--------------------"
echo "💎 Valid Seeds: $VALID_SEEDS/8"

if [ $VALID_SEEDS -ge 3 ]; then
    echo "   ✅ Status: Healthy"
else
    echo "   ⚠️  Status: Low (needs attention)"
fi

echo "⏰ Oldest Seed Age: $OLDEST_AGE blocks (~$OLDEST_AGE_MIN min)"
echo "🔄 Next Refresh: $NEXT_REFRESH blocks (~$NEXT_REFRESH_MIN min)"

echo ""
echo "🏥 Health Assessment"
echo "-------------------"

if [ $VALID_SEEDS -ge 3 ]; then
    echo "✅ Sufficient valid seeds: $VALID_SEEDS (target: ≥3)"
else
    echo "❌ Insufficient valid seeds: $VALID_SEEDS (target: ≥3)"
fi

if [ $OLDEST_AGE -lt 7200 ]; then
    echo "✅ Seed freshness: $OLDEST_AGE blocks (target: <7200 blocks)"
else
    echo "❌ Seeds getting stale: $OLDEST_AGE blocks (target: <7200 blocks)"
fi

echo ""
if [ $VALID_SEEDS -ge 3 ] && [ $OLDEST_AGE -lt 7200 ]; then
    echo "🎉 Ring buffer is healthy!"
else
    echo "⚠️  Ring buffer needs attention."
    
    if [ $NEXT_REFRESH -eq 0 ]; then
        echo "🌱 Ready to generate new seed!"
        echo "   Command: source .env && cast send $CONTRACT --rpc-url $RPC_URL --private-key \$PRIVATE_KEY \"generateSeed()\""
    else
        echo "⏰ Next seed generation available in $NEXT_REFRESH blocks (~$NEXT_REFRESH_MIN min)"
    fi
fi

echo ""
echo "💡 Commands"
echo "-----------"
echo "• Check again: ./simple-check.sh"
echo "• Watch continuously: watch -n 30 './simple-check.sh'" 