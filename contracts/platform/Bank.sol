// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ERC20Bank is Ownable {
  mapping(address => bool) private bankUsers; // true if user is a bank user

  constructor() {
    addBankUser(msg.sender);
  }

  function isBankUser(address _user) public view returns (bool) {
    return bankUsers[_user];
  }

  modifier onlyBankUser() {
    require(isBankUser(msg.sender), "Not a bank user");
    _;
  }

  /**
   * Function to add user to bank
   */
  function addBankUser(address _user) public onlyOwner {
    bankUsers[_user] = true;
  }

  /**
   * Function to remove user from bank
   */
  function removeBankUser(address _user) public onlyOwner {
    bankUsers[_user] = false;
  }

  /**
   * Borrow ERC20 tokens from the bank
   */
  function withdrawTokens(address _token, uint256 _amount) public onlyBankUser {
    require(_amount > 0, "Value must be greater than 0");
    // require(_to != address(0), "Invalid address");

    IERC20 token = IERC20(_token);
    // require(balanceOf(msg.sender) >= _value, "Not enough balance");
    // transfer(_to, _value);
    token.transfer(msg.sender, _amount);
  }

  /**
   * Withdraw ether from the bank
   */
  function withdrawEther(uint256 _amount) public onlyBankUser {
    require(_amount > 0, "Value must be greater than 0");

    payable(msg.sender).transfer(_amount);
  }
}
