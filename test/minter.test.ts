import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { Contract } from "ethers";

import * as uniswap from "@uniswap/v2-sdk";

import {
  ERC20Bank,
  ERC20Bank__factory,
  Idoru,
  IdoruMinter,
  IdoruMinter__factory,
  Idoru__factory,
  RoleNames,
  RoleNames__factory,
  IdoruStableCoin,
  IdoruStableCoin__factory,
} from "../typechain";

import { routerABI, tokenABI, UNISWAP_ROUTER, USDC, WETH } from "./constants";
import { expect } from "chai";

describe.skip("Idoru minter Contract", function () {
  let token: Idoru;
  let idoruStablecoin: IdoruStableCoin;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;

  let bank: ERC20Bank;

  let uniswap_router_v2: Contract;
  let weth: Contract;
  let usdc: Contract;

  let idoruMinter: IdoruMinter;

  let ROLES_NAMES: RoleNames;

  this.beforeAll(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    uniswap_router_v2 = new ethers.Contract(UNISWAP_ROUTER, routerABI, owner);

    weth = new ethers.Contract(WETH, tokenABI, owner);
    usdc = new ethers.Contract(USDC, tokenABI, owner);

    beforeEach(async function () {
      [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

      [owner, addr1, addr2, addr3, addr4].forEach(async (add) => {
        await network.provider.send("hardhat_setBalance", [
          add.address,
          ethers.BigNumber.from(10).pow(24).toHexString(),
        ]);
      });
    });
  });

  beforeEach(async function () {
    const tokenFactory = new Idoru__factory(owner);
    token = await tokenFactory.deploy();
    await token.deployed();

    const constantsFactory = new RoleNames__factory(owner);
    ROLES_NAMES = await constantsFactory.deploy();
    await ROLES_NAMES.deployed();

    const bank_factory = new ERC20Bank__factory(owner);
    bank = await bank_factory.deploy();
    await bank.deployed();

    const IdoruStablecoinFactory = new IdoruStableCoin__factory(owner);
    idoruStablecoin = await IdoruStablecoinFactory.deploy();
    await idoruStablecoin.deployed();

    // deploy Idoru Minter contract
    idoruMinter = await new IdoruMinter__factory(owner).deploy(
      uniswap.FACTORY_ADDRESS,
      token.address,
      USDC,
      idoruStablecoin.address,
      bank.address
    );
    await idoruMinter.deployed();

    // easier to test with this
    await token.changeMinHoldingBlocks(ethers.BigNumber.from(5));

    // have tp gramt IdoruMinter contract minting permission
    await token.grantRole(await ROLES_NAMES.MINTER(), idoruMinter.address);
  });

  /**
   * token not supported test
   */
  it("token not supported test", async function () {
    // deploy Idoru Minter contract
    idoruMinter = await new IdoruMinter__factory(owner).deploy(
      uniswap.FACTORY_ADDRESS,
      token.address,
      USDC,
      ethers.constants.AddressZero,
      bank.address
    );
    await idoruMinter.deployed();

    const idoruStablecoin_1 = idoruStablecoin.connect(addr1);
    const idoruMinter_1 = idoruMinter.connect(addr1);

    // lets give him some tokens
    expect((await idoruStablecoin_1.balanceOf(addr1.address)).isZero()).to.be
      .true;
    await idoruStablecoin.mint(
      addr1.address,
      ethers.BigNumber.from(10).pow(3 + (await idoruStablecoin.decimals())) // lets mint him 1_000 tokens
    );
    expect((await idoruStablecoin_1.balanceOf(addr1.address)).isZero()).to.be
      .false;

    // approve minter on stalblecoin
    await idoruStablecoin_1.approve(
      idoruMinter.address,
      ethers.constants.MaxUint256
    );

    expect((await token.balanceOf(addr1.address)).isZero()).to.be.true;

    // user is not KYCed yet
    await expect(
      idoruMinter_1.swapStablecoinIdoru(
        await idoruStablecoin.balanceOf(addr1.address),
        idoruStablecoin.address
      )
    ).to.be.reverted;

    await token.verifyAddress(addr1.address);

    // token is not supported -> we did not deploy with IdoruStable in constructor!
    await expect(
      idoruMinter_1.swapStablecoinIdoru(
        await idoruStablecoin.balanceOf(addr1.address),
        idoruStablecoin.address
      )
    ).to.be.revertedWith("Token not supported");
  });

  /**
   * Test Idoru Minter contract
   */
  it("Test Idoru Minter contract on Uniswap", async function () {
    const token_1 = token.connect(addr1);

    //? add liqudity
    await weth.approve(UNISWAP_ROUTER, ethers.BigNumber.from(10).pow(40));
    await uniswap_router_v2.swapExactETHForTokens(
      1,
      [WETH, USDC],
      owner.address,
      1_000_000_000_000,
      {
        value: ethers.BigNumber.from(10).pow(22),
      }
    );

    await token.approve(UNISWAP_ROUTER, ethers.BigNumber.from(10).pow(48));
    await usdc.approve(UNISWAP_ROUTER, ethers.BigNumber.from(10).pow(48));

    await uniswap_router_v2.addLiquidity(
      token.address,
      usdc.address,
      ethers.BigNumber.from(10).pow(
        ethers.BigNumber.from(6).add(await token.decimals()) // add million tokens
      ),
      ethers.BigNumber.from(10).pow(
        ethers.BigNumber.from(6).add(await usdc.decimals()) // add million USDC
      ),
      1,
      1,
      owner.address,
      1_000_000_000_000 // infinite deadline
    );

    await token_1.subscribeDividends();
    await token.verifyAddress(addr1.address);

    // give addr1 some USDC
    await usdc.transfer(addr1.address, ethers.BigNumber.from(10).pow(6 + 5)); // hundred thousand USDC
    await usdc
      .connect(addr1)
      .approve(UNISWAP_ROUTER, ethers.BigNumber.from(10).pow(48));

    //? buy token 10 times
    // for (let i = 0; i < 10; i++) {
    //   await uniswap_router_v2.connect(addr1).swapExactTokensForTokens(
    //     ethers.BigNumber.from(10).pow(6 + 2), // buy 100 USDC every time
    //     1,
    //     [USDC, token.address],
    //     addr1.address,
    //     1_000_000_000_000
    //   );
    // }

    // console.log(await token.balanceOf(addr1.address));

    // now the user has buying power (doesnt matter for this test, only needs tokens)
    // console.log(await token_1.minHoldingValue(addr1.address));

    const transferAmount = ethers.BigNumber.from(10).pow(
      ethers.BigNumber.from(2).add(await usdc.decimals())
    );
    const wantedIdruTokens = ethers.BigNumber.from(10).pow(
      ethers.BigNumber.from(2).add(await token.decimals())
    );

    console.log(await idoruMinter.getIdoruAmountIn(wantedIdruTokens));

    const amountOut = await idoruMinter.getIdoruAmountOut(transferAmount);

    //console.log(await idoruMinter.getIdoruAmountOut(transferAmount));

    const idoruMinter_addr1 = idoruMinter.connect(addr1);

    console.log(
      (await token.balanceOf(addr1.address)).div(
        ethers.BigNumber.from(10).pow(await token.decimals())
      )
    );

    expect(await token.balanceOf(addr1.address)).to.be.equal(0);

    await usdc
      .connect(addr1)
      .approve(idoruMinter.address, transferAmount.mul(100));

    await expect(idoruMinter_addr1.swapStablecoinIdoru(transferAmount, USDC)).to
      .be.reverted;

    await idoruMinter.setAvailableTokensToMint(
      ethers.BigNumber.from(10).pow((await token.decimals()) + 6)
    ); // we can mint 1 million tokens

    await idoruMinter_addr1.swapStablecoinIdoru(transferAmount, USDC);

    expect(await usdc.balanceOf(bank.address)).to.be.equal(transferAmount);

    console.log(
      (await token.balanceOf(addr1.address)).div(
        ethers.BigNumber.from(10).pow(await token.decimals())
      )
    );
    console.log(
      amountOut.div(ethers.BigNumber.from(10).pow(await token.decimals()))
    );
    expect(await token.balanceOf(addr1.address)).not.to.be.equal(0);
  });
});
