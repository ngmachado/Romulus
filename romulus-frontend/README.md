# 🏛️ Romulus Frontend

A beautiful, modern frontend to showcase the Romulus randomness oracle in action. Built with Next.js, TypeScript, and Tailwind CSS.

## Overview

Romulus is a dual randomness oracle tailored for the Base network, offering two distinct modes:

- **Commit-Reveal Mode**: High-security, two-transaction process for critical applications
- **Instant Ring Mode**: Fast pre-generated randomness system for less critical needs

This frontend provides an interactive demonstration of both modes with real-time monitoring capabilities.

## Features

### 🎯 Interactive Demos
- **Commit-Reveal Demo**: Simulate the two-phase randomness generation process
- **Instant Ring Demo**: Experience immediate randomness from the ring buffer
- **Ring Status Monitor**: Real-time health monitoring of the 24-slot ring buffer
- **Entropy Stats**: Track entropy accumulation and blockchain state

### 🎨 Modern Design
- **Glass Morphism**: Beautiful translucent cards with backdrop blur
- **Gradient Backgrounds**: Soft, refreshing color schemes
- **Responsive Layout**: Mobile-first design optimized for all devices
- **Micro-interactions**: Smooth animations and transitions

### 📊 Real-time Monitoring
- Ring buffer health visualization
- Entropy accumulation tracking
- Blockchain state monitoring
- Security feature explanations

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Custom CSS animations

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd romulus-frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and custom CSS
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── romulus-demo.tsx     # Main demo component
│   ├── commit-reveal-demo.tsx # Commit-reveal interface
│   ├── instant-ring-demo.tsx  # Instant ring interface
│   ├── ring-status-monitor.tsx # Ring buffer monitoring
│   └── entropy-stats.tsx    # Entropy statistics
└── lib/
    └── utils.ts             # Utility functions
```

## Components Overview

### RomulusDemo
Main component that orchestrates the entire demo experience with tabbed navigation.

### CommitRevealDemo
Interactive simulation of the commit-reveal process:
- Request form with validation
- Progress tracking
- Reveal functionality
- Security feature explanations

### InstantRingDemo
Real-time instant randomness generation:
- One-click random number generation
- Ring buffer visualization
- Usage tracking
- Performance metrics

### RingStatusMonitor
Comprehensive monitoring dashboard:
- 24-slot ring buffer health
- Individual seed status
- Health alerts and warnings
- Technical specifications

### EntropyStats
Entropy accumulation tracking:
- Real-time entropy statistics
- Blockchain state monitoring
- Security guarantees
- Non-manipulable source verification

## Design System

### Colors
- **Primary**: Blue to Indigo gradient
- **Secondary**: Green to Blue gradient  
- **Accent**: Purple to Orange gradient
- **Status Colors**: Green (success), Yellow (warning), Red (error)

### Typography
- **Headings**: Bold, gradient text effects
- **Body**: Clean, readable sans-serif
- **Code**: Monospace for hashes and technical data

### Layout
- **Mobile-first**: 375px base width
- **Responsive breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px
- **Container**: Max-width 1280px with proper padding

## Key Features Demonstrated

### Security Features
- Future block hash unpredictability
- Multi-block entropy combination
- Forward secrecy in ring buffer
- Non-replayable random numbers

### Base Network Optimization
- EIP-2935 compliance (8,191 block history)
- 2-second block time considerations
- Gas efficiency optimizations
- 4.5-hour history window management

### Entropy Sources
- Block timestamps (network consensus)
- Block difficulty/prevrandao (PoS beacon)
- Previous block hashes (immutable)
- Gas remaining (execution context)

## Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Adding Components
Use shadcn/ui CLI to add new components:
```bash
npx shadcn@latest add [component-name]
```

### Customization
- Modify `src/app/globals.css` for global styles
- Update color variables in CSS custom properties
- Extend Tailwind config for additional utilities

## Performance

- **Bundle Size**: Optimized for < 200KB initial JS payload
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Image Optimization**: Next.js Image component with proper sizing
- **Code Splitting**: Automatic route-based splitting

## Accessibility

- **WCAG 2.1 AA**: Full compliance
- **Color Contrast**: 4.5:1 minimum for normal text
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Readers**: Proper ARIA attributes and semantic HTML

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Related

- [Romulus Smart Contract](../src/Romulus.sol) - The core randomness oracle
- [Base Network Documentation](https://docs.base.org/) - Base blockchain details
- [EIP-2935](https://eips.ethereum.org/EIPS/eip-2935) - Block hash history specification
