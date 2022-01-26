import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { Contract } from "ethers";

import * as uniswap from "@uniswap/v2-sdk";

import {
  ERC20Bank,
  ERC20Bank__factory,
  Idoru,
  IdoruMinter__factory,
  Idoru__factory,
  RoleNames,
  RoleNames__factory,
} from "../typechain";

import { routerABI, tokenABI, UNISWAP_ROUTER, USDC, WETH } from "./constants";
import { expect } from "chai";

describe.skip("Platform", function () {
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
  });

  /**
   * Test network balances and uniswap swap
   */
  it("Test Network Balances", async function () {
    await weth.approve(UNISWAP_ROUTER, ethers.BigNumber.from(10).pow(24));

    await uniswap_router_v2.swapExactETHForTokens(
      1,
      [WETH, USDC],
      owner.address,
      1_000_000_000_000,
      {
        value: ethers.BigNumber.from(10).pow(20),
      }
    );
  });

  /**
   * Test create pair and adding liquidity
   */
  it("Test Create Pair, Add Liquidity and swap", async function () {
    // uncessecary, pair is created with first
    // await uniswap_factory_v2.createPair(token.address, usdc.address);

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

    expect((await token.balanceOf(addr1.address)).isZero()).to.be.true;
    // console.log(await token.balanceOf(addr1.address));

    await usdc.transfer(addr1.address, ethers.BigNumber.from(10).pow(6 + 5)); // hundred thousand USDC

    console.log(
      (await token.balanceOf(addr1.address)).div(
        ethers.BigNumber.from(10).pow(await token.decimals())
      )
    );
    console.log(
      (await usdc.balanceOf(addr1.address)).div(
        ethers.BigNumber.from(10).pow(await usdc.decimals())
      )
    );

    uniswap_router_v2 = uniswap_router_v2.connect(addr1);
    await usdc
      .connect(addr1)
      .approve(UNISWAP_ROUTER, ethers.BigNumber.from(10).pow(48));

    await uniswap_router_v2.swapExactTokensForTokens(
      ethers.BigNumber.from(10).pow(6 + 5),
      1,
      [USDC, token.address],
      addr1.address,
      1_000_000_000_000
    );

    expect((await token.balanceOf(addr1.address)).isZero()).not.to.be.true;
    console.log(
      (await token.balanceOf(addr1.address)).div(
        ethers.BigNumber.from(10).pow(await token.decimals())
      )
    );
    console.log(
      (await usdc.balanceOf(addr1.address)).div(
        ethers.BigNumber.from(10).pow(await usdc.decimals())
      )
    );
  });
});
