// SPDX-License-Identifier: MIT
// Idoru Dividend contract

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/Idoru.interface.sol";

/**
 * First of all some things are in order to say. It is much easier and safer to just copy native OpenZeppelin contracts.
 * Surely enough, it required some heavy modifications. For instance we need to replace shares with actual ether
 * if we want to transfer ERC20 around while adding new tokens.
 * Read more about the original contract in (finance/PaymentSplitter.sol)

 * We will only support ERC20 tokens, not pure Ether.

 * Why would we need _payees array?
 */

contract IdoruDividends is Context, Ownable {
  event PayeeAdded(address account, uint256 shares);
  event ERC20PaymentReleased(IERC20 indexed token, address to, uint256 amount);
  event PaymentReceived(address from, uint256 amount);

  // there is no way to change the token. If need to change, we need to deploy new contract.
  address private _stablecoinToken;
  address private _idoruToken;
  address private bankAddress;

  uint256[] internal dividendBlocks;
  mapping (address => uint256) internal userLatestBlock; // latest block at which user has withdrawn dividends
  uint256[] internal dividendsAmounts;
  uint256[] internal dividendsPaid;
  /**
   *Set the address of the stablecoin in which we will distribute dividends.
   */
  constructor(address stablecoinAddress_, address idoruTokenAddress_) {
    _stablecoinToken = stablecoinAddress_;
    _idoruToken = idoruTokenAddress_;
  }

  /**
   * Function which should actually be called to redistribute dividends.
   *TODO probably make this only owner, and make write some safemath checks
   */
  
    function payDividends(uint256 blockPay, uint256 amount)
    public
    onlyOwner{
    dividendBlocks.push(blockPay);
    dividendsAmounts.push(amount);
    dividendsPaid.push(0);
    IERC20 stableERC20 = IERC20(_stablecoinToken);
    stableERC20.transferFrom(bankAddress, address(this), amount);   // a to je ok?
}

  function deleteDividends(uint256 blockDelete)
    public
    onlyOwner returns (uint256){
    //require(blockDelete > 0, "negative block");
    // delete block  in dividendBlocks
    uint indexOfBlock;
    bool doesExist = false;
    for (uint i=0; i <= dividendBlocks.length; i++) {
        if (blockDelete == dividendBlocks[i]) {
          indexOfBlock = i;
          doesExist = true;
    }
    }
    require(doesExist, "Block not in dividendBlocks");
    delete dividendBlocks[indexOfBlock];  // but now we leave gap (just set to 0)! we want this becasue indexes  in lists still coresponde to same dividends
    uint256 remaining = dividendsAmounts[indexOfBlock];
    dividendsPaid[indexOfBlock] = dividendsPaid[indexOfBlock] + remaining;
    dividendsAmounts[indexOfBlock] = 0;
    IERC20 stableERC20 = IERC20(_stablecoinToken);
    stableERC20.transferFrom(address(this), msg.sender, remaining);
    // set dividendsPaid do dividendAmounts?
  }  

  function withdrawDividendsBlock(uint256 blockWithdraw)
    private view returns (uint256)
  {
    uint pastTotalSupply = IIdoru(_idoruToken).getPastTotalSupply(blockWithdraw);  // ?
    uint toWithdraw = (dividendsAmounts[blockWithdraw] + dividendsPaid[blockWithdraw])*IIdoru(_idoruToken).minHoldingValue(msg.sender, blockWithdraw) / pastTotalSupply;
    require(dividendsAmounts[blockWithdraw]> toWithdraw, "Not enough money");
    return toWithdraw;
    }

  function withdrawAllDividendsView()
    public view returns (uint256)
  {
    require(dividendBlocks.length > 0, "No blocks with dividends");
    uint withdrawAmount;
    // If user hasnt claimed didvidends yet, userLatestBlock[msg.sender] = 0
    // if (userLatestBlock[msg.sender] == 0){ // Hasnt claimed yet
    //   userLatestBlock[msg.sender] = dividendBlocks[0];
    // }
    for (uint i=dividendBlocks.length; i > 0; i--) {
      if (dividendBlocks[i] <= userLatestBlock[msg.sender]){
        break;
      }
      withdrawAmount += withdrawDividendsBlock(dividendBlocks[i]);
    }
    return withdrawAmount;
}
  function withdrawAllDividendsChangeState()
    private returns (uint256)
  {
    require(dividendBlocks.length > 0, "No blocks with dividends");
    if (userLatestBlock[msg.sender] == 0){ // hasnt claimed yet
      userLatestBlock[msg.sender] = dividendBlocks[0];
    }
    for (uint i=dividendBlocks.length; i > 0; i--) {
      if (dividendBlocks[i] <= userLatestBlock[msg.sender]){
        break;
      }
      uint amountBlock = withdrawDividendsBlock(dividendBlocks[i]);
      dividendsPaid[i] += amountBlock;
      dividendsAmounts[i] -= amountBlock;
    }
    userLatestBlock[msg.sender] = dividendBlocks[dividendBlocks.length - 1];
}
  function claimDividends()
    private returns (uint256)
  {
    IERC20 stableERC20 = IERC20(_stablecoinToken);
    uint256 amount = withdrawAllDividendsView();
    withdrawAllDividendsChangeState();
    stableERC20.transferFrom(address(this), msg.sender, amount);
}
}
