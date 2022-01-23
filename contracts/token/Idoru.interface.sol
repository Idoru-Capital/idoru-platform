// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the Idoru token.
 */
interface IIdoru is IERC20 {
  function dividendsPerHoldingValue(uint256 dividendAmount)
    external
    view
    returns (uint256);

  function getDelegateAddresses() external view returns (address[] memory);

  function getDelegateDividendsAmounts(uint256 dividendAmount)
    external
    view
    returns (uint256[] memory);
}
