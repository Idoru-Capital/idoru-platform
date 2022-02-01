# Idoru platform contracts

This repo contains all the code for Idoru Capital Management fund's on-chain contracts.

It is the easiest to reproduce the env with `yarn`. You can run tests with `yarn test`.

You must also include `.env` file as structured in `.env.example` if you want to fork ethereum chain and run tests that way, since they rely on deployed Uniswap contracts.

## Token functions and roles

Has all the functionality listed [ERC20](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20) (plus `ERC20Burnable`, `Pausable`, and `ERC20Votes`)

### Custom public functionality

`changeMinHoldingBlocks(uint256 _minHoldingBlocks) onlyRole(WIZARD)`

Change the duration of required holding blocks

`minHoldingAmount(address _addr, uint256 _amount) onlyRole(WIZARD)`

Before interacting, user has to enable self delegation (usually meant for voting)
Check the minimumg buying power for all tokens the user has held for at least `minHoldingBlocks`. This function is used exclusively for dividends.

`verifyAddress(address _addr) public onlyRole(WIZARD)`

function adds \_addr to list of verified addresses (KYC).

`unVerifyAddress_(address _addr) public onlyRole(WIZARD)`

same, removes \_addr

`isVerified(address _addr) public view returns (bool)`

returns if \_addr verified

### Roles

_Wizard_

This gives the ability to add users to change holding time and verify addresses

_Pauser_

the ability to pause transactions in case of catastrophic failure or something

_Minter_

the ability to mint tokens. We essentially want to add this only to smart contracts which will mint tokens (and physical wallet which created the wallet)

_DEFAULT_ADMIN_ROLE_

_this is only added to the creator of the token_

## Idoru Minter

This contract is used to mint new tokens at market price. Essentially we will use it to raise new capital when new opportunities arise.

### Variables

`mapping(address => address) private supportedPools`

list of supported public Idoru pools

`variable public maxTokenMint`

shows how many tokens we can mint currently

### Function

`getIdoruPrice(amount, token) internal -> amount`

internally calls Uniswap’s getTokenPrice, which then calculates how much idoru needs to be minted from token (stablecoin), supports one stablecoin pool (on Pancake).

`swapStablecoinIdoru(amount, token) payable public`

this actually accepts ERC20 stablecoins and converts them to IDORU token.
We also verify if user is verified (for all public state changing functions)

`mintIdoruPresale(amount, token) payable public`

same, but for presale (fixed price), before liquidity is added.

## Dividends

Contract we will use to pay dividends on our tokens. They will be paid in stablecoins.

### Variables

uint[] dividendBlocks

- tracks blocks in which dividends were paid

mapping(uint ⇒ struct(amount, paid)) dividendAmounts // make two arrays, dividendAmount and dividendsPaid

- blocknumber → dividend amount in stablecoin USDC

mapping(address ⇒ uint) userLatestBlocks

- tracks the latest block (one of the dividendsBlocks) the user has withdraw dividends until

### Functions

`withdrawAllStablecoin`

- just a safety measure to withdraw allstablecoins

`payDividends(amount)`

- Transfers stablecoin to the contract
- Adds current block to all mapping and arrays that need it and add amount to mapping

`deleteDividends(block)`

- takes the remaining unclaimed dividend stablecoins from block x and trades it for Idoru tokens on Uniswap, then burns them
- Removes block from dividendsBlocks array
- Sets dividendsPaid(X) to dividendAmounts

`withdrawDividendsBlock(X) private (does not to even be separate function, probably fancier)`

- calculates how much dividends user msg.sender should recieve in block X with the help of Idoru token functions (minholdingamount/pasttotalsupppy)
- Check if that amount is more than dividendAmounts - dividendsPaid
- Increases dividendspaid for block X
- Returns dividend amount

`withdrawAllDividends()`

- finds the index of userlatestblock of msg.sender in dividendsblocks with binary search
- Loops from there on for all blocks and calculates total amount of dividends that should be paid
- Sets the userlatestblock to last block in dividendsblocks
- Pays the user dividends
