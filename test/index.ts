import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

// import { Idoru } from "../typechain/index";
import {
  Idoru,
  Idoru__factory,
  RoleNames,
  RoleNames__factory,
} from "../typechain";

describe("Idoru token", function () {
  let token: Idoru;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;

  let ROLES_NAMES: RoleNames;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const tokenFactory = new Idoru__factory(owner);
    token = await tokenFactory.deploy();
    await token.deployed();

    const constantsFactory = new RoleNames__factory(owner);
    ROLES_NAMES = await constantsFactory.deploy();
    await ROLES_NAMES.deployed();
  });

  it("Should make supply and manipulate it", async function () {
    // const [owner, addr1] = await ethers.getSigners();
    const [addr1] = await ethers.getSigners();

    expect(await token.name()).to.equal("Idoru");
    expect(await token.symbol()).to.equal("IDRU");
    expect(await token.decimals()).to.equal(18);

    await token.transfer(addr1.address, 100);

    // transfer tokens somewhere else, reounce ownership and try mint again
    await token.transfer(addr1.address, 100);
    await token.renounceRole(await ROLES_NAMES.MINTER(), owner.address);
    await expect(token.mint(addr1.address, 100)).to.be.reverted;
  });

  it("Should whitelist", async function () {
    //! Default owner gets all the roles
    // const wizard = await ROLES_NAMES.WIZARD();
    // console.log(wizard);
    // await token.grantRole(wizard, owner.address);

    expect(await token.isVerified(addr1.address)).to.be.false;
    expect(await token.isVerified(owner.address)).to.be.false;
    await token.verifyAddress(addr1.address);
    await token.verifyAddress(owner.address);
    expect(await token.isVerified(addr1.address)).to.be.true;
    expect(await token.isVerified(owner.address)).to.be.true;
    await token.unVerifyAddress(addr1.address);
    expect(await token.isVerified(addr1.address)).to.be.false;

    const token_addr1 = token.connect(addr1);
    // await token_addr1.verifyAddress(addr1.address);
    await token_addr1.unVerifyAddress(addr1.address);
  });

  it.only("Balance tracker 2", async function () {
    const token_addr1 = token.connect(addr1);
    // const token_addr2 = token.connect(addr2);
    const initial_balance = await token.balanceOf(owner.address);
    // const token_addr3 = token.connect(addr3);
    await token.changeMinHoldingBlocks(50);
    await token_addr1.delegate(addr1.address);
    await token.transfer(addr1.address, 100);

    const N = 100;
    for (let index = 0; index < N; index++) {
      await token.transfer(addr2.address, initial_balance.div(N).div(50));
    }

    console.log(await token.minHoldingBlocks());
    await token.transfer(addr1.address, 50);
    //await token_addr1.transfer(addr1.address, initial_balance.div(6));
    // expect(
    //   await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(2))
    // ).to.be.false;
    //await token.delegate(owner.address);

    //await token_addr2.delegate(addr2.address);

    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(10))
    ).to.be.true;
  });

  it("Balance tracker", async function () {
    // Don't have to deal with approving
    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);

    //! have to self delegate
    await token.delegate(owner.address);
    await token_addr1.delegate(addr1.address);

    await token.changeMinHoldingBlocks(50);
    console.log(await token.minHoldingBlocks());
    await token.transfer(addr1.address, initial_balance.div(4));

    // expect(await token.hasEnoughBuyingPower(owner.address));

    expect(
      await token.hasEnoughBuyingPower(owner.address, initial_balance.div(2))
    ).to.be.true;

    expect(
      await token.hasEnoughBuyingPower(
        owner.address,
        initial_balance.div(4).mul(3)
      )
    ).to.be.true;

    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(2))
    ).to.be.false;

    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(4))
    ).to.be.true;

    const N = 100;
    for (let index = 0; index < N; index++) {
      await token.transfer(addr1.address, initial_balance.div(N).div(4));
    }

    expect(
      await token.hasEnoughBuyingPower(owner.address, initial_balance.div(2))
    ).to.be.true;
    expect(
      await token.hasEnoughBuyingPower(
        owner.address,
        initial_balance.div(3).mul(2)
      )
    ).to.be.false;
    expect(
      await token.hasEnoughBuyingPower(owner.address, initial_balance.div(3))
    ).to.be.true;
    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(2))
    ).to.be.true;
    expect(
      await token.hasEnoughBuyingPower(
        addr1.address,
        initial_balance.div(3).mul(2)
      )
    ).to.be.false;

    await token_addr1.transfer(owner.address, initial_balance.div(2));
    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(5))
    ).to.be.false;
    // console.log(await token.balanceOf(addr1.address));
    // console.log(await token.getCheckPoints(addr1.address));
    console.log("__");
    console.log(await token.numCheckpoints(addr1.address));
    console.log(await token.numCheckpoints(owner.address));
    //console.log(await token.getCheckPoints(owner.address));

    //await token_addr1.transfer(owner.address, 10000);
  });

  it("Balance tracker, delegate before or right after", async function () {
    // delegate before, delegate right after tx
    const token_addr1 = token.connect(addr1);
    const token_addr2 = token.connect(addr2);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(10);

    // initial neutral blocks
    const M = 20;
    for (let index = 0; index < M; index++) {
      await token.transfer(addr3.address, initial_balance.div(M).div(50));
    }

    await token_addr1.delegate(addr1.address);
    await token.transfer(addr1.address, initial_balance.div(5));
    await token.transfer(addr2.address, initial_balance.div(5));
    await token_addr2.delegate(addr2.address); // delegate after tx

    const N = 10;
    for (let index = 0; index < N; index++) {
      await token.transfer(addr3.address, initial_balance.div(N).div(50));
    }
    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(10))
    ).to.be.true;

    expect(
      await token.hasEnoughBuyingPower(addr2.address, initial_balance.div(10))
    ).to.be.true; // delegated right after is ok
  });

  it("Balance tracker, delegate after some time", async function () {
    // delegate after some time
    const token_addr1 = token.connect(addr1);
    const token_addr2 = token.connect(addr2);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(10);

    // initial neutral blocks
    const M = 20;
    for (let index = 0; index < M; index++) {
      await token.transfer(addr3.address, initial_balance.div(M).div(50));
    }

    await token.transfer(addr1.address, initial_balance.div(5));
    await token.transfer(addr2.address, initial_balance.div(5));

    // neutral blocks
    const j = 10;
    for (let index = 0; index < j; index++) {
      await token.transfer(addr3.address, initial_balance.div(j).div(50));
    }
    await token_addr1.delegate(addr1.address); // delegate after some blocks. Delegation trigger checkpoint

    await token_addr2.delegate(addr2.address); // delegate after some blocks but then send "blank" tx
    await token.transfer(addr2.address, 5); // blank tx to trigger checkpoint. -> no need or change in outcome

    // neutral blocks
    const N = 10;
    for (let index = 0; index < N; index++) {
      await token.transfer(addr3.address, initial_balance.div(N).div(50));
    }

    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(10))
    ).to.be.true;

    expect(
      await token.hasEnoughBuyingPower(addr2.address, initial_balance.div(10))
    ).to.be.true;
  });

  it("Balance tracker. Enough balance too late to delegate", async function () {
    // Cases without delegation or too late delegation

    const token_addr1 = token.connect(addr1);
    // const token_addr2 = token.connect(addr2);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(10);

    // initial neutral blocks
    const M = 20;
    for (let index = 0; index < M; index++) {
      await token.transfer(addr2.address, initial_balance.div(M).div(50));
    }

    await token.transfer(addr1.address, initial_balance.div(5));
    await token.transfer(addr2.address, initial_balance.div(5));
    // initial neutral blocks
    const N = 20;
    for (let index = 0; index < N; index++) {
      await token.transfer(addr2.address, initial_balance.div(N).div(50));
    }

    await token_addr1.delegate(addr1.address); // too late delegation
    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(10))
    ).to.be.false;
    expect(
      await token.hasEnoughBuyingPower(addr2.address, initial_balance.div(10))
    ).to.be.false; // no delegation, "votes not enough"
  });

  it.only("Balance tracker. Changing different MinHoldingBlocks", async function () {
    // Cases without delegation or too late delegation

    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(30);
    await token_addr1.delegate(addr1.address);

    // initial neutral blocks
    const M = 20;
    for (let index = 0; index < M; index++) {
      await token.transfer(addr2.address, initial_balance.div(M).div(50));
    }

    await token.transfer(addr1.address, initial_balance.div(5));

    // initial neutral blocks
    const N = 10;
    for (let index = 0; index < N; index++) {
      await token.transfer(addr2.address, initial_balance.div(N).div(50));
    }
    // expect(
    //   await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(10))
    // ).to.be.false;  // not enough blocks between "votes not enough"

    await token.changeMinHoldingBlocks(5);

    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(10))
    ).to.be.true;
  });
});
