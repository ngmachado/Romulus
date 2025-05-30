'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRomulusData, useRingSeed } from '@/hooks/useRomulus'
import { ROMULUS_ADDRESS } from '@/lib/contracts'
import { Database, Activity, Clock, Zap, ExternalLink, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ContractDataViewer() {
    const [refreshKey, setRefreshKey] = useState(0)
    const {
        owner,
        requestCounter,
        ringPosition,
        ringStatus,
        entropyStats,
        constants,
        isLoading,
        error
    } = useRomulusData()

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    const validSeeds = ringStatus?.[0] || BigInt(0)
    const oldestSeedAge = ringStatus?.[1] || BigInt(0)
    const nextRefreshIn = ringStatus?.[2] || BigInt(0)

    const entropyContributions = entropyStats?.[0] || BigInt(0)
    const lastEntropyBlock = entropyStats?.[1] || BigInt(0)
    const blocksSinceLastEntropy = entropyStats?.[2] || BigInt(0)

    if (error) {
        return (
            <Card className="glass-card border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Contract Connection Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-400 text-sm">
                        Failed to connect to Romulus contract: {error.message}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                        Make sure you're connected to Base or Base Sepolia network
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Contract Info Header */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-bg-primary pulse-glow">
                                <Database className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-gradient-primary">Live Contract Data</CardTitle>
                                <CardDescription className="text-lg">
                                    Real-time data from Romulus Oracle on Base
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className="status-badge ready">
                                <Activity className="w-3 h-3" />
                                Live
                            </Badge>
                            <button
                                onClick={() => setRefreshKey(prev => prev + 1)}
                                className="p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                                title="Refresh data"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/50">
                        <div>
                            <div className="text-sm font-medium">Contract Address</div>
                            <div className="font-mono text-xs text-muted-foreground">
                                {ROMULUS_ADDRESS}
                            </div>
                        </div>
                        <a
                            href={`https://basescan.org/address/${ROMULUS_ADDRESS}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-neon p-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="metric-card">
                    <div className="metric-value text-glow-cyan">
                        {isLoading ? '...' : requestCounter?.toString() || '0'}
                    </div>
                    <div className="metric-label">Total Requests</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value text-glow-purple">
                        {isLoading ? '...' : ringPosition?.toString() || '0'}
                    </div>
                    <div className="metric-label">Ring Position</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value text-glow-green">
                        {isLoading ? '...' : Number(validSeeds)}
                    </div>
                    <div className="metric-label">Valid Seeds</div>
                </div>
                <div className="metric-card">
                    <div className="metric-value text-glow-pink">
                        {isLoading ? '...' : Number(entropyContributions)}
                    </div>
                    <div className="metric-label">Entropy Count</div>
                </div>
            </div>

            {/* Ring Buffer Status */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-accent flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Ring Buffer Status
                    </CardTitle>
                    <CardDescription>
                        24-slot instant randomness ring buffer health
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Valid Seeds</div>
                            <div className="text-2xl font-bold text-glow-green">
                                {isLoading ? '...' : `${Number(validSeeds)}/24`}
                            </div>
                            <div className="w-full bg-muted/20 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-green-500 transition-all duration-500"
                                    style={{ width: `${(Number(validSeeds) / 24) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Oldest Seed Age</div>
                            <div className="text-2xl font-bold text-glow-purple">
                                {isLoading ? '...' : Number(oldestSeedAge)}
                            </div>
                            <div className="text-xs text-muted-foreground">blocks old</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Next Refresh In</div>
                            <div className="text-2xl font-bold text-glow-cyan">
                                {isLoading ? '...' : Number(nextRefreshIn)}
                            </div>
                            <div className="text-xs text-muted-foreground">blocks</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Entropy Statistics */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-secondary flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Entropy Statistics
                    </CardTitle>
                    <CardDescription>
                        Blockchain entropy accumulation metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Total Contributions</div>
                            <div className="text-2xl font-bold text-glow-cyan">
                                {isLoading ? '...' : Number(entropyContributions)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Last Entropy Block</div>
                            <div className="text-2xl font-bold text-glow-purple">
                                {isLoading ? '...' : Number(lastEntropyBlock)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Blocks Since Last</div>
                            <div className="text-2xl font-bold text-glow-pink">
                                {isLoading ? '...' : Number(blocksSinceLastEntropy)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contract Constants */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-primary flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Contract Constants
                    </CardTitle>
                    <CardDescription>
                        Immutable configuration parameters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-bold text-glow-cyan">
                                {isLoading ? '...' : constants?.minDelay?.toString() || '1'}
                            </div>
                            <div className="text-xs text-muted-foreground">Min Delay</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-glow-purple">
                                {isLoading ? '...' : constants?.maxHashCount?.toString() || '1000'}
                            </div>
                            <div className="text-xs text-muted-foreground">Max Hash Count</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-glow-green">
                                {isLoading ? '...' : constants?.ringSize?.toString() || '24'}
                            </div>
                            <div className="text-xs text-muted-foreground">Ring Size</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-glow-pink">
                                {isLoading ? '...' : constants?.seedRefreshInterval?.toString() || '1800'}
                            </div>
                            <div className="text-xs text-muted-foreground">Refresh Interval</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-glow-yellow">
                                {isLoading ? '...' : constants?.hashesPerSeed?.toString() || '10'}
                            </div>
                            <div className="text-xs text-muted-foreground">Hashes Per Seed</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-accent">Contract Owner</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="font-mono text-sm bg-muted/10 p-3 rounded-lg border border-border/50">
                        {isLoading ? 'Loading...' : owner || 'Not available'}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Ring Seed Viewer Component
export function RingSeedViewer({ position }: { position: number }) {
    const { data: seedData, isLoading, error } = useRingSeed(position)

    if (error) {
        return (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-red-400 text-sm">Error loading seed {position}</div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-3 rounded-lg bg-muted/10 border border-border/50">
                <div className="animate-pulse">
                    <div className="h-4 bg-muted/20 rounded mb-2"></div>
                    <div className="h-3 bg-muted/20 rounded"></div>
                </div>
            </div>
        )
    }

    const [seedHash, generatedAt, consumeCount, isValid] = seedData || []

    return (
        <div className={`p-3 rounded-lg border ${isValid ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Seed {position}</span>
                <Badge className={`status-badge ${isValid ? 'ready' : 'expired'}`}>
                    {isValid ? 'Valid' : 'Invalid'}
                </Badge>
            </div>
            <div className="space-y-1 text-xs">
                <div className="font-mono truncate">
                    Hash: {seedHash?.slice(0, 10)}...{seedHash?.slice(-6)}
                </div>
                <div>Generated: Block {Number(generatedAt)}</div>
                <div>Consumed: {Number(consumeCount)} times</div>
            </div>
        </div>
    )
} 