// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./Constants.sol";

/**
 * will be adding to default implementation a little
 * we need to implement special function to check
 * whether user has held the token for long enough
 */

abstract contract ERC20CVotes is AccessControl, ERC20Permit, ERC20Votes {
  using SafeMath for uint256;

  uint256 internal minHoldingBlocks = 864_000; // cca 1blocks/3s -> 1200/h -> 28800/d -> cca 864_000/M

  //specs at https://handsomely-mango-150.notion.site/Dividends-091a454635414f8aabc80e967de65fd6
  uint256[] internal dividendBlocks;
  mapping(address => uint256) internal userLatestBlock; // latest block at which user has withdrawn dividends
  uint256[] internal dividendsAmounts;
  uint256[] internal dividendsPaid;

  // uint256 internal constant POINTSMULTIPLIER = 2**128; // optimization, see https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728

  function changeMinHoldingBlocks(uint256 _minHoldingBlocks)
    public
    onlyRole(RoleNames.WIZARD)
  {
    //require(_minHoldingBlocks > 0, "negative minHoldingBlocks");
    minHoldingBlocks = _minHoldingBlocks;
  }

  function payDividends(uint256 blockPay, uint256 amount)
    public
    onlyRole(RoleNames.WIZARD)
  {
    dividendBlocks.push(blockPay);
    dividendsAmounts.push(amount);
    dividendsPaid.push(0);
  }

  function deleteDividends(uint256 blockDelete)
    public
    onlyRole(RoleNames.WIZARD)
    returns (uint256)
  {
    //require(blockDelete > 0, "negative block");
    // delete block  in dividendBlocks
    uint256 indexOfBlock;
    bool doesExist = false;
    for (uint256 i = 0; i <= dividendBlocks.length; i++) {
      if (blockDelete == dividendBlocks[i]) {
        indexOfBlock = i;
        doesExist = true;
      }
    }
    require(doesExist, "block not in dividendBlocks");
    delete dividendBlocks[indexOfBlock]; // but now we leave gap (just set to 0)! we want this becasue indexes  in lists still coresponde to same dividends
    uint256 remaining = dividendsAmounts[indexOfBlock];
    dividendsPaid[indexOfBlock] = dividendsPaid[indexOfBlock] + remaining;
    dividendsAmounts[indexOfBlock] = 0;
    return remaining;
    // set dividendsPait do dividendAmounts?
  }

  function withdrawDividendsBlock(uint256 blockWithdraw)
    private
    view
    returns (uint256)
  {
    uint256 pastTotalSupply = getPastTotalSupply(blockWithdraw); // ?
    uint256 toWithdraw = ((dividendsAmounts[blockWithdraw] +
      dividendsPaid[blockWithdraw]) *
      minHoldingValue(msg.sender, blockWithdraw)) / pastTotalSupply;
    require(dividendsAmounts[blockWithdraw] > toWithdraw, "Not enough money");
    return toWithdraw;
  }

  function withdrawAllDividends() private returns (uint256) {
    require(dividendBlocks.length > 0, "No blocks with dividends");
    uint256 withdrawAmount;
    if (userLatestBlock[msg.sender] == 0) {
      // hasnt claimed yet
      userLatestBlock[msg.sender] = dividendBlocks[0];
    }
    for (uint256 i = dividendBlocks.length; i > 0; i--) {
      if (dividendBlocks[i] <= userLatestBlock[msg.sender]) {
        break;
      }
      uint256 amountBlock = withdrawDividendsBlock(dividendBlocks[i]);
      withdrawAmount += amountBlock;
      dividendsPaid[i] += amountBlock;
      dividendsAmounts[i] -= amountBlock;
    }
    userLatestBlock[msg.sender] = dividendBlocks[dividendBlocks.length - 1];
    return withdrawAmount;
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
