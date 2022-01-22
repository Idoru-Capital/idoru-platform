// SPDX-License-Identifier: MIT
// Idoru Dividend contract

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "../token/Idoru.interface.sol";

/**
 * First of all some things are in order to say. It is much easier and safer to just copy native OpenZeppelin contracts.
 * Surely enough, it required some heavy modifications. For instance we need to replace shares with actual ether
 * if we want to transfer ERC20 around while adding new tokens.
 * Read more about the original contract in (finance/PaymentSplitter.sol)

 * We will only support ERC20 tokens, not pure Ether.

 * Why would we need _payees array?
 */

contract IdoruDividends is Context {
  event PayeeAdded(address account, uint256 shares);
  event ERC20PaymentReleased(IERC20 indexed token, address to, uint256 amount);
  event PaymentReceived(address from, uint256 amount);

  // there is no way to change the token. If need to change, we need to deploy new contract.
  address private _stablecoinToken;
  address private _idoruToken;

  uint256 private _totalAmount;
  uint256 private _totalReleased;

  mapping(address => uint256) private _dividendAmounts;
  mapping(address => uint256) private _released;

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
  function distributeDividends(uint256 amount_) public {
    require(amount_ > 0);

    address[] payees_ = I_Idoru(_idoruToken).getDelegateAddresses();
    uint256[] shares_ = I_Idoru(_idoruToken).getDelegateDividendsAmounts();

    distributeDividendsaddress(payees_, shares_);

    SafeERC20.safeTransferFrom(
      IERC20(_stablecoinToken),
      msg.sender,
      address(this),
      amount_
    );
  }

  /**
   * Distribute _stablecoinToken tokens to payees according to their dividend amounts.

   * @dev Creates an instance of `PaymentSplitter` where each account in `payees` is assigned the number of shares at
   * the matching position in the `shares` array.
   *
   * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
   * duplicates in `payees`.
   */
  function distributeDividendsaddress(
    address[] memory payees,
    uint256[] memory shares_
  ) private {
    require(
      payees.length == shares_.length,
      "PaymentSplitter: payees and shares length mismatch"
    );
    require(payees.length > 0, "PaymentSplitter: no payees");

    for (uint256 i = 0; i < payees.length; i++) {
      _addPayee(payees[i], shares_[i]);
    }
  }

  /**
   * @dev The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
   * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
   * reliability of the events, and not the actual splitting of Ether.
   *
   * To learn more about this see the Solidity documentation for
   * https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
   * functions].
   */
  receive() external payable virtual {
    emit PaymentReceived(_msgSender(), msg.value);
  }

  /**
   * @dev Getter for the total amount of tokens held by payees.
   */
  function totalAmount() public view returns (uint256) {
    return _totalAmount;
  }

  /**
   * @dev Getter for the total amount of Ether already released.
   */
  function totalReleased() public view returns (uint256) {
    return _totalReleased;
  }

  /**
   * @dev Getter for the amount of dividend held by an account.
   */
  function dividendAmount(address account) public view returns (uint256) {
    return _dividendAmounts[account];
  }

  /**
   * @dev Getter for the amount of Ether already released to a payee.
   */
  function released(address account) public view returns (uint256) {
    return _released[account];
  }

  /**
   * @dev Triggers a transfer to `account` of the amount of `token` tokens they are owed, according to their
   * percentage of the total shares and their previous withdrawals. `token` must be the address of an IERC20
   * contract.
   */
  function release(address account) public virtual {
    require(
      _dividendAmounts[account] > 0,
      "PaymentSplitter: account has no shares"
    );

    IERC20 token = IERC20(_stablecoinToken);

    // uint256 totalReceived = token.balanceOf(address(this)) +
    //   totalReleased(token);
    uint256 payment = _pendingPayment(
      account,
      //   totalReceived,
      released(account)
    );

    require(payment != 0, "PaymentSplitter: account is not due payment");

    _released[account] += payment;
    _totalReleased += payment;

    SafeERC20.safeTransfer(token, account, payment);
    emit ERC20PaymentReleased(token, account, payment);
  }

  /**
   * @dev internal logic for computing the pending payment of an `account` given the token historical balances and
   * already released amounts.
   */
  function _pendingPayment(address account, uint256 alreadyReleased)
    private
    view
    returns (uint256)
  {
    return _dividendAmounts[account] - alreadyReleased;
  }

  /**
   * @dev Add a new payee to the contract.
   * @param account The address of the payee to add.
   * @param amount_ The amount of ERC20 token owned by the payee.
   */
  function _addPayee(address account, uint256 amount_) private {
    require(account != address(0), "PaymentSplitter: zero address");
    require(amount_ > 0, "PaymentSplitter: amounts are 0");

    //! BE VERY CAREFUL HERE, NOT SURE IF THIS IS THE RIGHT WAY TO DO THIS
    _dividendAmounts[account] = _dividendAmounts[account] + amount_;
    _totalAmount = _totalAmount + amount_;
    emit PayeeAdded(account, amount_);
  }
}
