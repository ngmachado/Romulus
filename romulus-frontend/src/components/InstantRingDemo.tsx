'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
    Zap,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Copy,
    Dice6,
    Activity,
    Target
} from 'lucide-react'

interface RingSeed {
    id: number
    value: string
    isValid: boolean
    lastRefresh: number
    entropy: number
}

export function InstantRingDemo() {
    const [currentBlock, setCurrentBlock] = useState(18500000)
    const [ringSeeds, setRingSeeds] = useState<RingSeed[]>([])
    const [currentSlot, setCurrentSlot] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [lastRandomValue, setLastRandomValue] = useState<string>('')
    const [generationCount, setGenerationCount] = useState(0)
    const [nextRefresh, setNextRefresh] = useState(18501800)

    // Initialize ring buffer
    useEffect(() => {
        const seeds: RingSeed[] = Array.from({ length: 24 }, (_, i) => ({
            id: i,
            value: `0x${Math.random().toString(16).substr(2, 64)}`,
            isValid: Math.random() > 0.1, // 90% valid seeds
            lastRefresh: currentBlock - Math.floor(Math.random() * 1800),
            entropy: Math.floor(Math.random() * 1000000)
        }))
        setRingSeeds(seeds)
    }, [currentBlock])

    // Simulate block progression
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBlock(prev => {
                const newBlock = prev + 1

                // Refresh ring every 1800 blocks
                if (newBlock >= nextRefresh) {
                    setRingSeeds(prevSeeds => prevSeeds.map(seed => ({
                        ...seed,
                        value: `0x${Math.random().toString(16).substr(2, 64)}`,
                        isValid: Math.random() > 0.05, // 95% valid after refresh
                        lastRefresh: newBlock,
                        entropy: Math.floor(Math.random() * 1000000)
                    })))
                    setNextRefresh(newBlock + 1800)
                }

                return newBlock
            })
        }, 2000) // 2 second block time

        return () => clearInterval(interval)
    }, [nextRefresh])

    const handleGenerateRandom = async () => {
        setIsGenerating(true)

        // Simulate random generation
        await new Promise(resolve => setTimeout(resolve, 500))

        const newSlot = Math.floor(Math.random() * 24)
        const selectedSeed = ringSeeds[newSlot]

        if (selectedSeed?.isValid) {
            const randomValue = `0x${Math.random().toString(16).substr(2, 64)}`
            setLastRandomValue(randomValue)
            setCurrentSlot(newSlot)
            setGenerationCount(prev => prev + 1)
        }

        setIsGenerating(false)
    }

    const getSlotStatus = (seed: RingSeed) => {
        const age = currentBlock - seed.lastRefresh
        if (!seed.isValid) return 'invalid'
        if (age > 1600) return 'stale'
        return 'valid'
    }

    const getSlotColor = (seed: RingSeed, index: number) => {
        if (index === currentSlot) return 'ring-seed valid border-glow-cyan'
        const status = getSlotStatus(seed)
        return `ring-seed ${status}`
    }

    const validSeeds = ringSeeds.filter(seed => seed.isValid).length
    const refreshProgress = ((currentBlock - (nextRefresh - 1800)) / 1800) * 100

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-bg-secondary pulse-glow">
                            <Zap className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient-secondary">Instant Ring Buffer</CardTitle>
                            <CardDescription className="text-lg">
                                High-speed randomness from pre-computed entropy seeds
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="metric-card">
                            <div className="metric-value text-glow-cyan">{validSeeds}/24</div>
                            <div className="metric-label">Valid Seeds</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-purple">{generationCount}</div>
                            <div className="metric-label">Generated</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-green">{nextRefresh - currentBlock}</div>
                            <div className="metric-label">Blocks to Refresh</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-pink">{Math.round(refreshProgress)}%</div>
                            <div className="metric-label">Cycle Progress</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ring Visualization */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <CardTitle className="text-gradient-primary flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Ring Buffer Visualization
                    </CardTitle>
                    <CardDescription>
                        24-slot circular buffer with real-time seed status monitoring
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Ring Display */}
                    <div className="relative w-full max-w-2xl mx-auto mb-8">
                        <div className="aspect-square relative">
                            {/* Center circle */}
                            <div className="absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full glass-card-glow flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gradient-primary">RING</div>
                                    <div className="text-sm text-muted-foreground">24 Slots</div>
                                </div>
                            </div>

                            {/* Ring slots */}
                            {ringSeeds.map((seed, index) => {
                                const angle = (index * 360) / 24
                                const radius = 180
                                const x = Math.cos((angle - 90) * Math.PI / 180) * radius
                                const y = Math.sin((angle - 90) * Math.PI / 180) * radius

                                return (
                                    <div
                                        key={seed.id}
                                        className={`absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 ${getSlotColor(seed, index)} flex items-center justify-center text-xs font-mono transition-all duration-300`}
                                        style={{
                                            left: `calc(50% + ${x}px)`,
                                            top: `calc(50% + ${y}px)`,
                                        }}
                                    >
                                        {index}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 ring-seed valid" />
                            <span className="text-sm">Valid Seed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 ring-seed invalid" />
                            <span className="text-sm">Invalid Seed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 ring-seed valid border-glow-cyan" />
                            <span className="text-sm">Current Selection</span>
                        </div>
                    </div>

                    {/* Refresh Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Next Refresh Cycle
                            </span>
                            <span>{Math.round(refreshProgress)}%</span>
                        </div>
                        <Progress value={refreshProgress} className="h-2 bg-muted/20" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Block {(nextRefresh - 1800).toLocaleString()}</span>
                            <span>{nextRefresh - currentBlock} blocks remaining</span>
                            <span>Block {nextRefresh.toLocaleString()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Generation Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-accent flex items-center gap-2">
                            <Dice6 className="w-5 h-5" />
                            Generate Random Value
                        </CardTitle>
                        <CardDescription>
                            Instantly generate cryptographically secure random values
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Button
                            onClick={handleGenerateRandom}
                            disabled={isGenerating || validSeeds === 0}
                            className="btn-neon w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Generate Random Value
                                </>
                            )}
                        </Button>

                        {validSeeds === 0 && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                <span className="text-sm text-destructive">No valid seeds available</span>
                            </div>
                        )}

                        {lastRandomValue && (
                            <>
                                <Separator className="bg-border/50" />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Latest Random Value</span>
                                        <Badge className="status-badge revealed">
                                            <CheckCircle className="w-3 h-3" />
                                            Generated
                                        </Badge>
                                    </div>
                                    <div className="hash-display large flex items-center justify-between">
                                        <span className="truncate text-glow-green">{lastRandomValue}</span>
                                        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Generated from slot {currentSlot} at block {currentBlock.toLocaleString()}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Ring Statistics
                        </CardTitle>
                        <CardDescription>
                            Real-time monitoring of ring buffer health and performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Seed Health</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-glow-green">Valid</span>
                                        <span>{validSeeds}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-destructive">Invalid</span>
                                        <span>{24 - validSeeds}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Success Rate</span>
                                        <span className="text-glow-cyan">{Math.round((validSeeds / 24) * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">Performance</div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Generated</span>
                                        <span className="text-glow-purple">{generationCount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Current Slot</span>
                                        <span className="text-glow-cyan">{currentSlot}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Avg Entropy</span>
                                        <span className="text-glow-green">
                                            {Math.round(ringSeeds.reduce((sum, seed) => sum + seed.entropy, 0) / ringSeeds.length).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-3">
                            <div className="text-sm font-medium">Next Refresh</div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Target Block</span>
                                    <span className="font-mono">{nextRefresh.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Estimated Time</span>
                                    <span>{Math.round((nextRefresh - currentBlock) * 2 / 60)} minutes</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Cycle Progress</span>
                                    <span className="text-glow-pink">{Math.round(refreshProgress)}%</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 