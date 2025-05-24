export const RICHEE_CONTRACT_ADDRESS =
  "0x32dbcc4199a98811602b69f9fa1e5c3c9ca73d8e"; // Replace with actual contract address

export const RICHEE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_alice", type: "address" },
      { internalType: "address", name: "_bob", type: "address" },
      { internalType: "address", name: "_eve", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "AlreadyProcessed", type: "error" },
  { inputs: [], name: "DuplicateSubmission", type: "error" },
  { inputs: [], name: "IncompleteSubmissions", type: "error" },
  { inputs: [], name: "InvalidParticipant", type: "error" },
  { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "euint256",
        name: "encryptedAddress",
        type: "bytes32",
      },
    ],
    name: "EncryptedRichestAddress",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "WealthSubmitted",
    type: "event",
  },
  {
    inputs: [],
    name: "alice",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "allSubmitted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bob",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eve",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSubmissionCount",
    outputs: [{ internalType: "uint256", name: "count", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "hasSubmitted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isFinalized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startComparison",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "encryptedValue", type: "bytes" }],
    name: "submit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
