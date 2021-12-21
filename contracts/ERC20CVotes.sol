// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./Constants.sol";

/**
 * will be adding to default implementation a little
 * we need to implement special function to check
 * whether user has held the token for long enough
 */

abstract contract ERC20CVotes is AccessControl, ERC20Permit, ERC20Votes {
  uint32 public minHoldingBlocks = 100_000;

  function changeMinHoldingBlocks(uint32 _minHoldingBlocks)
    public
    onlyRole(RoleNames.WIZARD)
  {
    minHoldingBlocks = _minHoldingBlocks;
  }

  /**
   * loop all checkpoints and check if user has held the enought token for long enough

   * what we do is just check minimum in last `minHoldingBlocks` blocks
   */
  function minHolding(address _addr) private view returns (uint224) {
    require(numCheckpoints(_addr) > 0, "no checkpoints");

    uint224 minimum = checkpoints(_addr, numCheckpoints(_addr) - 1).votes;

    if (
      checkpoints(_addr, numCheckpoints(_addr) - 1).fromBlock <=
      block.number - minHoldingBlocks
    ) {
      return minimum;
    }

    for (
      uint32 i = uint32(getPastVotes(_addr, block.number - minHoldingBlocks));
      i < numCheckpoints(_addr);
      i++
    ) {
      minimum = uint224(Math.min(minimum, checkpoints(_addr, i).votes));
    }

    return minimum;
  }

  /**
   * confirm if user has enough buying power
   */
  function hasEnoughBuyingPower(address _addr, uint256 _amount)
    public
    view
    returns (bool)
  {
    // require(minHolding(_addr) >= _amount, "did not hold enough");
    if (minHolding(_addr) < _amount) {
      return false;
    }
    return true;
  }

  // The following functions are overrides required by Solidity.
  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override(ERC20, ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }

  function _mint(address to, uint256 amount)
    internal
    virtual
    override(ERC20, ERC20Votes)
  {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount)
    internal
    virtual
    override(ERC20, ERC20Votes)
  {
    super._burn(account, amount);
  }
}
