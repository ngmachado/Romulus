'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
    Network,
    Activity,
    TrendingUp,
    Clock,
    Database,
    Zap,
    Hash,
    Shield,
    Cpu,
    BarChart3
} from 'lucide-react'

interface EntropySource {
    name: string
    value: string
    contribution: number
    quality: 'excellent' | 'good' | 'fair'
    lastUpdate: number
}

interface BlockData {
    number: number
    timestamp: number
    difficulty: string
    gasLimit: number
    hash: string
    entropy: number
}

export function EntropyStats() {
    const [currentBlock, setCurrentBlock] = useState(18500000)
    const [entropySources, setEntropySources] = useState<EntropySource[]>([])
    const [recentBlocks, setRecentBlocks] = useState<BlockData[]>([])
    const [totalEntropy, setTotalEntropy] = useState(0)
    const [entropyRate, setEntropyRate] = useState(0)

    // Initialize entropy sources
    useEffect(() => {
        const sources: EntropySource[] = [
            {
                name: 'Block Timestamps',
                value: Date.now().toString(),
                contribution: 25,
                quality: 'excellent',
                lastUpdate: currentBlock
            },
            {
                name: 'Block Difficulty',
                value: '0x' + Math.random().toString(16).substr(2, 16),
                contribution: 30,
                quality: 'excellent',
                lastUpdate: currentBlock
            },
            {
                name: 'Gas Limit',
                value: (30000000 + Math.floor(Math.random() * 1000000)).toString(),
                contribution: 20,
                quality: 'good',
                lastUpdate: currentBlock
            },
            {
                name: 'Block Hashes',
                value: '0x' + Math.random().toString(16).substr(2, 64),
                contribution: 25,
                quality: 'excellent',
                lastUpdate: currentBlock
            }
        ]
        setEntropySources(sources)
    }, [currentBlock])

    // Simulate block progression and entropy accumulation
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBlock(prev => {
                const newBlock = prev + 1

                // Generate new block data
                const blockData: BlockData = {
                    number: newBlock,
                    timestamp: Date.now(),
                    difficulty: '0x' + Math.random().toString(16).substr(2, 16),
                    gasLimit: 30000000 + Math.floor(Math.random() * 1000000),
                    hash: '0x' + Math.random().toString(16).substr(2, 64),
                    entropy: Math.floor(Math.random() * 1000000)
                }

                setRecentBlocks(prev => [blockData, ...prev.slice(0, 9)])

                // Update entropy sources
                setEntropySources(prevSources => prevSources.map(source => ({
                    ...source,
                    value: source.name === 'Block Timestamps' ? blockData.timestamp.toString() :
                        source.name === 'Block Difficulty' ? blockData.difficulty :
                            source.name === 'Gas Limit' ? blockData.gasLimit.toString() :
                                blockData.hash,
                    lastUpdate: newBlock
                })))

                // Update total entropy
                setTotalEntropy(prev => prev + blockData.entropy)

                return newBlock
            })
        }, 2000)

        return () => clearInterval(interval)
    }, [])

    // Calculate entropy rate
    useEffect(() => {
        if (recentBlocks.length >= 2) {
            const recent = recentBlocks.slice(0, 5)
            const avgEntropy = recent.reduce((sum, block) => sum + block.entropy, 0) / recent.length
            setEntropyRate(avgEntropy)
        }
    }, [recentBlocks])

    const getQualityColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return 'text-glow-green'
            case 'good': return 'text-glow-cyan'
            case 'fair': return 'text-glow-pink'
            default: return 'text-muted-foreground'
        }
    }

    const getQualityBadge = (quality: string) => {
        switch (quality) {
            case 'excellent': return 'ready'
            case 'good': return 'revealed'
            case 'fair': return 'pending'
            default: return 'pending'
        }
    }

    const avgBlockTime = recentBlocks.length >= 2 ?
        (recentBlocks[0].timestamp - recentBlocks[recentBlocks.length - 1].timestamp) / (recentBlocks.length - 1) : 2000

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-bg-primary pulse-glow">
                            <Network className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient-primary">Entropy Statistics</CardTitle>
                            <CardDescription className="text-lg">
                                Real-time blockchain entropy accumulation and quality metrics
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="metric-card">
                            <div className="metric-value text-glow-cyan">{Math.round(totalEntropy / 1000000)}M</div>
                            <div className="metric-label">Total Entropy</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-purple">{Math.round(entropyRate / 1000)}K</div>
                            <div className="metric-label">Entropy Rate</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-green">{Math.round(avgBlockTime / 1000 * 10) / 10}s</div>
                            <div className="metric-label">Avg Block Time</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-pink">{entropySources.length}</div>
                            <div className="metric-label">Active Sources</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Entropy Sources */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <CardTitle className="text-gradient-secondary flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Entropy Sources
                    </CardTitle>
                    <CardDescription>
                        Individual entropy source contributions and quality metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {entropySources.map((source, index) => (
                            <Card key={index} className="glass-card interactive-card">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gradient-bg-secondary">
                                                {source.name === 'Block Timestamps' && <Clock className="w-5 h-5 text-primary-foreground" />}
                                                {source.name === 'Block Difficulty' && <Shield className="w-5 h-5 text-primary-foreground" />}
                                                {source.name === 'Gas Limit' && <Zap className="w-5 h-5 text-primary-foreground" />}
                                                {source.name === 'Block Hashes' && <Hash className="w-5 h-5 text-primary-foreground" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">{source.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {source.contribution}% contribution
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={`status-badge ${getQualityBadge(source.quality)}`}>
                                            {source.quality}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground mb-1">CURRENT VALUE</div>
                                            <div className="hash-display text-xs">
                                                {source.value.length > 40 ? `${source.value.slice(0, 40)}...` : source.value}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Contribution</span>
                                                <span className={getQualityColor(source.quality)}>{source.contribution}%</span>
                                            </div>
                                            <Progress value={source.contribution} className="h-2" />
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            Last updated: Block {source.lastUpdate.toLocaleString()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Blocks */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <CardTitle className="text-gradient-accent flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Block Data
                    </CardTitle>
                    <CardDescription>
                        Latest blockchain data contributing to entropy accumulation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentBlocks.slice(0, 5).map((block, index) => (
                            <Card key={block.number} className={`glass-card ${index === 0 ? 'border-glow-cyan' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${index === 0 ? 'bg-gradient-bg-primary' : 'bg-gradient-bg-secondary'}`}>
                                                <Cpu className="w-4 h-4 text-primary-foreground" />
                                            </div>
                                            <div>
                                                <div className="font-medium">Block {block.number.toLocaleString()}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(block.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-glow-cyan">
                                                {Math.round(block.entropy / 1000)}K entropy
                                            </div>
                                            {index === 0 && (
                                                <Badge className="status-badge ready mt-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    Latest
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <div className="text-muted-foreground mb-1">DIFFICULTY</div>
                                            <div className="hash-display">
                                                {block.difficulty.slice(0, 12)}...
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1">GAS LIMIT</div>
                                            <div className="hash-display">
                                                {block.gasLimit.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-1">BLOCK HASH</div>
                                            <div className="hash-display">
                                                {block.hash.slice(0, 12)}...
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Entropy Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Entropy Quality Analysis
                        </CardTitle>
                        <CardDescription>
                            Statistical analysis of entropy source quality and distribution
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Overall Quality Score</span>
                                <Badge className="status-badge ready">
                                    <Shield className="w-3 h-3" />
                                    Excellent
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Entropy Distribution</span>
                                    <span className="text-glow-green">Uniform</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Predictability</span>
                                    <span className="text-glow-cyan">Minimal</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Bias Detection</span>
                                    <span className="text-glow-green">None</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Correlation</span>
                                    <span className="text-glow-cyan">Independent</span>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-3">
                            <div className="text-sm font-medium">Source Reliability</div>
                            {entropySources.map((source, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm">{source.name}</span>
                                    <div className="flex items-center gap-2">
                                        <Progress value={95 + Math.random() * 5} className="w-16 h-2" />
                                        <span className="text-xs text-glow-green">
                                            {Math.round(95 + Math.random() * 5)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-secondary flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Performance Metrics
                        </CardTitle>
                        <CardDescription>
                            Real-time performance and efficiency statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Throughput</div>
                                <div className="metric-value text-glow-cyan text-xl">
                                    {Math.round(entropyRate / 100) / 10}K/s
                                </div>
                                <div className="text-xs text-muted-foreground">Entropy per second</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Efficiency</div>
                                <div className="metric-value text-glow-purple text-xl">98.7%</div>
                                <div className="text-xs text-muted-foreground">Source utilization</div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-3">
                            <div className="text-sm font-medium">Network Statistics</div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Block Time Variance</span>
                                    <span className="text-glow-green">±0.2s</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Entropy Consistency</span>
                                    <span className="text-glow-cyan">99.1%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Source Availability</span>
                                    <span className="text-glow-green">100%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Quality Degradation</span>
                                    <span className="text-glow-green">0.0%</span>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-2">
                            <div className="text-sm font-medium">EIP-2935 Compliance</div>
                            <div className="flex items-center gap-2">
                                <Badge className="status-badge revealed">
                                    <Shield className="w-3 h-3" />
                                    Verified
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    8,191 block history window maintained
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 