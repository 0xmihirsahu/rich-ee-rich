# Richee Rich - Millionaire's Dilemma on Inco

A decentralized application that allows participants to privately compare their wealth using Inco's Lightning encrypted types. The application ensures that individual wealth values remain private while still determining who is the richest participant.

## Overview

Richee Rich implements the Millionaire's Dilemma problem using Inco's Lightning encrypted types. It allows three participants (Alice, Bob, and Eve) to submit their encrypted wealth values and then determines who is the richest without revealing individual amounts.

### Key Features

- Private wealth submission using encrypted values
- Secure comparison of encrypted wealth values
- Decentralized architecture using smart contracts
- Modern web interface with real-time updates
- Support for Base Sepolia testnet

## Architecture

### 1. Smart Contract (`contract/`)

The Solidity smart contract implements a private wealth comparison system using Inco's Lightning encrypted types.

#### Contract Structure

```solidity
contract Richee {
    // Immutable participant addresses
    address public immutable alice;
    address public immutable bob;
    address public immutable eve;

    // Stores encrypted wealth values using Inco's encrypted uint256 type
    mapping(address => euint256) private encryptedWealth;

    // Tracks submission status
    mapping(address => bool) public hasSubmitted;
    bool private resultPosted;

    // Events
    event WealthSubmitted(address indexed sender);
    event EncryptedRichestAddress(euint256 encryptedAddress);
}
```

### 2. Web Application (`nextjs/`)

A Next.js application that provides the user interface and handles blockchain interactions.

#### Key Components

1. **RichestReveal Component**
   - Handles wealth submission
   - Manages comparison process
   - Displays results
   - Manages loading states

2. **Providers**
   - Web3Provider: Handles blockchain interactions
   - BalanceProvider: Manages user balances

3. **Utils**
   - Contract configurations
   - Helper functions
   - Type definitions

## ⚙️ Application Flow
![image](https://github.com/user-attachments/assets/50106512-35fe-4722-ab56-8956f0ee8db9)


### 1. Initial Setup
```solidity
constructor(address _alice, address _bob, address _eve) {
    require(_alice != address(0) && _bob != address(0) && _eve != address(0));
    require(_alice != _bob && _alice != _eve && _bob != _eve);
    alice = _alice;
    bob = _bob;
    eve = _eve;
}
```
- Deploy contract with three participant addresses
- Configure environment variables
- Set up frontend application

### 2. Wealth Submission
```javascript
// Frontend: Encrypt wealth
const amount = parseEther("100");
const encryptedAmount = await incoConfig.encrypt(amount, {
    accountAddress: userAddress,
    dappAddress: contractAddress,
});

// Contract: Store encrypted value
function submit(bytes calldata encryptedValue) external {
    if (msg.sender != alice && msg.sender != bob && msg.sender != eve) {
        revert InvalidParticipant();
    }
    euint256 value = e.newEuint256(encryptedValue, msg.sender);
    e.allow(value, address(this));
    encryptedWealth[msg.sender] = value;
    hasSubmitted[msg.sender] = true;
}
```

### 3. Comparison and Result
```solidity
function startComparison() external {
    // Validate and prepare
    if (!hasSubmitted[alice] || !hasSubmitted[bob] || !hasSubmitted[eve]) {
        revert IncompleteSubmissions();
    }
    
    // Convert addresses to encrypted values
    euint256 addr1 = e.asEuint256(uint256(uint160(alice)));
    euint256 addr2 = e.asEuint256(uint256(uint160(bob)));
    euint256 addr3 = e.asEuint256(uint256(uint160(eve)));

    // Perform encrypted comparisons
    euint256 highest = encryptedWealth[alice];
    euint256 richest = addr1;

    ebool b2 = e.ge(encryptedWealth[bob], highest);
    highest = e.select(b2, encryptedWealth[bob], highest);
    richest = e.select(b2, addr2, richest);

    ebool b3 = e.ge(encryptedWealth[eve], highest);
    highest = e.select(b3, encryptedWealth[eve], highest);
    richest = e.select(b3, addr3, richest);

    // Allow decryption and emit result
    e.allow(richest, alice);
    e.allow(richest, bob);
    e.allow(richest, eve);
    emit EncryptedRichestAddress(richest);
}
```

### 4. Result Decryption
```javascript
// Frontend: Decrypt and display result
const encryptedRichest = event.args.encryptedAddress;
const reencryptor = await incoConfig.getReencryptor(walletClient);
const decryptedRichest = await reencryptor({handle: encryptedRichest});
const richestAddress = getAddress('0x' + decryptedRichest.value.toString(16).padStart(40, '0'));
```

## Privacy and Security

### Privacy Guarantees
- Individual wealth values remain encrypted
- Comparisons happen in encrypted form
- Only the richest address is revealed
- No information about relative wealth is leaked
- Only participants can decrypt the result

### Security Measures
- Reentrancy protection
- Participant validation
- Submission tracking
- Result finalization check
- Access control for decryption

## Setup and Usage

### Prerequisites
- Node.js (v16 or higher)
- pnpm
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH

### Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd inco

# Install contract dependencies
cd contract
pnpm install

# Install web application dependencies
cd ../nextjs
pnpm install
```

### Configuration
```bash
# In nextjs directory
cp .env.example .env.local

# Update environment variables
NEXT_PUBLIC_RICHEE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://...
```

### Running the Application
```bash
# Run tests
cd contract
pnpm hardhat test --network baseSepolia

# Run web application
cd ../nextjs
pnpm dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inco Network for providing the Lightning encrypted types
- Base Sepolia testnet for deployment
- OpenZeppelin for security patterns
