// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "../uniswap/UniswapV2Library.sol";

import "../interfaces/Idoru.interface.sol";

import "hardhat/console.sol";

// Basically we dont need to connect to Uniswap because we will predefine the price
// at which users can mint new token

// TODO
// add safemath and check for div or /

// check the order of tokens minted - probably something to do with sortTokens() function
// which is available here https://docs.uniswap.org/protocol/V2/reference/smart-contracts/library
// alternatevly just getReserves() function on the from uniswap library

contract IdoruMinter is Ownable {
  //   address private _idoruStablePair;
  using SafeMath for uint256;

  address private uniswapFactoryAddress;
  address private idoruAddress;
  address private idoruStablePoolAddress;
  mapping(address => bool) private supportedStablecoins;
  address private bankAddress;

  constructor(
    address _uniswapFactory,
    address _idoru,
    address _stablecoin,
    address _bank
  ) {
    uniswapFactoryAddress = _uniswapFactory;
    idoruAddress = _idoru;
    idoruStablePoolAddress = _stablecoin;
    supportedStablecoins[_stablecoin] = true;
    bankAddress = _bank;
  }

  uint256 internal rewardPoints = 10_100; // 100 point = 1% but its for multiplying so =10_000 (*=1+diff)
  uint256 internal fixedPricePresale = 1_000_000; // price = 1000_000* dollar/token (so higher price means more valuable token)

  /**
   * Change factor for better price if minting. 
   100 point = 1% but its for multiplying so =10_000 (*=1+diff)
   */
  function changerewardPoints(uint256 _rewardPoints) public onlyOwner {
    require(rewardPoints > 10_000, "Negative reward");
    rewardPoints = _rewardPoints;
  }

  /**
   * Change fixed price in presale
   */
  function changePricePresale(uint256 _fixedPricePresale) public onlyOwner {
    require(_fixedPricePresale > 0, "Negative reward points");
    fixedPricePresale = _fixedPricePresale;
  }

  /**
   * Check if user is verified (KYC) on token
   */
  // modifier senderVerified() {
  //   require(
  //     IIdoru(idoruAddress).isVerified(msg.sender),
  //     "You are not verified"
  //   );
  //   _;
  // }

  /**
   * amount in is should be in stablecoins (UDSC)
   */
  function getIdoruPresaleAmountOut(uint256 _amountIn)
    public
    view
    returns (uint256 _amountOut)
  {
    require(_amountIn > 0, "Negative amount in");
    require(fixedPricePresale > 0, "Negative fixed price");
    _amountOut = _amountIn.mul(1_000_000) / (fixedPricePresale);
  }

  function setUniswapFactoryAddress(address _addr) public onlyOwner {
    uniswapFactoryAddress = _addr;
  }

  function setIdoruAddress(address _addr) public onlyOwner {
    idoruAddress = _addr;
  }

  function addStablecoinAddress(address _addr) public onlyOwner {
    supportedStablecoins[_addr] = true;
  }

  function removeStablecoinAddress(address _addr) public onlyOwner {
    supportedStablecoins[_addr] = false;
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
    (uint256 res0, uint256 res1) = UniswapV2Library.getReserves(
      uniswapFactoryAddress,
      idoruStablePoolAddress,
      idoruAddress
    );
    require(_amountIn > 0, "Negative amount in");
    require(rewardPoints > 10_000, "Negative reward");
    require(res0 > 0, "Negative pool");
    require(res1 > 0, "Negative pool");
    _amountOut = (_amountIn.mul(res1) / (res0)).mul(rewardPoints) / (10_000);
    // _amountOut = UniswapV2Library.getAmountOut(_amountIn, res0, res1); // Old version
  }

  /**
   * amount out is should be in Idoru tokens (IDORU)
   */
  function getIdoruAmountIn(uint256 _amountOut)
    public
    view
    returns (uint256 _amountIn)
  {
    (uint256 res0, uint256 res1) = UniswapV2Library.getReserves(
      uniswapFactoryAddress,
      idoruStablePoolAddress,
      idoruAddress
    );
    require(_amountOut > 0, "Negative amount in");
    require(rewardPoints > 10_000, "Negative reward");
    require(res0 > 0, "Negative pool");
    require(res1 > 0, "Negative pool");
    _amountIn = (_amountOut.mul(res0) / res1).mul(10_000) / rewardPoints;
    // _amountIn = UniswapV2Library.getAmountIn(_amountOut, res0, res1);  // Old version
  }

  /**
   * we can do this (if) the contract has minter permission

   * idk man probably this requires some safety mechanism also
   * also I feel like IERC20 is not enough for this -> need to export type IIdoruToken
   */
  function mintIdoru(address to, uint256 amount) private {
    IIdoru(idoruAddress).mint(to, amount);
  }

  /**
   * user would need to approve this contract for ERC20 stablecoins
   */
  function swapStableIdoru(uint256 _stablecoinAmount) public {
    // console.log(IIdoru(idoruAddress).isVerified(msg.sender));

    IERC20 stableERC20 = IERC20(idoruStablePoolAddress);

    stableERC20.transferFrom(msg.sender, bankAddress, _stablecoinAmount);

    uint256 idoruAmount = getIdoruAmountOut(_stablecoinAmount);

    mintIdoru(msg.sender, idoruAmount);
  }
}
