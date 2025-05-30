'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAccount } from 'wagmi'
import { useGenerateSeed, useRingStatus, useCurrentRingPosition } from '@/hooks/useRomulus'
import { Cpu, Zap, RefreshCw, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react'

export function SeedGenerator() {
    const { isConnected } = useAccount()
    const { data: ringStatus } = useRingStatus()
    const { data: currentPosition } = useCurrentRingPosition()

    const {
        generateSeed,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    } = useGenerateSeed()

    const handleGenerateSeed = () => {
        if (!isConnected) return
        generateSeed()
    }

    const validSeeds = ringStatus?.[0] || BigInt(0)
    const oldestSeedAge = ringStatus?.[1] || BigInt(0)
    const nextRefreshIn = ringStatus?.[2] || BigInt(0)

    const healthPercentage = Math.round((Number(validSeeds) / 24) * 100)
    const isHealthy = Number(validSeeds) >= 12
    const isCritical = Number(validSeeds) < 6

    return (
        <div className="space-y-8">
            {/* Ring Buffer Health */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl pulse-glow ${isCritical ? 'bg-destructive' :
                            !isHealthy ? 'bg-yellow-500' :
                                'bg-green-500'
                            }`}>
                            <Database className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient-primary">Ring Buffer Health</CardTitle>
                            <CardDescription className="text-lg">
                                Monitor and maintain the 24-slot seed ring buffer
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="metric-card">
                            <div className={`metric-value ${isCritical ? 'text-red-400' :
                                !isHealthy ? 'text-yellow-400' :
                                    'text-green-400'
                                }`}>
                                {Number(validSeeds)}/24
                            </div>
                            <div className="metric-label">Valid Seeds</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-cyan">{healthPercentage}%</div>
                            <div className="metric-label">Health Score</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-purple">{Number(oldestSeedAge)}</div>
                            <div className="metric-label">Oldest Seed Age</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-pink">{Number(nextRefreshIn)}</div>
                            <div className="metric-label">Next Refresh In</div>
                        </div>
                    </div>

                    {/* Health Status Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Buffer Health</span>
                            <Badge className={`status-badge ${isCritical ? 'expired' :
                                !isHealthy ? 'pending' :
                                    'ready'
                                }`}>
                                {isCritical ? 'Critical' : !isHealthy ? 'Low' : 'Healthy'}
                            </Badge>
                        </div>
                        <div className="w-full bg-muted/20 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' :
                                    !isHealthy ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`}
                                style={{ width: `${healthPercentage}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Seed Generation Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-accent flex items-center gap-2">
                            <Cpu className="w-5 h-5" />
                            Generate New Seed
                        </CardTitle>
                        <CardDescription>
                            Add a fresh cryptographic seed to the ring buffer
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
                                <h4 className="font-semibold mb-2">Current Ring Position</h4>
                                <div className="text-2xl font-mono text-glow-cyan">
                                    {Number(currentPosition || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Next seed will be placed at this position
                                </p>
                            </div>

                            {isCritical && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm text-red-500">
                                        Critical: Ring buffer needs immediate attention!
                                    </span>
                                </div>
                            )}

                            {!isHealthy && !isCritical && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <Clock className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm text-yellow-500">
                                        Low seed count - consider generating more seeds
                                    </span>
                                </div>
                            )}
                        </div>

                        {!isConnected ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-yellow-500">Connect wallet to generate seeds</span>
                            </div>
                        ) : (
                            <Button
                                onClick={handleGenerateSeed}
                                disabled={isPending || isConfirming}
                                className={`btn-neon w-full ${isCritical ? 'bg-red-500 hover:bg-red-600' : ''}`}
                            >
                                {isPending ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending Transaction...
                                    </>
                                ) : isConfirming ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Confirming...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Generate Seed
                                    </>
                                )}
                            </Button>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                <span className="text-sm text-destructive">
                                    {error.message || 'Transaction failed'}
                                </span>
                            </div>
                        )}

                        {isSuccess && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-500">Seed generated successfully!</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Transaction Status
                        </CardTitle>
                        <CardDescription>
                            Monitor your seed generation transaction
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {hash && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">TRANSACTION HASH</label>
                                    <div className="hash-display mt-1">
                                        {hash}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    <Badge className={`status-badge ${isSuccess ? 'revealed' :
                                        isConfirming ? 'pending' :
                                            isPending ? 'pending' : 'ready'
                                        }`}>
                                        {isSuccess ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Confirmed
                                            </>
                                        ) : isConfirming ? (
                                            <>
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                Confirming
                                            </>
                                        ) : isPending ? (
                                            <>
                                                <RefreshCw className="w-3 h-3 animate-pulse" />
                                                Pending
                                            </>
                                        ) : (
                                            'Ready'
                                        )}
                                    </Badge>
                                </div>

                                <a
                                    href={`https://basescan.org/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-neon w-full text-center"
                                >
                                    View on BaseScan
                                </a>
                            </div>
                        )}

                        {!hash && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Generate a seed to see transaction details</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* How Seed Generation Works */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-gradient-secondary">How Seed Generation Works</CardTitle>
                    <CardDescription>
                        Understanding the cryptographic process behind seed creation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                1
                            </div>
                            <h4 className="font-semibold">Entropy Accumulation</h4>
                            <p className="text-sm text-muted-foreground">
                                Collects entropy from multiple blockchain sources: timestamps, difficulty, gas limits, and block hashes.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-bg-secondary flex items-center justify-center text-primary-foreground font-bold">
                                2
                            </div>
                            <h4 className="font-semibold">Cryptographic Hashing</h4>
                            <p className="text-sm text-muted-foreground">
                                Uses keccak256 to hash accumulated entropy into a secure seed value for the ring buffer.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-bg-accent flex items-center justify-center text-primary-foreground font-bold">
                                3
                            </div>
                            <h4 className="font-semibold">Ring Placement</h4>
                            <p className="text-sm text-muted-foreground">
                                Places the new seed at the current ring position and advances the pointer for the next generation.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 