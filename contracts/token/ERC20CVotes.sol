// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./Constants.sol";

/**
 * will be adding to default implementation a little
 * we need to implement special function to check
 * whether user has held the token for long enough
 */

abstract contract ERC20CVotes is
  AccessControlEnumerable,
  ERC20Permit,
  ERC20Votes
{
  using SafeMath for uint256;

  uint256 internal minHoldingBlocks = 864_000; // cca 1blocks/3s -> 1200/h -> 28800/d -> cca 864_000/M

  //specs at https://handsomely-mango-150.notion.site/Dividends-091a454635414f8aabc80e967de65fd6
  // uint256 internal constant POINTSMULTIPLIER = 2**128; // optimization, see https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728

  function changeMinHoldingBlocks(uint256 _minHoldingBlocks)
    public
    onlyRole(RoleNames.WIZARD)
  {
    //require(_minHoldingBlocks > 0, "negative minHoldingBlocks");
    minHoldingBlocks = _minHoldingBlocks;
  }

  function subscribeDividends() public virtual {
    delegate(msg.sender); // ?
  }

  /**
   * Return min share of user in last minHoldingBlocks
   */
  function minHoldingValue(address _addr, uint256 dividendsBlock)
    public
    view
    returns (uint256)
  {
    if (numCheckpoints(_addr) == 0) {
      return 0; // No checkpoints
    }
    uint256 startBlock = int256(dividendsBlock) - int256(minHoldingBlocks) > 0
      ? dividendsBlock - minHoldingBlocks
      : 0;
    uint256 minimum;
    minimum = getPastVotes(_addr, startBlock); // initialize min to last checkpoin
    for (
      uint32 i = numCheckpoints(_addr);
      i >= 1 && checkpoints(_addr, i - 1).fromBlock > startBlock;
      i--
    ) {
      if (checkpoints(_addr, i - 1).fromBlock > dividendsBlock) {
        continue;
      }
      minimum = uint256(Math.min(minimum, checkpoints(_addr, i - 1).votes));
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
