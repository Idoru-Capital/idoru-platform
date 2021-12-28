// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./Constants.sol";

import "hardhat/console.sol";

/**
 * will be adding to default implementation a little
 * we need to implement special function to check
 * whether user has held the token for long enough
 */

abstract contract ERC20CVotes is AccessControl, ERC20Permit, ERC20Votes {
  using SafeMath for uint256;

  uint256 public minHoldingBlocks = 100_000;

  function changeMinHoldingBlocks(uint256 _minHoldingBlocks)
    public
    onlyRole(RoleNames.WIZARD)
  {
    require(_minHoldingBlocks > 0, "negative minHoldingBlocks");
    minHoldingBlocks = _minHoldingBlocks;
  }

  /**
   * confirm if user has enough buying power
   */
  function hasEnoughBuyingPower(address _addr, uint256 _amount)
    public
    view
    returns (bool)
  {
    require(numCheckpoints(_addr) > 0, "no checkpoints");

    uint256 startBlock = int256(block.number) - int256(minHoldingBlocks) > 0
      ? block.number - minHoldingBlocks
      : 0;

    require(getPastVotes(_addr, startBlock) > _amount, "Votes not enough"); // what error msg do we want here?

    for (uint32 i = numCheckpoints(_addr); i > startBlock; i--) {
      require(checkpoints(_addr, i - 1).votes > _amount, "Votes not enough");
      //minimum = uint256(Math.min(minimum, checkpoints(_addr, i).votes));
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
