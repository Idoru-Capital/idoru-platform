// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./Verifiable.sol";
import "./Constants.sol";
import "./ERC20CVotes.sol";

contract Idoru is
  ERC20,
  ERC20Burnable,
  Pausable,
  ERC20Permit,
  ERC20CVotes,
  ERC20Verifiable
{
  constructor() ERC20("Idoru", "IDRU") ERC20Permit("Idoru") {
    // Let's just give owner all the roles
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(RoleNames.WIZARD, msg.sender);
    _grantRole(RoleNames.PAUSER, msg.sender);
    _grantRole(RoleNames.MINTER, msg.sender);
    _mint(msg.sender, 25000000 * 10**decimals());
  }

  function pause() public onlyRole(RoleNames.PAUSER) {
    _pause();
  }

  function unpause() public onlyRole(RoleNames.PAUSER) {
    _unpause();
  }

  function mint(address to, uint256 amount) public onlyRole(RoleNames.MINTER) {
    _mint(to, amount);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }

  // The following functions are overrides required by Solidity.
  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20, ERC20CVotes) {
    super._afterTokenTransfer(from, to, amount);
  }

  function _mint(address to, uint256 amount)
    internal
    override(ERC20, ERC20CVotes)
  {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount)
    internal
    override(ERC20, ERC20CVotes)
  {
    super._burn(account, amount);
  }
}
