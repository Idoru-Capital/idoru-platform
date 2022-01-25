import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract } from "ethers";

// import * as uniswap from "@uniswap/v2-sdk";

// import { Idoru } from "../typechain/index";
import {
  Idoru,
  Idoru__factory,
  RoleNames,
  RoleNames__factory,
  // ERC20Bank,
  // ERC20Bank__factory,
  // IdoruMinter,
  // IdoruMinter__factory,
} from "../typechain";

import { routerABI, tokenABI, UNISWAP_ROUTER, USDC, WETH } from "./constants";

describe.only("Platform", function () {
  let token: Idoru;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;

  let uniswap_router_v2: Contract;
  let weth: Contract;
  let usdc: Contract;

  let ROLES_NAMES: RoleNames;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    uniswap_router_v2 = new ethers.Contract(UNISWAP_ROUTER, routerABI, owner);

    weth = new ethers.Contract(WETH, tokenABI, owner);
    usdc = new ethers.Contract(USDC, tokenABI, owner);

    await network.provider.send("hardhat_setBalance", [
      owner.address,
      ethers.BigNumber.from(10).pow(24).toHexString(),
    ]);
  });

  beforeEach(async function () {
    const tokenFactory = new Idoru__factory(owner);
    token = await tokenFactory.deploy();
    await token.deployed();

    const constantsFactory = new RoleNames__factory(owner);
    ROLES_NAMES = await constantsFactory.deploy();
    await ROLES_NAMES.deployed();
  });

  it("Test Network", async function () {
    console.log(await ethers.provider.getBalance(owner.address));

    await weth.approve(UNISWAP_ROUTER, ethers.BigNumber.from(10).pow(24));

    console.log(await weth.balanceOf(owner.address));

    await uniswap_router_v2.swapExactETHForTokens(
      1,
      [WETH, USDC],
      owner.address,
      1_000_000_000_000,
      {
        value: ethers.BigNumber.from(10).pow(18),
      }
    );

    console.log(
      ethers.BigNumber.from(await usdc.balanceOf(owner.address)).div(
        await usdc.decimals()
      )
    );
  });
});
