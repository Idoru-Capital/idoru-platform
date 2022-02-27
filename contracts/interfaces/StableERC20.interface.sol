// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the Idoru token.
 */
interface IStableERC20 is IERC20 {
  // view functions
  function decimals() external view returns (uint8);
}
