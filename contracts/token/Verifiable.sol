// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Constants.sol";

/**
 * basic functionality of verified addresses
 * addresses confirmed off-chain
 * this is not used in actual token, but is meant for other smart contracts

 * this exact functionality could be added also added with role system
 * but this is more flexible, and we can see who is verified
 */
abstract contract ERC20Verifiable is AccessControl {
  event Verified(address indexed _verified);

  mapping(address => bool) private verified;

  function verifyAddress(address _addr) public onlyRole(RoleNames.WIZARD) {
    require(!verified[_addr], "Already verified");
    verified[_addr] = true;

    emit Verified(_addr);
  }

  function unVerifyAddress(address _addr) public onlyRole(RoleNames.WIZARD) {
    // require(verified[_addr], "Not verified");
    verified[_addr] = false;
  }

  function isVerified(address _addr) public view returns (bool) {
    return verified[_addr];
  }
}
