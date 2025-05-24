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

The application consists of two main components:

### 1. Smart Contract (`contract/`)

The Solidity smart contract implements a private wealth comparison system using Inco's Lightning encrypted types. The contract ensures complete privacy of individual wealth values while still allowing comparison.

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

#### Privacy Mechanisms

1. **Encrypted Storage**
   - Wealth values are stored as `euint256` (encrypted uint256)
   - Only the contract and the submitting participant can access the encrypted value
   - Values remain encrypted during all operations

2. **Access Control**
   - Only registered participants can submit values
   - Each participant can only submit once
   - Results are only decryptable by participants

#### Key Functions

1. **submit(bytes calldata encryptedValue)**
   ```solidity
   function submit(bytes calldata encryptedValue) external nonReentrant {
       // Validate participant
       if (msg.sender != alice && msg.sender != bob && msg.sender != eve) {
           revert InvalidParticipant();
       }

       // Prevent double submission
       if (hasSubmitted[msg.sender]) {
           revert DuplicateSubmission();
       }

       // Register and authorize encrypted value
       euint256 value = e.newEuint256(encryptedValue, msg.sender);
       e.allow(value, address(this));
       encryptedWealth[msg.sender] = value;
       hasSubmitted[msg.sender] = true;

       emit WealthSubmitted(msg.sender);
   }
   ```
   - Takes an encrypted value from the participant
   - Validates the sender is a registered participant
   - Prevents double submission
   - Stores the encrypted value with proper authorization
   - Emits event for tracking

2. **startComparison()**
   ```solidity
   function startComparison() external nonReentrant {
       // Validate state
       if (resultPosted) revert AlreadyProcessed();
       if (!hasSubmitted[alice] || !hasSubmitted[bob] || !hasSubmitted[eve]) {
           revert IncompleteSubmissions();
       }

       // Convert addresses to encrypted values
       euint256 addr1 = e.asEuint256(uint256(uint160(alice)));
       euint256 addr2 = e.asEuint256(uint256(uint160(bob)));
       euint256 addr3 = e.asEuint256(uint256(uint160(eve)));

       // Initialize comparison
       euint256 highest = encryptedWealth[alice];
       euint256 richest = addr1;

       // Compare Bob's wealth
       ebool b2 = e.ge(encryptedWealth[bob], highest);
       highest = e.select(b2, encryptedWealth[bob], highest);
       richest = e.select(b2, addr2, richest);

       // Compare Eve's wealth
       ebool b3 = e.ge(encryptedWealth[eve], highest);
       highest = e.select(b3, encryptedWealth[eve], highest);
       richest = e.select(b3, addr3, richest);

       // Allow decryption by participants
       e.allow(richest, alice);
       e.allow(richest, bob);
       e.allow(richest, eve);

       // Emit encrypted result
       emit EncryptedRichestAddress(richest);
       resultPosted = true;
   }
   ```
   - Validates all participants have submitted
   - Performs encrypted comparisons using Inco's Lightning
   - Uses `e.ge()` for encrypted greater-than-or-equal comparison
   - Uses `e.select()` for encrypted conditional selection
   - Emits the encrypted richest address
   - Sets result as finalized

#### Privacy Guarantees

1. **Value Privacy**
   - Individual wealth values are never revealed
   - Comparisons happen in encrypted form
   - Only the final result (richest address) is decryptable

2. **Comparison Privacy**
   - All comparisons use encrypted operations
   - Intermediate values remain encrypted
   - No information about relative wealth is leaked

3. **Result Privacy**
   - Only the richest address is revealed
   - Only to the participants
   - No information about other participants' wealth is disclosed

4. **Technical Privacy**
   - Uses Inco's Lightning for encrypted operations
   - Implements reentrancy protection
   - Validates all inputs and states
   - Prevents unauthorized access

### 2. Web Application (`nextjs/`)

A Next.js application that provides:
- User interface for wealth submission
- Real-time status updates
- Richest participant reveal
- Wallet integration

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

## Detailed Application Flow

### 1. Initial Setup

1. Contract Deployment
   ```bash
   # Deploy contract with three participant addresses
   npx hardhat run scripts/deploy.js --network baseSepolia
   ```

2. Environment Configuration
   ```bash
   # Set contract address and RPC URL
   NEXT_PUBLIC_RICHEE_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://...
   ```

### 2. Wealth Submission Process

1. **User Connection**
   - User connects wallet
   - System validates participant status
   - Displays submission interface

2. **Wealth Encryption**
   ```javascript
   // Using Inco's Lightning
   const encryptedAmount = await incoConfig.encrypt(amount, {
     accountAddress: userAddress,
     dappAddress: contractAddress,
   });
   ```

3. **Submission**
   ```javascript
   // Submit encrypted value
   const tx = await writeContract({
     address: RICHEE_CONTRACT_ADDRESS,
     abi: RICHEE_ABI,
     functionName: "submit",
     args: [encryptedAmount],
   });
   ```

### 3. Comparison and Result

1. **Starting Comparison**
   ```javascript
   // Check if all submitted
   const allSubmitted = await contract.read.allSubmitted();
   
   // Start comparison if ready
   if (allSubmitted) {
     await contract.write.startComparison();
   }
   ```

2. **Result Decryption**
   ```javascript
   // Get encrypted result from event
   const encryptedRichest = event.args.encryptedAddress;
   
   // Decrypt using reencryptor
   const reencryptor = await incoConfig.getReencryptor(walletClient);
   const decryptedRichest = await reencryptor({handle: encryptedRichest});
   
   // Convert to address
   const richestAddress = getAddress('0x' + decryptedRichest.value.toString(16).padStart(40, '0'));
   ```

## Technical Implementation Details

### Encryption Process

1. **Wealth Value Encryption**
   - Convert amount to wei
   - Encrypt using Inco's Lightning
   - Submit to contract

2. **Contract-side Comparison**
   - Convert addresses to euint256
   - Compare encrypted values
   - Select richest address
   - Encrypt result

3. **Result Decryption**
   - Get encrypted address from event
   - Use reencryptor to decrypt
   - Convert to Ethereum address
   - Display result

### Security Measures

1. **Contract Security**
   - ReentrancyGuard implementation
   - Participant validation
   - Submission tracking
   - Result finalization check

2. **Encryption Security**
   - Secure key management
   - Access control for decryption
   - Event validation
   - Error handling

## Prerequisites

- Node.js (v16 or higher)
- pnpm
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd inco
```

2. Install dependencies:
```bash
# Install contract dependencies
cd contract
pnpm install

# Install web application dependencies
cd ../nextjs
pnpm install
```

## Configuration

1. Set up environment variables:
```bash
# In nextjs directory
cp .env.example .env.local
```

2. Update the following variables in `.env.local`:
- `NEXT_PUBLIC_RICHEE_CONTRACT_ADDRESS`: Your deployed contract address
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC URL

## Usage

### Running Tests

```bash
cd contract
pnpm hardhat test --network baseSepolia
```

### Running the Web Application

```bash
cd nextjs
pnpm dev
```

Visit `http://localhost:3000` to access the application.

### Using the Application

1. Connect your wallet (must be one of the registered participants)
2. Submit your encrypted wealth value
3. Wait for all participants to submit
4. Click "Reveal Richest" to determine the richest participant
5. View the result in the modal

## Troubleshooting

### Common Issues

1. **Transaction Failures**
   - Check wallet connection
   - Verify sufficient gas
   - Ensure correct network

2. **Decryption Errors**
   - Verify participant status
   - Check event logs
   - Validate encryption process

3. **UI Issues**
   - Clear browser cache
   - Check console for errors
   - Verify environment variables

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