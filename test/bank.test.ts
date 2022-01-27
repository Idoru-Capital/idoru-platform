import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

// import { Idoru } from "../typechain/index";
import {
  Idoru,
  Idoru__factory,
  RoleNames,
  RoleNames__factory,
  ERC20Bank,
  ERC20Bank__factory,
} from "../typechain";

describe.skip("Bank", function () {
  let token: Idoru;
  let bank: ERC20Bank;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const tokenFactory = new Idoru__factory(owner);
    token = await tokenFactory.deploy();
    await token.deployed();

    const bank_factory = new ERC20Bank__factory(owner);
    bank = await bank_factory.deploy();
    await bank.deployed();
  });

  it("Test bank", async function () {
    const bank_non_owner = bank.connect(addr1);

    const bankAddress = bank.address;

    expect((await token.balanceOf(bankAddress)).isZero()).to.be.true;

    await token.transfer(bankAddress, 10_000);
    expect((await token.balanceOf(bankAddress)).eq(10_000)).to.be.true;

    //? no need to approve
    // expect(bank.borrowTokens(token.address, 5_000)).to.be.reverted();
    // token.approve(bankAddress, 5_000);

    await bank.withdrawTokens(token.address, 5_000);

    expect((await token.balanceOf(bankAddress)).eq(5_000)).to.be.true;

    console.log(
      await token.balanceOf(owner.address),
      await token.balanceOf(bankAddress)
    );

    expect(await bank_non_owner.isBankUser(addr1.address)).to.be.false;
    expect(
      bank_non_owner.withdrawTokens(token.address, 5_000)
    ).to.be.revertedWith("Not a bank user");

    //? we don't need it I think
    // bank.destruct();
    // expect((await token.balanceOf(bankAddress)).isZero()).to.be.true;
    // expect((await token.balanceOf(bankAddress)).eq(10_000)).to.be.true;
  });
});
