import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

// import { Idoru } from "../typechain/index";
import {
  Idoru,
  Idoru__factory,
  RoleNames,
  RoleNames__factory,
  ERC20Bank,
  ERC20Bank__factory,
} from "../typechain";

describe("Idoru token", function () {
  let token: Idoru;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addr4: SignerWithAddress;

  let ROLES_NAMES: RoleNames;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    [owner, addr1, addr2, addr3, addr4].forEach(async (add) => {
      await network.provider.send("hardhat_setBalance", [
        add.address,
        ethers.BigNumber.from(10).pow(24).toHexString(),
      ]);
    });
  });

  beforeEach(async function () {
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
    expect(await token.symbol()).to.equal("IDORU");
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
    // console.log(await token.hasRole(wizard, owner.address));

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
    expect(token_addr1.unVerifyAddress(addr1.address)).to.be.reverted;
  });

  it("minHoldingValue; normal 1", async function () {
    // MinHoldingValue function check

    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(5);
    await token_addr1.delegate(addr1.address);
    await token.transfer(addr1.address, initial_balance.div(10));
    // initial neutral blocks
    const M = 10;
    for (let index = 0; index < M; index++) {
      await token.transfer(addr1.address, initial_balance.div(M).div(100));
    }
    await token_addr1.transfer(addr2.address, initial_balance.div(10));

    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(50))
    ).to.be.false;
  });

  it.only("minHoldingValue; general test", async function () {
    // MinHoldingValue function check

    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(5);
    await token_addr1.delegate(addr1.address);

    const N = 5; // Initial neutral blocks
    for (let index = 0; index < N; index++) {
      await token.transfer(addr2.address, initial_balance.div(N).div(1000));
    }

    await token.transfer(addr1.address, initial_balance.div(10));
    
    const M = 5; // Neutral blocks
    for (let index = 0; index < M; index++) {
      await token.transfer(addr2.address, initial_balance.div(M).div(50));
    }

    // sell funds so should not get dividends
    await token_addr1.transfer(addr2.address, initial_balance.div(10));

    //await token.transfer(addr2.address, initial_balance.div(50));
    // for (let index = 0; index < M; index++) {
    //   await token.transfer(addr2.address, initial_balance.div(M).div(50));
    // }

    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(50))
    ).to.be.false;
  });

  it.skip("minHoldingValue; normal 2", async function () {
    // MinHoldingValue function check

    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(10);
    await token_addr1.delegate(addr1.address);
    await token.transfer(addr1.address, initial_balance.div(10));

    //expect(
    //  (await token.minHoldingValue(addr1.address)).lt(initial_balance.div(50))
    //).to.be.true; // Not enough blocks

    // Neutral blocks
    const M = 10;
    for (let index = 0; index < M; index++) {
      await token.transfer(addr2.address, initial_balance.div(M).div(50));
    }
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(50))
    ).to.be.true;
    await token.transfer(addr1.address, initial_balance.div(10));
    // Neutral blocks
    for (let index = 0; index < M; index++) {
      await token.transfer(addr2.address, initial_balance.div(M).div(50));
    }
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(21))
    ).to.be.true;
  });

  it.skip("minHoldingValue; no checkpoints", async function () {
    // MinHoldingValue; expect to be reverted "No checkpoints"

    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token_addr1.delegate(addr1.address);

    expect(
      (await token.minHoldingValue(addr1.address)).lt(
        initial_balance.div(initial_balance)
      ) // greater than 0
    ).to.be.true; // Enough blocks after delegation
  });

  it.skip("minHoldingValue, late delegation", async function () {
    // MinHoldingValue function check for late delegation
    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(10);
    await token.transfer(addr1.address, initial_balance.div(10));
    // initial neutral blocks
    const M = 10;
    for (let index = 0; index < M; index++) {
      await token.transfer(addr2.address, initial_balance.div(M).div(50));
    }
    await token_addr1.delegate(addr1.address);
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(11))
    ).to.be.false; // Too late delegation
    for (let index = 0; index < M; index++) {
      await token.transfer(addr2.address, initial_balance.div(M).div(50));
    }
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(11))
    ).to.be.true; // Enough blocks after delegation
  });

  it.skip("MinHoldingValue: exactly enough blocks", async function () {
    // 2 tests: 1 block short, exactly enough

    const token_addr1 = token.connect(addr1);
    const token_addr2 = token.connect(addr2);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(10);
    await token_addr1.delegate(addr1.address); // delegate after some blocks. Delegation trigger checkpoint
    await token.transfer(addr1.address, initial_balance.div(5));
    // neutral blocks
    const j = 9;
    for (let index = 0; index < j; index++) {
      await token.transfer(addr3.address, initial_balance.div(j).div(50));
    }
    // 1 tx short:
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(10))
    ).to.be.false;

    await token.transfer(addr3.address, initial_balance.div(50));
    // Exactly enough
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(10))
    ).to.be.true;
  });

  it.skip("MinHoldingValue: changing MinHoldingBlocks", async function () {
    // Test edge cases when changin required holding time

    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(5);
    await token_addr1.delegate(addr1.address);
    await token.transfer(addr1.address, initial_balance.div(5));
    // Neutral blocks
    const j = 10;
    for (let index = 0; index < j; index++) {
      await token.transfer(addr3.address, initial_balance.div(j).div(50));
    }
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(10))
    ).to.be.true;

    await token.changeMinHoldingBlocks(20); // Increase required holding time, next 'expect' to be false
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(10))
    ).to.be.false;

    await token.changeMinHoldingBlocks(1);
    await token.transfer(addr1.address, initial_balance.div(2));
    await token.transfer(addr2.address, initial_balance.div(100)); // Neutral tx/ block
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(3))
    ).to.be.true;
  });

  it("MinHoldingValue: multiple txs", async function () {
    // Checks for sales, txs between traders not only direct ones

    const token_addr1 = token.connect(addr1);
    const token_addr2 = token.connect(addr2);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(9);
    await token_addr1.delegate(addr1.address);
    await token_addr2.delegate(addr2.address);

    await token.transfer(addr1.address, initial_balance.div(2));
    await token_addr1.transfer(addr2.address, initial_balance.div(4));
    // Neutral blocks
    const j = 10;
    for (let index = 0; index < j; index++) {
      await token.transfer(addr3.address, initial_balance.div(j).div(100));
    }
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(5))
    ).to.be.true; // he has 1/4 of supply
    expect(
      (await token.minHoldingValue(addr2.address)).gt(initial_balance.div(5))
    ).to.be.true;

    await token_addr1.transfer(token.address, initial_balance.div(5));
    for (let index = 0; index < j; index++) {
      await token.transfer(addr3.address, initial_balance.div(j).div(100));
    }
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(25))
    ).to.be.true;
  });

  it("Subscribe dividends", async function () {
    // Just to see if subscribeDividends function is working same as delegate function
    const token_addr1 = token.connect(addr1);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(9);
    await token_addr1.subscribeDividends();
    await token.transfer(addr1.address, initial_balance.div(5));
    // neutral blocks
    const j = 10;
    for (let index = 0; index < j; index++) {
      await token.transfer(addr3.address, initial_balance.div(j).div(50));
    }
    expect(
      (await token.minHoldingValue(addr1.address)).gt(initial_balance.div(10))
    ).to.be.true;
  });

  it.skip("subscribeDividends vs delegate", async function () {
    // Potential collision between subscribeDividends and delegate
    const token_addr1 = token.connect(addr1);
    const token_addr2 = token.connect(addr2);
    const initial_balance = await token.balanceOf(owner.address);
    await token.changeMinHoldingBlocks(10);
    await token_addr1.delegate(addr1.address);
    await token_addr2.subscribeDividends();
    await token_addr1.subscribeDividends();
    await token_addr2.delegate(addr2.address);

    await token.transfer(addr1.address, initial_balance.div(5));
    await token.transfer(addr2.address, initial_balance.div(5));
    // neutral blocks
    const j = 10;
    for (let index = 0; index < j; index++) {
      await token.transfer(addr3.address, initial_balance.div(j).div(50));
    }
    expect(
      (await token.minHoldingValue(addr1.address)) > initial_balance.div(10)
    ).to.be.true;
    expect(
      (await token.minHoldingValue(addr2.address)) > initial_balance.div(10)
    ).to.be.true;
  });

  it.skip("subscribeDividends, already subscribed", async function () {
    // Potential collision between subscribeDividends and delegate; expect already subscribed revert
    const token_addr1 = token.connect(addr1);
    const token_addr2 = token.connect(addr2);
    await token_addr1.delegate(addr1.address);
    await token_addr1.subscribeDividends();
    await token_addr2.subscribeDividends();
    await token_addr2.delegate(addr2.address);
  });
});
