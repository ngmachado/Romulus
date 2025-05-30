'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Cpu,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity,
    Shield,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react'

interface SeedStatus {
    id: number
    isValid: boolean
    entropy: number
    lastRefresh: number
    age: number
    health: 'excellent' | 'good' | 'warning' | 'critical'
}

interface SystemAlert {
    id: string
    type: 'info' | 'warning' | 'error'
    message: string
    timestamp: number
}

export function RingStatusMonitor() {
    const [currentBlock, setCurrentBlock] = useState(18500000)
    const [seeds, setSeeds] = useState<SeedStatus[]>([])
    const [alerts, setAlerts] = useState<SystemAlert[]>([])
    const [systemHealth, setSystemHealth] = useState(95)
    const [refreshCycle, setRefreshCycle] = useState(18501800)

    // Initialize seeds
    useEffect(() => {
        const initialSeeds: SeedStatus[] = Array.from({ length: 24 }, (_, i) => {
            const age = Math.floor(Math.random() * 1800)
            const entropy = Math.floor(Math.random() * 1000000)
            const isValid = Math.random() > 0.05

            let health: SeedStatus['health'] = 'excellent'
            if (age > 1600) health = 'critical'
            else if (age > 1200) health = 'warning'
            else if (age > 800) health = 'good'

            return {
                id: i,
                isValid,
                entropy,
                lastRefresh: currentBlock - age,
                age,
                health: isValid ? health : 'critical'
            }
        })
        setSeeds(initialSeeds)
    }, [currentBlock])

    // Simulate block progression and updates
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBlock(prev => {
                const newBlock = prev + 1

                // Update seed ages and health
                setSeeds(prevSeeds => prevSeeds.map(seed => {
                    const newAge = newBlock - seed.lastRefresh
                    let health: SeedStatus['health'] = 'excellent'

                    if (!seed.isValid) {
                        health = 'critical'
                    } else if (newAge > 1600) {
                        health = 'critical'
                    } else if (newAge > 1200) {
                        health = 'warning'
                    } else if (newAge > 800) {
                        health = 'good'
                    }

                    return { ...seed, age: newAge, health }
                }))

                // Refresh cycle
                if (newBlock >= refreshCycle) {
                    setSeeds(prevSeeds => prevSeeds.map(seed => ({
                        ...seed,
                        isValid: Math.random() > 0.02, // 98% success rate after refresh
                        entropy: Math.floor(Math.random() * 1000000),
                        lastRefresh: newBlock,
                        age: 0,
                        health: 'excellent' as const
                    })))
                    setRefreshCycle(newBlock + 1800)

                    // Add refresh alert
                    setAlerts(prev => [{
                        id: `refresh-${newBlock}`,
                        type: 'info',
                        message: 'Ring buffer refreshed successfully',
                        timestamp: newBlock
                    }, ...prev.slice(0, 4)])
                }

                return newBlock
            })
        }, 2000)

        return () => clearInterval(interval)
    }, [refreshCycle])

    // Calculate system health
    useEffect(() => {
        const validSeeds = seeds.filter(s => s.isValid).length
        const excellentSeeds = seeds.filter(s => s.health === 'excellent').length
        const goodSeeds = seeds.filter(s => s.health === 'good').length

        const health = Math.round(
            (validSeeds / 24) * 70 +
            (excellentSeeds / 24) * 20 +
            (goodSeeds / 24) * 10
        )

        setSystemHealth(health)

        // Generate alerts based on health
        if (health < 80 && !alerts.some(a => a.type === 'warning' && a.timestamp > currentBlock - 100)) {
            setAlerts(prev => [{
                id: `warning-${currentBlock}`,
                type: 'warning',
                message: `System health degraded to ${health}%`,
                timestamp: currentBlock
            }, ...prev.slice(0, 4)])
        }
    }, [seeds, currentBlock, alerts])



    const getHealthBadge = (health: string) => {
        switch (health) {
            case 'excellent': return 'ready'
            case 'good': return 'revealed'
            case 'warning': return 'pending'
            case 'critical': return 'expired'
            default: return 'pending'
        }
    }

    const getHealthIcon = (health: string) => {
        switch (health) {
            case 'excellent': return <CheckCircle className="w-3 h-3" />
            case 'good': return <TrendingUp className="w-3 h-3" />
            case 'warning': return <Minus className="w-3 h-3" />
            case 'critical': return <TrendingDown className="w-3 h-3" />
            default: return <Clock className="w-3 h-3" />
        }
    }

    const validSeeds = seeds.filter(s => s.isValid).length
    const criticalSeeds = seeds.filter(s => s.health === 'critical').length
    const avgEntropy = seeds.reduce((sum, seed) => sum + seed.entropy, 0) / seeds.length

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-bg-accent pulse-glow">
                            <Cpu className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-gradient-accent">Ring Status Monitor</CardTitle>
                            <CardDescription className="text-lg">
                                Real-time health monitoring and diagnostics for the ring buffer system
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="metric-card">
                            <div className={`metric-value ${systemHealth >= 90 ? 'text-glow-green' : systemHealth >= 70 ? 'text-glow-cyan' : 'text-destructive'}`}>
                                {systemHealth}%
                            </div>
                            <div className="metric-label">System Health</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-cyan">{validSeeds}/24</div>
                            <div className="metric-label">Valid Seeds</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-pink">{criticalSeeds}</div>
                            <div className="metric-label">Critical Issues</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-value text-glow-purple">{Math.round(avgEntropy / 1000)}K</div>
                            <div className="metric-label">Avg Entropy</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Alerts */}
            {alerts.length > 0 && (
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            System Alerts
                        </CardTitle>
                        <CardDescription>
                            Recent system events and notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {alerts.map((alert) => (
                            <Alert key={alert.id} className={`border-l-4 ${alert.type === 'error' ? 'border-l-destructive bg-destructive/5' :
                                alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-500/5' :
                                    'border-l-blue-500 bg-blue-500/5'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {alert.type === 'error' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                                    {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                    {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                    <AlertDescription className="flex-1">
                                        {alert.message}
                                    </AlertDescription>
                                    <span className="text-xs text-muted-foreground">
                                        Block {alert.timestamp.toLocaleString()}
                                    </span>
                                </div>
                            </Alert>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Detailed Seed Status */}
            <Card className="glass-card-glow">
                <CardHeader>
                    <CardTitle className="text-gradient-secondary flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Seed Health Matrix
                    </CardTitle>
                    <CardDescription>
                        Individual seed status and health metrics for all 24 ring buffer slots
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {seeds.map((seed) => (
                            <Card key={seed.id} className={`glass-card interactive-card border-l-4 ${seed.health === 'excellent' ? 'border-l-green-500' :
                                seed.health === 'good' ? 'border-l-blue-500' :
                                    seed.health === 'warning' ? 'border-l-yellow-500' :
                                        'border-l-red-500'
                                }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-mono">Slot {seed.id}</span>
                                        <Badge className={`status-badge ${getHealthBadge(seed.health)}`}>
                                            {getHealthIcon(seed.health)}
                                            {seed.health}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span>Status</span>
                                            <span className={seed.isValid ? 'text-glow-green' : 'text-destructive'}>
                                                {seed.isValid ? 'Valid' : 'Invalid'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Age</span>
                                            <span className="font-mono">{seed.age} blocks</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Entropy</span>
                                            <span className="font-mono text-glow-cyan">{Math.round(seed.entropy / 1000)}K</span>
                                        </div>
                                    </div>

                                    {/* Age progress bar */}
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Age Progress</span>
                                            <span>{Math.round((seed.age / 1800) * 100)}%</span>
                                        </div>
                                        <Progress
                                            value={(seed.age / 1800) * 100}
                                            className="h-1"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* System Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Security Status
                        </CardTitle>
                        <CardDescription>
                            Cryptographic security and integrity monitoring
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Entropy Quality</span>
                                <Badge className="status-badge ready">
                                    <CheckCircle className="w-3 h-3" />
                                    Excellent
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Forward Secrecy</span>
                                <Badge className="status-badge ready">
                                    <Shield className="w-3 h-3" />
                                    Enabled
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Manipulation Resistance</span>
                                <Badge className="status-badge ready">
                                    <CheckCircle className="w-3 h-3" />
                                    Active
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">EIP-2935 Compliance</span>
                                <Badge className="status-badge revealed">
                                    <CheckCircle className="w-3 h-3" />
                                    Verified
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card interactive-card">
                    <CardHeader>
                        <CardTitle className="text-gradient-secondary flex items-center gap-2">
                            <RefreshCw className="w-5 h-5" />
                            Refresh Cycle
                        </CardTitle>
                        <CardDescription>
                            Automatic seed refresh and regeneration status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm">Next Refresh</span>
                                <span className="font-mono text-glow-cyan">{refreshCycle.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Blocks Remaining</span>
                                <span className="font-mono">{refreshCycle - currentBlock}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm">Estimated Time</span>
                                <span>{Math.round((refreshCycle - currentBlock) * 2 / 60)} minutes</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Cycle Progress</span>
                                <span>{Math.round(((currentBlock - (refreshCycle - 1800)) / 1800) * 100)}%</span>
                            </div>
                            <Progress
                                value={((currentBlock - (refreshCycle - 1800)) / 1800) * 100}
                                className="h-2"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 