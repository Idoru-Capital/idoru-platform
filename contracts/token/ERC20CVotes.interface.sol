// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

/**
 * @dev Interface of the Votes contract.
 */
interface IERC20CVotes {
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
