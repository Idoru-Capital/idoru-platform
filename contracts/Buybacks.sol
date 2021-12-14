// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC20/extensions/ERC20Votes.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "hardhat/console.sol";

/**
 * Contract to makecheckpoints for transfers
 * goal is to track whether a person can sell tokens
 * with guaranteed buybacks
 */
abstract contract ERC20Buybacks is ERC20Permit {
  struct TransferCheckpoint {
    uint32 fromBlock;
    uint224 balanceAfter;
  }

  mapping(address => TransferCheckpoint[]) private _checkpoints;
  TransferCheckpoint[] private _totalSupplyCheckpoints;

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    super._afterTokenTransfer(from, to, amount);

    console.log("Tokens transfered from, writing checkpoint");
    // _moveVotingPower(delegates(from), delegates(to), amount);
  }
}
