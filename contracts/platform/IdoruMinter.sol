// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

// Basically we dont need to connect to Uniswap because we will predefine the price
// at which users can mint new token

// TODO
// add safemath

// check the order of tokens minted - probably something to do with sortTokens() function
// which is available here https://docs.uniswap.org/protocol/V2/reference/smart-contracts/library
// alternatevly just getReserves() function on the from uniswap library

abstract contract IdoruMinter is Ownable {
  //   address private _idoruStablePair;
  address private uniswapFactoryAddress;
  address private idoruAddress;
  address private stablecoinAddress;
  address private bankAddress;

  constructor(
    address _uniswapFactory,
    address _idoru,
    address _stablecoin,
    address _bank
  ) public {
    uniswapFactoryAddress = _uniswapFactory;
    idoruAddress = _idoru;
    stablecoinAddress = _stablecoin;
    bankAddress = _bank;
  }

  function setUniswapFactoryAddress(address _addr) public onlyOwner {
    uniswapFactoryAddress = _addr;
  }

  function setIdoruAddress(address _addr) public onlyOwner {
    idoruAddress = _addr;
  }

  function setStablecoinAddress(address _addr) public onlyOwner {
    stablecoinAddress = _addr;
  }

  function setBankAddress(address _addr) public onlyOwner {
    bankAddress = _addr;
  }

  /**
   * amount in is should be in stablecoins (UDSC)
   */
  function getIdoruAmountOut(uint256 _amountIn)
    public
    view
    returns (uint256 _amountOut)
  {
    (uint256 res0, uint256 res1, ) = getReserves(
      uniswapFactoryAddress,
      stablecoinAddress,
      idoruAddress
    );
    _amountOut = getAmountOut(_amountIn, res0, res1);
  }

  /**
   * amount out is should be in Idoru tokens (IDORU)
   */
  function getIdoruAmountOut(uint256 _amountOut)
    public
    view
    returns (uint256 _amountIn)
  {
    (uint256 res0, uint256 res1, ) = getReserves(
      uniswapFactoryAddress,
      stablecoinAddress,
      idoruAddress
    );
    _amountIn = getAmountIn(_amountOut, res0, res1);
  }

  /**
   * we can do this (if) the contract has minter permission

   * idk man probably this requires some safety mechanism also
   * also I feel like IERC20 is not enough for this -> need to export type IIdoruToken
   */
  function mintIdoru(address to, uint256 amount) private {
    IERC20 idoruToken = IERC20(idoruAddress);
    idoruToken.mint(to, amount);
  }

  /**
   * user would need to approve this contract for ERC20 stablecoins
   */
  function swapStableIdoru(uint256 _stablecoinAmount) public {
    IERC20 stableERC20 = IERC20(stablecoinAddress);

    stableERC20.transferFrom(msg.sender, bankAddress, _stablecoinAmount);

    uint256 idoruAmount = getIdoruAmountOut(_stablecoinAmount);

    mintIdoru(msg.sender, idoruAmount);
  }
}