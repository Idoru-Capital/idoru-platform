// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Constants.sol";

contract ERC20Presale is AccessControl {
  bool public presaleEnded;

  function endPresale() public onlyRole(RoleNames.WIZARD) {
    presaleEnded = true;
  }

  modifier presaleProtection(address _from) {
    if (!presaleEnded) {
      require(
        _from == address(0) || hasRole(RoleNames.WIZARD, msg.sender),
        "Only minting in presale"
      );
    }
    _;
  }
}
