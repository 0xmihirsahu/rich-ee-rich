// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { e, euint256, ebool } from "@inco/lightning/src/Lib.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MillionairesDilemma is ReentrancyGuard {

    mapping(address => euint256) private balances;
    mapping(address => bool) public hasSubmitted;

    address public alice;
    address public bob;
    address public eve;

    event Submitted(address indexed user);
    event RichestDetermined(ebool isAlice, ebool isBob, ebool isEve);

    error AlreadySubmitted();
    error InvalidSender();
    error NotAllSubmitted();

    constructor(address _alice, address _bob, address _eve) {
        alice = _alice;
        bob = _bob;
        eve = _eve;
    }

    /// @notice Users privately submit encrypted balances
    function submitEncryptedBalance(bytes calldata encryptedAmount) external nonReentrant {
        if (
            msg.sender != alice &&
            msg.sender != bob &&
            msg.sender != eve
        ) revert InvalidSender();

        if (hasSubmitted[msg.sender]) revert AlreadySubmitted();

        euint256 amount = e.newEuint256(encryptedAmount, msg.sender);

        balances[msg.sender] = amount;
        hasSubmitted[msg.sender] = true;

        emit Submitted(msg.sender);
    }

    /// @notice Compares encrypted balances and emits who is richest
    function determineRichest() external {
        if (!hasSubmitted[alice] || !hasSubmitted[bob] || !hasSubmitted[eve]) {
            revert NotAllSubmitted();
        }

        euint256 abMax = e.max(balances[alice], balances[bob]);
        euint256 finalMax = e.max(abMax, balances[eve]);

        ebool isAlice = e.eq(finalMax,balances[alice]);
        ebool isBob = e.eq(finalMax,balances[bob]);
        ebool isEve = e.eq(finalMax,balances[eve]);

        e.allow(isAlice, msg.sender);
        e.allow(isBob, msg.sender);
        e.allow(isEve, msg.sender);

        emit RichestDetermined(isAlice, isBob, isEve);
    }
}