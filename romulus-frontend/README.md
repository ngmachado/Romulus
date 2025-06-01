# Romulus V2 Frontend

A Next.js frontend application for interacting with the RomulusV2 randomness oracle on Base.

## 🚀 **What's New in V2**

### **Contract Upgrade**
- **New Address**: `0x3E0b9b582B715967Ec6Fff2ec2a954cFF7528Ea5` (Base Mainnet)
- **Span-Based Architecture**: Replace `revealBlock` + `hashCount` with user-defined `span`
- **Enhanced Security**: Fixed span starting immediately after request eliminates sequencer bias
- **Gas Optimization**: Predictable costs based on span size

### **V2 Features**
- **Flexible Spans**: Choose 8-4000 blocks based on security needs (default: 64)
- **Callback Gas Limits**: Configurable gas limits prevent griefing attacks  
- **Enhanced Entropy**: Every interaction contributes to system entropy
- **New Functions**: `getRevealTime()`, callback management, improved constants

## 🔧 **Key Interface Changes**

### **Request Function (V1 → V2)**
```typescript
// V1 (Old)
requestRandomNumber(revealBlock: number, data: string, hashCount: number)

// V2 (New)
requestRandomNumber(data: string, span: number)          // Custom span
requestRandomNumber(data: string)                        // Default 64-block span
```

### **Request Data Structure**
```typescript
// V1 Request
{
  clientContract: address,
  revealBlock: uint256,
  data: bytes,
  hashCount: uint256
}

// V2 Request  
{
  clientContract: address,
  startBlock: uint256,     // Always requestBlock + 1
  span: uint16,           // Number of blocks to use
  data: bytes
}
```

### **New V2 Constants**
- `DEFAULT_SPAN`: 64 blocks (~130 seconds)
- `MIN_SPAN`: 8 blocks minimum
- `MAX_SPAN`: 4000 blocks maximum  
- `GRACE`: 1 block wait after span completion
- `callbackGasLimit`: 50,000 gas (configurable)

## 🛠 **Development**

### **Setup**
```bash
npm install
# or
pnpm install
```

### **Run Development Server**
```bash
npm run dev
# or  
pnpm dev
```

### **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 📋 **Usage Examples**

### **Basic Randomness Request**
```typescript
import { useRequestRandomNumber } from '@/hooks/useRomulus'

// Use default 64-block span (recommended)
const { requestRandomNumberDefault } = useRequestRandomNumber()
requestRandomNumberDefault("my-game-round-123")

// Use custom span for specific security needs
const { requestRandomNumber } = useRequestRandomNumber()
requestRandomNumber("high-value-lottery", 128)  // Extra secure
```

### **Getting Reveal Timing**
```typescript
import { useGetRevealTime } from '@/hooks/useRomulus'

const { data: revealInfo } = useGetRevealTime(requestId)
// Returns: [canRevealAt: bigint, estimatedSeconds: bigint]
```

### **Real-time Contract Data**
```typescript
import { useRomulusData } from '@/hooks/useRomulus'

const {
  requestCounter,
  ringStatus,
  entropyStats,
  callbackGasLimit,
  constants: { defaultSpan, minSpan, maxSpan }
} = useRomulusData()
```

## 🔐 **Security Recommendations**

### **Span Selection Guide**
- **8-16 blocks**: Low-stakes gaming, UI randomness
- **32-64 blocks**: Standard applications (default)
- **128+ blocks**: High-value financial applications
- **Consider**: Higher spans = more security + longer wait times

### **Integration Best Practices**
- Implement `IRandomNumberConsumer` interface for callbacks
- Handle callback failures gracefully in your contract
- Monitor gas limits to prevent callback failures  
- Use `getRevealTime()` to estimate completion timing

## 📚 **Architecture**

### **Components**
- `ContractDataViewer`: Real-time V2 contract statistics
- `EntropyStats`: Visual entropy accumulation tracking
- `RandomnessDemo`: Interactive examples for both modes

### **Hooks**  
- `useRomulusData()`: Complete contract state
- `useRequestRandomNumber()`: V2 span-based requests
- `useGetRevealTime()`: Timing predictions
- `useSetCallbackGasLimit()`: Gas limit management

## 🌐 **Deployment**

The app is optimized for deployment on Vercel:

```bash
npm run build
```

## 📖 **Learn More**

- [RomulusV2 Documentation](../README.md)
- [Base Network](https://base.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Contract on Basescan](https://basescan.org/address/0x3E0b9b582B715967Ec6Fff2ec2a954cFF7528Ea5)
