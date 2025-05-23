export const RICHEE_CONTRACT_ADDRESS = "0x3bc7fa299905dbd59b06193d33f819f2a1e6da1c"; // Replace with actual contract address

export const RICHEE_ABI = [
  {
    inputs: [
      { type: "address", name: "_alice", internalType: "address" },
      { type: "address", name: "_bob", internalType: "address" },
      { type: "address", name: "_eve", internalType: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InvalidParticipant",
    type: "error",
  },
  {
    inputs: [],
    name: "DuplicateSubmission",
    type: "error",
  },
  {
    inputs: [],
    name: "IncompleteSubmissions",
    type: "error",
  },
  {
    inputs: [],
    name: "AlreadyProcessed",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDecryptionResult",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "sender",
        type: "address",
      },
    ],
    name: "WealthSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "richest",
        type: "address",
      },
    ],
    name: "RichestFound",
    type: "event",
  },
  {
    inputs: [],
    name: "alice",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "allSubmitted",
    outputs: [{ type: "bool", name: "", internalType: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bob",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eve",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSubmissionCount",
    outputs: [{ type: "uint256", name: "count", internalType: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isFinalized",
    outputs: [{ type: "bool", name: "", internalType: "bool" }],
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
    inputs: [{ type: "bytes", name: "encryptedValue", internalType: "bytes" }],
    name: "submit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]; 