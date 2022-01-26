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
} from "../typechain";

import { routerABI, tokenABI, UNISWAP_ROUTER, USDC, WETH } from "./constants";
import { expect } from "chai";

describe.only("Idoru minter Contract", function () {
  let token: Idoru;
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

    // deploy Idoru Minter contract
    idoruMinter = await new IdoruMinter__factory(owner).deploy(
      uniswap.FACTORY_ADDRESS,
      token.address,
      USDC,
      bank.address
    );
    await idoruMinter.deployed();

    // easier to test with this
    await token.changeMinHoldingBlocks(ethers.BigNumber.from(5));

    // have tp gramt IdoruMinter contract minting permission
    await token.grantRole(await ROLES_NAMES.MINTER(), idoruMinter.address);
  });

  /**
   * Test Idoru Minter contract
   */
  it.only("Test Idoru Minter contract", async function () {
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
    const amountOut = await idoruMinter.getIdoruAmountOut(transferAmount);

    console.log(await idoruMinter.getIdoruAmountOut(transferAmount));

    const idoruMinter_addr1 = idoruMinter.connect(addr1);

    console.log(
      (await token.balanceOf(addr1.address)).div(await token.decimals())
    );

    expect(await token.balanceOf(addr1.address)).to.be.equal(0);

    await usdc
      .connect(addr1)
      .approve(idoruMinter.address, transferAmount.mul(100));

    // await idoruMinter_addr1.setUniswapFactoryAddress(uniswap.FACTORY_ADDRESS);
    await idoruMinter_addr1.swapStableIdoru(transferAmount);

    expect(await usdc.balanceOf(bank.address)).to.be.equal(transferAmount);

    console.log(
      (await token.balanceOf(addr1.address)).div(await token.decimals())
    );
    console.log(amountOut.div(await token.decimals()));
    expect(await token.balanceOf(addr1.address)).not.to.be.equal(0);
  });
});
