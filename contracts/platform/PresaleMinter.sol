// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "../uniswap/UniswapV2Library.sol";

import "../interfaces/Idoru.interface.sol";
import "../interfaces/StableERC20.interface.sol";

// This is a minter contract for the presale only!
// it is easier to split it in two parts so as not to worry about the uniswap pool

contract PresaleMinter is Ownable {
  // variables

  using SafeMath for uint256;

  address private idoruAddress;
  address private usdStableCoin;
  address private usdIdoruCoin;
  address private bankAddress;

  uint256 internal fixedPricePresale;

  uint256 internal presaleTokensToMint;

  constructor(
    address _idoru,
    address _stablecoin,
    address _idoruStablecoin,
    address _bank // this can be a regular safe wallet
  ) {
    idoruAddress = _idoru;
    usdStableCoin = _stablecoin;
    usdIdoruCoin = _idoruStablecoin;
    bankAddress = _bank;

    fixedPricePresale = 1_000_000; // price = 1_000_000 * dollar/token (so higher price means more valuable token)
  }

  /**
   * Check if user is verified (KYC) on token
   */
  modifier senderVerified() {
    require(IIdoru(idoruAddress).isVerified(msg.sender), "User not verified");
    _;
  }

  // var changing function

  /**
   * Change how many tokens in the presale can be minted
   */
  function setPresaleTokensToMint(uint256 _tokens) public onlyOwner {
    require(_tokens > 0, "Amount less or equal 0");
    presaleTokensToMint = _tokens;
  }

  /**
   * Change fixed price in presale. price = 1_000_000 * dollar/token (so higher price means more valuable token). Given price should be for factor 1_000_000 higher!
   */
  function changePricePresale(uint256 _fixedPricePresale) public onlyOwner {
    require(_fixedPricePresale > 0, "Presale price less or equal 0");
    fixedPricePresale = _fixedPricePresale;
  }

  /**
   * Change Idoru token address
   */
  function changeIdoruAddress(address _addr) public onlyOwner {
    idoruAddress = _addr;
  }

  /**
   * Change Bank address
   */
  function changeBankAddress(address _addr) public onlyOwner {
    bankAddress = _addr;
  }

  // View functions

  function getPresaleTokensToMint() public view returns (uint256) {
    return presaleTokensToMint;
  }

  /**
   * amount in is should be in stablecoins (UDSC)
   */
  function getIdoruPresaleAmountOut(uint256 _amountIn)
    public
    view
    returns (uint256 _amountOut)
  {
    require(_amountIn > 0, "Amount in less or equal 0");
    require(fixedPricePresale > 0, "Price less or equal 0");
    _amountOut =
      (_amountIn * (10**uint256(IIdoru(idoruAddress).decimals())) * 1_000_000) /
      (fixedPricePresale *
        (10**uint256(IStableERC20(usdStableCoin).decimals())));
  }

  // state changing functions

  /**
   * we can do this (if) the contract has minter permission
   */
  function mintIdoru(address to, uint256 amount) private {
    IIdoru(idoruAddress).mint(to, amount);
  }

  /**
   * Event that gets triggered on every mint of Idoru tokens
   */
  event SwapForIdoru(
    address indexed _stablecoin,
    address indexed _idoru,
    uint256 _amountIn,
    uint256 _amountOut
  );

  /**
   * Presale function for Idoru
      * user needs to approve this two contracts for ERC20 stablecoins

   * The contract accepts two tokens. First is USDC stablecoin, which is the pool
   * second is our internal stablecoin which we will use to fund users' accounts
   * when they send us money.
   * EMITS SwapForIdoru

   * same function as above but at a fixed price
   * EMITS PresaleSwapForIdoru
   */
  function mintIdoruPresale(uint256 _stablecoinAmount, address _stablecoin)
    public
    senderVerified
  {
    require(
      _stablecoin == usdStableCoin || _stablecoin == usdIdoruCoin,
      "Token not supported"
    );

    IERC20 stableERC20 = IERC20(_stablecoin);
    stableERC20.transferFrom(msg.sender, bankAddress, _stablecoinAmount);
    uint256 idoruAmount = getIdoruPresaleAmountOut(_stablecoinAmount);

    require(idoruAmount < presaleTokensToMint, "Mint too many tokens");
    presaleTokensToMint -= idoruAmount;

    mintIdoru(msg.sender, idoruAmount);

    emit SwapForIdoru(
      _stablecoin,
      idoruAddress,
      _stablecoinAmount,
      idoruAmount
    );
  }
}
