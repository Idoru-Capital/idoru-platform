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

  address[] private delegateAddresses;
  uint256 private minHoldingBlocks = 100_000;

  // to handle floats
  uint256 internal constant POINTSMULTIPLIER = 2**128; // optimization, see https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728

  function changeMinHoldingBlocks(uint256 _minHoldingBlocks)
    public
    onlyRole(RoleNames.WIZARD)
  {
    require(_minHoldingBlocks > 0, "negative minHoldingBlocks");
    minHoldingBlocks = _minHoldingBlocks;
  }

  /**
   * @dev Get all delegate addresses
   */
  function getDelegateAddresses() public view returns (address[] memory) {
    return delegateAddresses;
  }

  /**
   * @dev Go throught all delegate addresses and get their calculated dividends
   */
  function getDelegateDividendsAmounts(uint256 dividendAmount)
    public
    view
    returns (uint256[] memory)
  {
    uint256 dividendPerHoldingValue = dividendsPerHoldingValue(dividendAmount);

    // loop through all delegate addresses
    uint256[] memory dividends = new uint256[](delegateAddresses.length);
    for (uint256 i = 0; i < delegateAddresses.length; i++) {
      dividends[i] = minHoldingValue(delegateAddresses[i])
        .mul(dividendPerHoldingValue)
        .div(POINTSMULTIPLIER);
    }
    return dividends;
  }

  function subscribeDividends(address _addr) public virtual {
    require(delegates(_addr) == address(0), "Already subscribed"); // check if already subscribed
    delegateAddresses.push(_addr);
    delegate(_addr); // ?
  }

  /**
   * return how much dividend should one get per his minHoldingValue. EXagerated for factor POINTSMULTIPLIER!
   *   In each distribution, there is a small amount of funds which does not get distributed,
   *     which is `(msg.dividendAmount * POINTSMULTIPLIER) % totalValue()`.
   */
  function dividendsPerHoldingValue(uint256 dividendAmount)
    public
    view
    onlyRole(RoleNames.WIZARD)
    returns (uint256)
  {
    uint256 arrayLength = delegateAddresses.length;
    uint256 totalHoldingPower = 0; // totalValue auto init to 0
    uint256 pointsPerShare;

    for (uint256 i = 0; i < arrayLength; i++) {
      totalHoldingPower += minHoldingValue(delegateAddresses[i]);
    }
    require(totalHoldingPower > 0, "TTOTAL HOLDING POWER IS ZERO");
    require(dividendAmount > 0, "NO DIVIDENDS TO DISTRIBUTE");

    pointsPerShare = dividendAmount.mul(POINTSMULTIPLIER) / totalHoldingPower;
    return pointsPerShare;
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
    }

    return true;
  }

  /**
   * Return min share of user in last minHoldingBlocks
   */
  function minHoldingValue(address _addr) public view returns (uint256) {
    require(numCheckpoints(_addr) > 0, "no checkpoints");
    uint256 startBlock = int256(block.number) - int256(minHoldingBlocks) > 0
      ? block.number - minHoldingBlocks
      : 0;
    uint256 minimum;
    minimum = uint256(checkpoints(_addr, numCheckpoints(_addr)).votes); // initialize min to last checkpoin
    for (uint32 i = numCheckpoints(_addr); i > startBlock; i--) {
      minimum = uint256(Math.min(minimum, checkpoints(_addr, i).votes));
    }
    return minimum;
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