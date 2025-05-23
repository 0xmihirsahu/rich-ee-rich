// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { e, euint256, ebool } from "@inco/lightning/src/Lib.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Richee - Millionaire's Dilemma using Inco's Lightning encrypted types
/// @notice This contract allows three participants to privately submit their wealth,
///         and then determines who is the richest without revealing individual values.
/// @dev Relies on Inco's TEE to perform encrypted comparisons and decryption.

contract Richee is ReentrancyGuard {
    // Immutable participant addresses
    address public immutable alice;
    address public immutable bob;
    address public immutable eve;

    // Stores encrypted wealth values
    mapping(address => euint256) private encryptedWealth;

    // Tracks submission status per participant
    mapping(address => bool) public hasSubmitted;

    // Flag to prevent re-computation of the result
    bool private resultPosted;

    /// @notice Emitted when a participant submits their encrypted wealth
    event WealthSubmitted(address indexed sender);

    /// @notice Emitted when the richest participant is revealed
    event RichestFound(address indexed richest);

    /// @dev Errors for common failure scenarios
    error InvalidParticipant();
    error DuplicateSubmission();
    error IncompleteSubmissions();
    error AlreadyProcessed();
    error InvalidDecryptionResult();

    /// @param _alice Address of first participant
    /// @param _bob Address of second participant
    /// @param _eve Address of third participant
    constructor(address _alice, address _bob, address _eve) {
        require(_alice != address(0) && _bob != address(0) && _eve != address(0), "Dead address not allowed");
        require(_alice != _bob && _alice != _eve && _bob != _eve, "Participants must be unique");

        alice = _alice;
        bob = _bob;
        eve = _eve;
    }

    /// @notice Submit encrypted wealth value
    /// @param encryptedValue The encrypted euint256 representing sender's wealth
    function submit(bytes calldata encryptedValue) external nonReentrant {
        // Allow only registered participants
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

    /// @notice Starts the encrypted comparison to determine the richest participant
    function startComparison() external nonReentrant {
        if (resultPosted) revert AlreadyProcessed();
        if (!hasSubmitted[alice] || !hasSubmitted[bob] || !hasSubmitted[eve]) {
            revert IncompleteSubmissions();
        }

        // Encode participant indices (0 = alice, 1 = bob, 2 = eve)
        euint256 idx1 = e.asEuint256(0);
        euint256 idx2 = e.asEuint256(1);
        euint256 idx3 = e.asEuint256(2);

        // Initialize highest wealth and richest index
        euint256 highest = encryptedWealth[alice];
        euint256 richestIdx = idx1;

        // Compare Bob's wealth
        ebool b2 = e.ge(encryptedWealth[bob], highest);
        highest = e.select(b2, encryptedWealth[bob], highest);
        richestIdx = e.select(b2, idx2, richestIdx);

        // Compare Eve's wealth
        ebool b3 = e.ge(encryptedWealth[eve], highest);
        highest = e.select(b3, encryptedWealth[eve], highest);
        richestIdx = e.select(b3, idx3, richestIdx);

        // Authorize and request decryption of final result
        e.allow(richestIdx, address(this));
        e.requestDecryption(richestIdx, this._revealRichest.selector, "");
    }

    /// @notice Callback from Inco TEE to finalize the richest
    /// @param /* id */ unused ID field
    /// @param decrypted The index of the richest participant (0 = alice, 1 = bob, 2 = eve)
    /// @param /* metadata */ unused
    function _revealRichest(uint256, uint256 decrypted, bytes calldata) external returns (bool) {
        if (resultPosted) return true;
        if (decrypted > 2) revert InvalidDecryptionResult();

        // Resolve richest address from index
        address richest = decrypted == 0 ? alice : (decrypted == 1 ? bob : eve);

        resultPosted = true;
        emit RichestFound(richest);
        return true;
    }

    /// @notice Returns the number of participants who have submitted their wealth
    function getSubmissionCount() external view returns (uint256 count) {
        if (hasSubmitted[alice]) count++;
        if (hasSubmitted[bob]) count++;
        if (hasSubmitted[eve]) count++;
        return count;
    }

    /// @notice Checks if all participants have submitted
    function allSubmitted() external view returns (bool) {
        return hasSubmitted[alice] && hasSubmitted[bob] && hasSubmitted[eve];
    }

    /// @notice Returns whether the richest has been finalized
    function isFinalized() external view returns (bool) {
        return resultPosted;
    }
}