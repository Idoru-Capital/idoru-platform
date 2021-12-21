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

  let ROLES_NAMES: RoleNames;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

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

    await token.verifyAddress(addr1.address);

    expect(await token.isVerified(addr1.address)).to.be.true;
  });

  it.only("Balance tracker", async function () {
    // Don't have to deal with approving
    const token_addr1 = token.connect(addr1);

    const initial_balance = await token.balanceOf(owner.address);

    await token.transfer(addr1.address, 1);

    await token.changeMinHoldingBlocks(50);

    expect(
      token.hasEnoughBuyingPower(owner.address, initial_balance.div(2))
    ).to.be.revertedWith("no checkpoints");

    // expect(await token.hasEnoughBuyingPower(owner.address));

    //! have to self delegate
    await token.delegate(owner.address);
    await token_addr1.delegate(addr1.address);

    expect(
      await token.hasEnoughBuyingPower(owner.address, initial_balance.div(2))
    ).to.be.true;

    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(2))
    ).to.be.false;

    const N = 100;
    for (let index = 0; index < N; index++) {
      await token.transfer(addr1.address, initial_balance.div(N).div(2));
    }

    expect(
      await token.hasEnoughBuyingPower(
        owner.address,
        initial_balance.mul(10).div(15)
      )
    ).to.be.false;

    expect(
      await token.hasEnoughBuyingPower(owner.address, initial_balance.div(3))
    ).to.be.true;

    expect(
      await token.hasEnoughBuyingPower(addr1.address, initial_balance.div(2))
    ).to.be.true;

    // await token_addr.transfer(owner.address, 100);
    // console.log(await token.balanceOf(addr1.address));

    // console.log(await token.getCheckPoints(owner.address));
    // // console.log(await token.getCheckPoints(ethers.constants.AddressZero));
    // console.log(await token.getCheckPoints(addr1.address));

    console.log(await token.numCheckpoints(owner.address));
    // console.log(await token.numCheckpoints(owner.address));

    // await token.delegate(ethers.constants.AddressZero);
    // // console.log(await token.numCheckpoints(addr1.address));
    // // console.log(await token.allCheckpoints(owner.address));
    // console.log(await token.numCheckpoints(owner.address));

    await token_addr1.transfer(owner.address, 10000);
  });
});
