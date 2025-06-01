#!/bin/bash

# RomulusV2 Buffer Health Check (Cast-based)
CONTRACT=${1:-"0x3E0b9b582B715967Ec6Fff2ec2a954cFF7528Ea5"}
RPC_URL=${2:-"https://mainnet.base.org"}

echo "🔍 RomulusV2 Buffer Health Check"
echo "================================"
echo "📍 Contract: $CONTRACT"
echo "🌐 Network: Base Mainnet"
echo ""

# Get current block
CURRENT_BLOCK=$(cast block-number --rpc-url $RPC_URL)
echo "🔗 Current Block: $(printf "%'d" $CURRENT_BLOCK)"

# Get ring status - decode the hex response properly
RING_DATA=$(cast call $CONTRACT --rpc-url $RPC_URL "getRingStatus()")

# Extract each 32-byte chunk and convert to decimal
VALID_SEEDS=$(echo $RING_DATA | sed 's/0x//' | cut -c1-64 | sed 's/^0*//' | if [ -z "$(cat)" ]; then echo "0"; else cast --to-dec "0x$(cat)"; fi)
OLDEST_AGE=$(echo $RING_DATA | sed 's/0x//' | cut -c65-128 | sed 's/^0*//' | if [ -z "$(cat)" ]; then echo "0"; else cast --to-dec "0x$(cat)"; fi)
NEXT_REFRESH=$(echo $RING_DATA | sed 's/0x//' | cut -c129-192 | sed 's/^0*//' | if [ -z "$(cat)" ]; then echo "0"; else cast --to-dec "0x$(cat)"; fi)

echo ""
echo "📊 Ring Buffer Status"
echo "--------------------"
echo "💎 Valid Seeds: $VALID_SEEDS/8"

if [ $VALID_SEEDS -ge 3 ]; then
    echo "   ✅ Status: Healthy"
else
    echo "   ⚠️  Status: Low (needs attention)"
fi

echo "⏰ Oldest Seed Age: $OLDEST_AGE blocks ($(echo "scale=1; $OLDEST_AGE * 2 / 60" | bc -l) min)"
echo "🔄 Next Refresh: $NEXT_REFRESH blocks ($(echo "scale=1; $NEXT_REFRESH * 2 / 60" | bc -l) min)"

# Get entropy stats
ENTROPY_DATA=$(cast call $CONTRACT --rpc-url $RPC_URL "getEntropyStats()")
CONTRIBUTIONS=$(echo $ENTROPY_DATA | sed 's/0x//' | cut -c1-64 | sed 's/^0*//' | if [ -z "$(cat)" ]; then echo "0"; else cast --to-dec "0x$(cat)"; fi)
LAST_BLOCK=$(echo $ENTROPY_DATA | sed 's/0x//' | cut -c65-128 | sed 's/^0*//' | if [ -z "$(cat)" ]; then echo "0"; else cast --to-dec "0x$(cat)"; fi)
BLOCKS_SINCE=$(echo $ENTROPY_DATA | sed 's/0x//' | cut -c129-192 | sed 's/^0*//' | if [ -z "$(cat)" ]; then echo "0"; else cast --to-dec "0x$(cat)"; fi)

echo ""
echo "📈 Entropy Statistics"
echo "--------------------"
echo "🌟 Total Contributions: $CONTRIBUTIONS"
echo "🔗 Last Entropy Block: $LAST_BLOCK"
echo "⏲️  Blocks Since Last: $BLOCKS_SINCE ($(echo "scale=1; $BLOCKS_SINCE * 2 / 60" | bc -l) min)"

echo ""
echo "🏥 Health Assessment"
echo "-------------------"

# Health checks
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

if [ $BLOCKS_SINCE -lt 1800 ]; then
    echo "✅ Recent entropy activity: $BLOCKS_SINCE blocks (target: <1800 blocks)"
else
    echo "❌ Low entropy activity: $BLOCKS_SINCE blocks (target: <1800 blocks)"
fi

echo ""
if [ $VALID_SEEDS -ge 3 ] && [ $OLDEST_AGE -lt 7200 ] && [ $BLOCKS_SINCE -lt 1800 ]; then
    echo "🎉 Ring buffer is healthy! No maintenance needed."
else
    echo "⚠️  Ring buffer needs attention."
    
    if [ $NEXT_REFRESH -eq 0 ]; then
        echo "🌱 Ready to generate new seed - run: source .env && cast send $CONTRACT --rpc-url $RPC_URL --private-key \$PRIVATE_KEY \"generateSeed()\""
    else
        echo "⏰ Next seed generation available in $NEXT_REFRESH blocks ($(echo "scale=1; $NEXT_REFRESH * 2 / 60" | bc -l) min)"
    fi
fi

echo ""
echo "💡 Quick Commands"
echo "----------------"
echo "• Check status: ./quick-check.sh"
echo "• Generate seed (when ready): source .env && cast send $CONTRACT --rpc-url $RPC_URL --private-key \$PRIVATE_KEY \"generateSeed()\""
echo "• Monitor continuously: watch -n 60 './quick-check.sh'" 