#!/usr/bin/env tsx

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// RomulusV2 ABI (minimal for maintenance functions)
const ROMULUS_V2_ABI = [
    'function getRingStatus() view returns (uint256 validSeeds, uint256 oldestSeedAge, uint256 nextRefreshIn)',
    'function getEntropyStats() view returns (uint256 contributions, uint256 lastBlock, uint256 blocksSince)',
    'function generateSeed() external',
    'function owner() view returns (address)',
    'function SEED_REFRESH_INTERVAL() view returns (uint256)',
    'function RING_SIZE() view returns (uint256)',
    'event SeedGenerated(uint256 ringPosition, bytes32 seedHash, uint256 blockNumber)'
];

interface Config {
    contractAddress: string;
    rpcUrl: string;
    privateKey: string;
    minValidSeeds: number;
    checkInterval: number;
    gasLimit: number;
    maxGasPrice: string;
}

interface RingStatus {
    validSeeds: number;
    oldestSeedAge: number;
    nextRefreshIn: number;
}

interface EntropyStats {
    contributions: number;
    lastBlock: number;
    blocksSince: number;
}

class BufferMaintainer {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;
    private config: Config;
    private isRunning = false;

    constructor(config: Config) {
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.contract = new ethers.Contract(config.contractAddress, ROMULUS_V2_ABI, this.wallet);
    }

    private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = level === 'info' ? '📝' : level === 'warn' ? '⚠️' : '❌';
        console.log(`${emoji} [${timestamp}] ${message}`);
    }

    private async getRingStatus(): Promise<RingStatus> {
        const result = await this.contract.getRingStatus();
        return {
            validSeeds: Number(result.validSeeds),
            oldestSeedAge: Number(result.oldestSeedAge),
            nextRefreshIn: Number(result.nextRefreshIn)
        };
    }

    private async getEntropyStats(): Promise<EntropyStats> {
        const result = await this.contract.getEntropyStats();
        return {
            contributions: Number(result.contributions),
            lastBlock: Number(result.lastBlock),
            blocksSince: Number(result.blocksSince)
        };
    }

    private async shouldGenerateSeed(status: RingStatus): Promise<boolean> {
        // Generate if:
        // 1. Too few valid seeds
        // 2. Refresh time is due
        // 3. Oldest seed is getting stale (> 1000 blocks old)
        return (
            status.validSeeds < this.config.minValidSeeds ||
            status.nextRefreshIn === 0 ||
            status.oldestSeedAge > 1000
        );
    }

    private async generateSeed(): Promise<string> {
        this.log('🌱 Generating new seed...');

        const gasPrice = await this.provider.getFeeData();
        const maxGasPrice = ethers.parseUnits(this.config.maxGasPrice, 'gwei');

        if (gasPrice.gasPrice && gasPrice.gasPrice > maxGasPrice) {
            throw new Error(`Gas price too high: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei > ${this.config.maxGasPrice} gwei`);
        }

        const tx = await this.contract.generateSeed({
            gasLimit: this.config.gasLimit,
            gasPrice: gasPrice.gasPrice
        });

        this.log(`Transaction submitted: ${tx.hash}`);

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            this.log(`✅ Seed generated successfully (Block: ${receipt.blockNumber})`);
            return tx.hash;
        } else {
            throw new Error('Transaction failed');
        }
    }

    private async checkAndMaintain(): Promise<void> {
        try {
            this.log('🔍 Checking buffer health...');

            const [status, entropy, currentBlock] = await Promise.all([
                this.getRingStatus(),
                this.getEntropyStats(),
                this.provider.getBlockNumber()
            ]);

            this.log(`📊 Ring Status: ${status.validSeeds} valid seeds, oldest: ${status.oldestSeedAge} blocks, refresh in: ${status.nextRefreshIn} blocks`);
            this.log(`📈 Entropy: ${entropy.contributions} contributions, ${entropy.blocksSince} blocks since last`);
            this.log(`🔗 Current block: ${currentBlock}`);

            if (await this.shouldGenerateSeed(status)) {
                this.log('⚠️  Buffer maintenance needed', 'warn');
                await this.generateSeed();

                // Re-check status after generation
                const newStatus = await this.getRingStatus();
                this.log(`✅ New status: ${newStatus.validSeeds} valid seeds`);
            } else {
                this.log('✅ Buffer is healthy');
            }

        } catch (error) {
            this.log(`Failed to check/maintain buffer: ${error}`, 'error');
            throw error;
        }
    }

    public async start(): Promise<void> {
        this.log('🚀 Starting buffer maintenance service...');
        this.log(`Contract: ${this.config.contractAddress}`);
        this.log(`Check interval: ${this.config.checkInterval}ms`);
        this.log(`Min valid seeds: ${this.config.minValidSeeds}`);

        // Verify contract and ownership
        try {
            const owner = await this.contract.owner();
            const walletAddress = await this.wallet.getAddress();
            this.log(`Contract owner: ${owner}`);
            this.log(`Wallet address: ${walletAddress}`);

            if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
                this.log('⚠️  Warning: Wallet is not the contract owner', 'warn');
            }
        } catch (error) {
            this.log(`Failed to verify contract: ${error}`, 'error');
            return;
        }

        this.isRunning = true;

        // Initial check
        await this.checkAndMaintain();

        // Set up periodic checks
        const interval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }

            try {
                await this.checkAndMaintain();
            } catch (error) {
                this.log(`Maintenance cycle failed: ${error}`, 'error');
            }
        }, this.config.checkInterval);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.log('🛑 Shutting down buffer maintenance service...');
            this.isRunning = false;
            clearInterval(interval);
            process.exit(0);
        });

        this.log('✅ Buffer maintenance service started');
    }

    public stop(): void {
        this.isRunning = false;
    }
}

// Configuration from environment variables
const config: Config = {
    contractAddress: process.env.ROMULUS_V2_ADDRESS || '',
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    privateKey: process.env.PRIVATE_KEY || '',
    minValidSeeds: parseInt(process.env.MIN_VALID_SEEDS || '3'),
    checkInterval: parseInt(process.env.CHECK_INTERVAL || '300000'), // 5 minutes
    gasLimit: parseInt(process.env.GAS_LIMIT || '200000'),
    maxGasPrice: process.env.MAX_GAS_PRICE || '50' // gwei
};

// Validation
if (!config.contractAddress) {
    console.error('❌ ROMULUS_V2_ADDRESS environment variable is required');
    process.exit(1);
}

if (!config.privateKey) {
    console.error('❌ PRIVATE_KEY environment variable is required');
    process.exit(1);
}

// Start the service
const maintainer = new BufferMaintainer(config);
maintainer.start().catch((error) => {
    console.error('❌ Failed to start buffer maintenance service:', error);
    process.exit(1);
}); 