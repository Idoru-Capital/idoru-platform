import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";
import { Contract } from "ethers";

import {
  ERC20Bank,
  ERC20Bank__factory,
  Idoru,
  PresaleMinter,
  PresaleMinter__factory,
  Idoru__factory,
  RoleNames,
  RoleNames__factory,
  IdoruStableCoin,
  IdoruStableCoin__factory,
} from "../typechain";

import {
  routerABI,
  TEN,
  tokenABI,
  UNISWAP_ROUTER,
  USDC,
  WETH,
} from "./constants";
import { expect } from "chai";

describe.only("Idoru minter Contract", function () {
  let token: Idoru;
  let idoruStablecoin: IdoruStableCoin;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;

  let bank: ERC20Bank;

  let usdc: Contract;

  let presaleMinter: PresaleMinter;

  let ROLES_NAMES: RoleNames;

  this.beforeAll(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

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
    presaleMinter = await new PresaleMinter__factory(owner).deploy(
      token.address,
      USDC,
      idoruStablecoin.address,
      bank.address
    );
    await presaleMinter.deployed();

    // easier to test with this
    await token.changeMinHoldingBlocks(ethers.BigNumber.from(5));

    // have tp gramt IdoruMinter contract minting permission
    await token.grantRole(await ROLES_NAMES.MINTER(), presaleMinter.address);
  });

  /**
   * Test if price calculation is correct
   */
  it("price calculation test", async function () {
    // transfer some USDC to the deployer
    // const beast_USDC = await ethers.getSigner(
    //   "0x7abE0cE388281d2aCF297Cb089caef3819b13448"
    // );

    expect(
      (
        await presaleMinter.getIdoruPresaleAmountOut(
          TEN.pow(await usdc.decimals()),
          usdc.address
        )
      ).eq(TEN.pow((await token.decimals()) - 1))
    ).to.be.false; // check if price is 1 to 1

    expect(
      (
        await presaleMinter.getIdoruPresaleAmountOut(
          TEN.pow(await usdc.decimals()),
          idoruStablecoin.address
        )
      ).eq(TEN.pow((await token.decimals()) - 1))
    ).to.be.false;

    expect(
      (
        await presaleMinter.getIdoruPresaleAmountOut(
          TEN.pow(await usdc.decimals()),
          usdc.address
        )
      ).eq(TEN.pow(await token.decimals()))
    ).to.be.true; // check if price is 1 to 1 in USDC (6 decimals)

    expect(
      (
        await presaleMinter.getIdoruPresaleAmountOut(
          TEN.pow(await idoruStablecoin.decimals()),
          idoruStablecoin.address
        )
      ).eq(TEN.pow(await token.decimals()))
    ).to.be.true; // check if price is 1 to 1 in idoru Stablecoin (18 decimals)

    expect(
      presaleMinter.getIdoruPresaleAmountOut(
        TEN.pow(await usdc.decimals()),
        WETH
      )
    ).to.be.reverted;
  });

  /**
   * Test Idoru Minter presale with IdoruStablecoin
   */
  it("idoruMinter presale with IdoruStablecoin", async function () {
    const idoruStablecoin_1 = idoruStablecoin.connect(addr1);
    const presaleMinter_1 = presaleMinter.connect(addr1);

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
      presaleMinter.address,
      ethers.constants.MaxUint256
    );

    expect((await token.balanceOf(addr1.address)).isZero()).to.be.true;

    const transferAmount = await idoruStablecoin.balanceOf(addr1.address);

    // user is not KYCed yet
    await expect(
      presaleMinter_1.mintIdoruPresale(transferAmount, idoruStablecoin.address)
    ).to.be.reverted;

    await token.verifyAddress(addr1.address);

    // mint too many tokens -> have to rise the presale limit
    await expect(
      presaleMinter_1.mintIdoruPresale(transferAmount, idoruStablecoin.address)
    ).to.be.reverted;

    await presaleMinter.setPresaleTokensToMint(
      ethers.BigNumber.from(10).pow(6 + (await token.decimals())) // we can mint 1 million tokens
    );
    // await token.pause();
    await presaleMinter_1.mintIdoruPresale(
      transferAmount,
      idoruStablecoin.address
    );

    // bank recieves the funds
    expect(await idoruStablecoin_1.balanceOf(bank.address)).to.be.equal(
      transferAmount
    );
    // console.log(await token.balanceOf(addr1.address));
    expect(
      (await token.balanceOf(addr1.address)).eq(
        ethers.BigNumber.from(10).pow(3 + (await token.decimals()))
      )
    ).to.be.true;
  });

  /**
   * token not supported test
   */
  it("token not supported test", async function () {
    // deploy Idoru Minter contract without support for our stablecoin
    presaleMinter = await new PresaleMinter__factory(owner).deploy(
      token.address,
      USDC,
      ethers.constants.AddressZero,
      bank.address
    );
    await presaleMinter.deployed();

    const idoruStablecoin_1 = idoruStablecoin.connect(addr1);
    const presaleMinter_1 = presaleMinter.connect(addr1);

    await presaleMinter.setPresaleTokensToMint(
      ethers.BigNumber.from(10).pow(6 + (await token.decimals())) // we can mint 1 million tokens
    );

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
      presaleMinter.address,
      ethers.constants.MaxUint256
    );

    expect((await token.balanceOf(addr1.address)).isZero()).to.be.true;

    // user is not KYCed yet
    await expect(
      presaleMinter_1.mintIdoruPresale(
        await idoruStablecoin.balanceOf(addr1.address),
        idoruStablecoin.address
      )
    ).to.be.reverted;

    await token.verifyAddress(addr1.address);

    // token is not supported -> we did not deploy with IdoruStable in constructor!
    await expect(
      presaleMinter_1.mintIdoruPresale(
        await idoruStablecoin.balanceOf(addr1.address),
        idoruStablecoin.address
      )
    ).to.be.revertedWith("Token not supported");
  });
});
