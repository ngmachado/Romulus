'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletConnect } from './WalletConnect'
import { InstantRandomDemo } from './InstantRandomDemo'
import { SeedGenerator } from './SeedGenerator'
import { ContractDataViewer } from './ContractDataViewer'
import { useRomulusData } from '@/hooks/useRomulus'
import { ROMULUS_ADDRESS } from '@/lib/contracts'
import { DocumentationViewer } from './DocumentationViewer'
// import { CommitRevealDemo } from './CommitRevealDemo'
// import { InstantRingDemo } from './InstantRingDemo'
// import { RingStatusMonitor } from './RingStatusMonitor'
// import { EntropyStats } from './EntropyStats'
import { Zap, Shield, Clock, Network, Cpu, Database, ExternalLink, RefreshCw, Activity, BookOpen } from 'lucide-react'

export function RomulusDemo() {
    const [activeTab, setActiveTab] = useState('overview')
    const {
        requestCounter,
        ringPosition,
        ringStatus,
        entropyStats,
        constants,
        isLoading
    } = useRomulusData()

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Powered by Base Network</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 text-gradient">
                        ROMULUS
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                        Next-generation randomness oracle delivering{' '}
                        <span className="text-accent font-semibold">cryptographically secure</span>{' '}
                        entropy for the decentralized future
                    </p>

                    {/* Feature badges */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        <div className="badge badge-success">
                            <Shield className="w-3 h-3" />
                            Cryptographically Secure
                        </div>
                        <div className="badge badge-warning">
                            <Clock className="w-3 h-3" />
                            Sub-2s Block Time
                        </div>
                        <div className="badge badge-info">
                            <Network className="w-3 h-3" />
                            EIP-2935 Compliant
                        </div>
                    </div>
                </div>

                {/* Main Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="tab-list grid w-full grid-cols-2 md:grid-cols-8 mb-8">
                        <TabsTrigger value="overview" className="tab-trigger">
                            <Database className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="documentation" className="tab-trigger">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Docs
                        </TabsTrigger>
                        <TabsTrigger value="live-data" className="tab-trigger">
                            <Activity className="w-4 h-4 mr-2" />
                            Live Data
                        </TabsTrigger>
                        <TabsTrigger value="commit-reveal" className="tab-trigger">
                            <Shield className="w-4 h-4 mr-2" />
                            Commit-Reveal
                        </TabsTrigger>
                        <TabsTrigger value="instant-ring" className="tab-trigger">
                            <Zap className="w-4 h-4 mr-2" />
                            Instant Ring
                        </TabsTrigger>
                        <TabsTrigger value="seed-generator" className="tab-trigger">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Seed Generator
                        </TabsTrigger>
                        <TabsTrigger value="ring-status" className="tab-trigger">
                            <Cpu className="w-4 h-4 mr-2" />
                            Ring Status
                        </TabsTrigger>
                        <TabsTrigger value="entropy" className="tab-trigger">
                            <Network className="w-4 h-4 mr-2" />
                            Entropy
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8">
                        {/* Wallet Connection */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                {/* Contract Info */}
                                <Card className="glass-card-glow mb-8">
                                    <CardHeader>
                                        <CardTitle className="text-gradient-primary flex items-center gap-2">
                                            <Database className="w-5 h-5" />
                                            Live Contract Data
                                        </CardTitle>
                                        <CardDescription>
                                            Real-time data from deployed Romulus contract
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                                                    {isLoading ? '...' : ringStatus?.[0]?.toString() || '0'}
                                                </div>
                                                <div className="metric-label">Valid Seeds</div>
                                            </div>
                                            <div className="metric-card">
                                                <div className="metric-value text-glow-pink">
                                                    {isLoading ? '...' : entropyStats?.[0]?.toString() || '0'}
                                                </div>
                                                <div className="metric-label">Entropy Count</div>
                                            </div>
                                        </div>

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
                            </div>

                            <div>
                                <WalletConnect />
                            </div>
                        </div>

                        {/* Architecture Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="card hover:border-primary/30 transition-all duration-200">
                                <CardHeader className="card-header">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary">
                                            <Shield className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="card-title text-gradient">Commit-Reveal Mode</CardTitle>
                                            <CardDescription className="card-description">Maximum security randomness generation</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="card-content space-y-4">
                                    <p className="text-muted-foreground">
                                        Two-phase process using future block hashes for unbiased, tamper-proof randomness.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-success" />
                                            <span className="text-sm">1-1000 consecutive blocks</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-success" />
                                            <span className="text-sm">Forward secrecy guaranteed</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-success" />
                                            <span className="text-sm">Non-manipulable entropy</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="card hover:border-primary/30 transition-all duration-200">
                                <CardHeader className="card-header">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-accent">
                                            <Zap className="w-6 h-6 text-accent-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="card-title text-gradient">Instant Ring Mode</CardTitle>
                                            <CardDescription className="card-description">High-speed randomness for real-time applications</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="card-content space-y-4">
                                    <p className="text-muted-foreground">
                                        Pre-generated 24-slot ring buffer with automatic seed refresh every ~1 hour.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-accent" />
                                            <span className="text-sm">24 pre-computed seeds</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-accent" />
                                            <span className="text-sm">1800 block refresh cycle</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-accent" />
                                            <span className="text-sm">Instant availability</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="metric-card">
                                <div className="metric-value text-glow-cyan">2s</div>
                                <div className="metric-label">Block Time</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value text-glow-purple">8,191</div>
                                <div className="metric-label">Block History</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value text-glow-green">
                                    {isLoading ? '...' : constants?.ringSize?.toString() || '24'}
                                </div>
                                <div className="metric-label">Ring Slots</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-value text-glow-pink">
                                    {isLoading ? '...' : constants?.seedRefreshInterval?.toString() || '1800'}
                                </div>
                                <div className="metric-label">Refresh Blocks</div>
                            </div>
                        </div>

                        {/* Technical Specifications */}
                        <Card className="card">
                            <CardHeader className="card-header">
                                <CardTitle className="card-title text-gradient flex items-center gap-3">
                                    <Network className="w-6 h-6" />
                                    Technical Specifications
                                </CardTitle>
                                <CardDescription className="card-description">
                                    Built for Base network with EIP-2935 compliance and optimized entropy accumulation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="card-content">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-accent">Entropy Sources</h4>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Block Timestamps</span>
                                                <div className="badge badge-success">Active</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Block Difficulty</span>
                                                <div className="badge badge-success">Active</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Gas Limit</span>
                                                <div className="badge badge-success">Active</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Block Hashes</span>
                                                <div className="badge badge-success">Active</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-accent">Security Features</h4>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Multi-block Entropy</span>
                                                <div className="badge badge-success">Enabled</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Forward Secrecy</span>
                                                <div className="badge badge-success">Enabled</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Manipulation Resistance</span>
                                                <div className="badge badge-success">Enabled</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>EIP-2935 Compliance</span>
                                                <div className="badge badge-success">Verified</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documentation">
                        <DocumentationViewer />
                    </TabsContent>

                    <TabsContent value="live-data">
                        <ContractDataViewer />
                    </TabsContent>

                    <TabsContent value="commit-reveal">
                        <Card className="card">
                            <CardHeader className="card-header">
                                <CardTitle className="card-title">Commit-Reveal Demo</CardTitle>
                                <CardDescription className="card-description">Interactive demonstration of the commit-reveal process</CardDescription>
                            </CardHeader>
                            <CardContent className="card-content">
                                <p className="text-muted-foreground">Coming soon - Interactive commit-reveal demonstration</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="instant-ring">
                        <InstantRandomDemo />
                    </TabsContent>

                    <TabsContent value="seed-generator">
                        <SeedGenerator />
                    </TabsContent>

                    <TabsContent value="ring-status">
                        <Card className="card">
                            <CardHeader className="card-header">
                                <CardTitle className="card-title">Ring Status Monitor</CardTitle>
                                <CardDescription className="card-description">24-slot health monitoring with alerts</CardDescription>
                            </CardHeader>
                            <CardContent className="card-content">
                                <p className="text-muted-foreground">Coming soon - Real-time ring status monitoring</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="entropy">
                        <Card className="card">
                            <CardHeader className="card-header">
                                <CardTitle className="card-title">Entropy Statistics</CardTitle>
                                <CardDescription className="card-description">Blockchain state and entropy accumulation tracking</CardDescription>
                            </CardHeader>
                            <CardContent className="card-content">
                                <p className="text-muted-foreground">Coming soon - Entropy statistics and blockchain metrics</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
} 