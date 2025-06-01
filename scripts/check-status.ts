#!/usr/bin/env tsx

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// RomulusV2 ABI (read-only functions)
const ROMULUS_V2_ABI = [
    'function getRingStatus() view returns (uint256 validSeeds, uint256 oldestSeedAge, uint256 nextRefreshIn)',
    'function getEntropyStats() view returns (uint256 contributions, uint256 lastBlock, uint256 blocksSince)',
    'function owner() view returns (address)',
    'function SEED_REFRESH_INTERVAL() view returns (uint256)',
    'function RING_SIZE() view returns (uint256)',
    'function callbackGasLimit() view returns (uint256)',
    'function DEFAULT_SPAN() view returns (uint16)',
    'function MIN_SPAN() view returns (uint16)',
    'function MAX_SPAN() view returns (uint16)',
    'function requestCounter() view returns (uint256)',
    'function currentRingPosition() view returns (uint256)'
];

async function checkStatus() {
    const contractAddress = process.env.ROMULUS_V2_ADDRESS || '0x3E0b9b582B715967Ec6Fff2ec2a954cFF7528Ea5';
    const rpcUrl = process.env.RPC_URL || 'https://mainnet.base.org';

    console.log('🔍 RomulusV2 Buffer Health Check');
    console.log('================================');
    console.log(`📍 Contract: ${contractAddress}`);
    console.log(`🌐 Network: Base Mainnet`);
    console.log('');

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractAddress, ROMULUS_V2_ABI, provider);

        // Get current block
        const currentBlock = await provider.getBlockNumber();
        console.log(`🔗 Current Block: ${currentBlock.toLocaleString()}`);

        // Get ring status
        const ringStatus = await contract.getRingStatus();
        const validSeeds = Number(ringStatus.validSeeds);
        const oldestSeedAge = Number(ringStatus.oldestSeedAge);
        const nextRefreshIn = Number(ringStatus.nextRefreshIn);

        // Get entropy stats
        const entropyStats = await contract.getEntropyStats();
        const contributions = Number(entropyStats.contributions);
        const lastBlock = Number(entropyStats.lastBlock);
        const blocksSince = Number(entropyStats.blocksSince);

        // Get contract constants
        const [owner, ringSize, refreshInterval, requestCounter, ringPosition, gasLimit, defaultSpan] = await Promise.all([
            contract.owner(),
            contract.RING_SIZE(),
            contract.SEED_REFRESH_INTERVAL(),
            contract.requestCounter(),
            contract.currentRingPosition(),
            contract.callbackGasLimit(),
            contract.DEFAULT_SPAN()
        ]);

        console.log('📊 Ring Buffer Status');
        console.log('--------------------');
        console.log(`💎 Valid Seeds: ${validSeeds}/${Number(ringSize)} (${validSeeds >= 3 ? '✅ Healthy' : '⚠️  Low'})`);
        console.log(`⏰ Oldest Seed Age: ${oldestSeedAge.toLocaleString()} blocks (${(oldestSeedAge * 2 / 60).toFixed(1)} min)`);
        console.log(`🔄 Next Refresh: ${nextRefreshIn.toLocaleString()} blocks (${(nextRefreshIn * 2 / 60).toFixed(1)} min)`);
        console.log(`🎯 Current Ring Position: ${Number(ringPosition)}`);
        console.log('');

        console.log('📈 Entropy Statistics');
        console.log('--------------------');
        console.log(`🌟 Total Contributions: ${contributions.toLocaleString()}`);
        console.log(`🔗 Last Entropy Block: ${lastBlock.toLocaleString()}`);
        console.log(`⏲️  Blocks Since Last: ${blocksSince.toLocaleString()} (${(blocksSince * 2 / 60).toFixed(1)} min)`);
        console.log('');

        console.log('⚙️  Contract Configuration');
        console.log('-------------------------');
        console.log(`👑 Owner: ${owner}`);
        console.log(`🎲 Total Requests: ${Number(requestCounter).toLocaleString()}`);
        console.log(`⛽ Callback Gas Limit: ${Number(gasLimit).toLocaleString()}`);
        console.log(`📏 Default Span: ${Number(defaultSpan)} blocks`);
        console.log(`🔄 Refresh Interval: ${Number(refreshInterval)} blocks (~${(Number(refreshInterval) * 2 / 3600).toFixed(1)} hours)`);
        console.log('');

        // Health assessment
        console.log('🏥 Health Assessment');
        console.log('-------------------');

        const healthChecks = [
            { name: 'Sufficient valid seeds', status: validSeeds >= 3, current: validSeeds, target: '≥3' },
            { name: 'Seed freshness', status: oldestSeedAge < 7200, current: `${oldestSeedAge} blocks`, target: '<7200 blocks' },
            { name: 'Recent entropy activity', status: blocksSince < 1800, current: `${blocksSince} blocks`, target: '<1800 blocks' },
            { name: 'Ring utilization', status: validSeeds > 0, current: `${validSeeds}/${Number(ringSize)}`, target: '>0' }
        ];

        let allHealthy = true;
        for (const check of healthChecks) {
            const icon = check.status ? '✅' : '❌';
            console.log(`${icon} ${check.name}: ${check.current} (target: ${check.target})`);
            if (!check.status) allHealthy = false;
        }

        console.log('');
        if (allHealthy) {
            console.log('🎉 Ring buffer is healthy! No maintenance needed.');
        } else {
            console.log('⚠️  Ring buffer needs attention.');

            if (nextRefreshIn === 0) {
                console.log('🌱 Ready to generate new seed - run maintenance script');
            } else {
                console.log(`⏰ Next seed generation available in ${nextRefreshIn} blocks (${(nextRefreshIn * 2 / 60).toFixed(1)} min)`);
            }
        }

        // Recommendations
        console.log('');
        console.log('💡 Recommendations');
        console.log('------------------');
        if (validSeeds < 3) {
            console.log('• Schedule regular seed generation (when refresh interval allows)');
        }
        if (blocksSince > 900) {
            console.log('• Encourage user interactions to boost entropy');
        }
        if (oldestSeedAge > 3600) {
            console.log('• Consider generating fresh seeds for better forward secrecy');
        }
        console.log('• Monitor buffer health regularly (recommended: every 30 minutes)');
        console.log(`• Set up automated monitoring: pnpm run check-status`);

    } catch (error) {
        console.error('❌ Error checking buffer status:', error);
        process.exit(1);
    }
}

checkStatus(); 