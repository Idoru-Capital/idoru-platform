// SPDX-License-Identifier: MIT

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
abstract contract ERC20Balances is ERC20Permit {
  struct BalanceCheckpoint {
    uint256 fromBlock;
    uint256 balanceAfter;
  }

  mapping(address => BalanceCheckpoint[]) private _checkpoints;

  function getCheckPoints(address _from)
    public
    view
    returns (BalanceCheckpoint[] memory)
  {
    return _checkpoints[_from];
  }

  function _appendCheckpoint(address _from, uint256 _balanceAfter) private {
    // require(_from != address(0), "0 address");
    // require(_balanceAfter > 0, "Cannot append checkpoint with zero balance");

    _checkpoints[_from].push(
      BalanceCheckpoint({
        fromBlock: block.number,
        balanceAfter: _balanceAfter
      })
    );
  }

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    super._afterTokenTransfer(from, to, amount);

    // this implementation does not allow smart contracts!! (is this ok?)

    // @dev CAN YOU DO THIS???
    // if (_msgSender() == from) {
    _appendCheckpoint(from, balanceOf(from));
    _appendCheckpoint(to, balanceOf(to));
    // }
  }
}
