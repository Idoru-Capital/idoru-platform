// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

library RoleNames {
  bytes32 public constant WIZARD = keccak256("WIZARD");
  bytes32 public constant PAUSER = keccak256("PAUSER");
  bytes32 public constant MINTER = keccak256("MINTER");
}
