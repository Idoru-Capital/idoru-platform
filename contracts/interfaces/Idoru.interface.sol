// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the Idoru token.
 */
interface IIdoru is IERC20 {
  // view functions
  function minHoldingValue(address _addr, uint256 dividendsBlock)
    external
    view
    returns (uint256);

  function getPastTotalSupply(uint256 blockNumber)
    external
    view
    returns (uint256);

  function isVerified(address _addr) external view returns (bool);

  function decimals() external view returns (uint8);

  // state changing functions
  function mint(address to, uint256 amount) external;
}
