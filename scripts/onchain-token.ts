/**
 * Test the contracts on test chain
 */
import { ethers as ethers_t } from "ethers";
import { ethers } from "hardhat";
import { TEN } from "../test/constants";
import {
  Idoru,
  // IdoruMinter__factory,
  PresaleMinter__factory,
  // Idoru,
  Idoru__factory,
  RoleNames,
  IdoruStableCoin__factory,
  // RoleNames,
  // RoleNames__factory,
} from "../typechain";
import { mumbaiAddresses } from "./config";

// import IdoruABI from "../artifacts/contracts/Idoru.sol/Idoru.json";

const setPresaleLimit = async (signer: ethers_t.Signer) => {
  const minter = new PresaleMinter__factory(signer).attach(
    mumbaiAddresses.presaleMinterAddress
  );
  const token = new Idoru__factory(signer).attach(mumbaiAddresses.idoruAddress);

  const tx = await minter.setPresaleTokensToMint(
    ethers.BigNumber.from(TEN.pow((await token.decimals()) + 2))
  );
  console.log(tx);
  const reciept = await tx.wait();
  console.log(reciept);
};

const burnAll = async (token: Idoru, address: string) => {
  console.log(await token.decimals());

  await token.burn(await token.balanceOf(address));

  console.log("Token address:", token.address);

  console.log(await token.balanceOf(address));
};

const giveMinterPermissions = async (signer: ethers_t.Signer) => {
  const minter = new PresaleMinter__factory(signer).attach(
    mumbaiAddresses.presaleMinterAddress
  );
  const token = new Idoru__factory(signer).attach(mumbaiAddresses.idoruAddress);

  const tx = await token.grantRole(
    "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9",
    minter.address
  );
  console.log(tx);
  const reciept = await tx.wait();
  console.log(reciept);
};

const verifyUserAddBalance = async (
  signer: ethers_t.Signer,
  address: string
) => {
  const token = new Idoru__factory(signer).attach(mumbaiAddresses.idoruAddress);
  const stablecoin = new IdoruStableCoin__factory(signer).attach(
    mumbaiAddresses.idoruStableAddress
  );

  const tx = await token.verifyAddress(address);

  const tx1 = await stablecoin.mint(
    address,
    TEN.pow(2 + (await stablecoin.decimals()))
  );

  await Promise.all([tx.wait(), tx1.wait()]);
  console.log("User address:", address, "added");
};

async function main() {
  const [deployer] = await ethers.getSigners();

  const token = new Idoru__factory(deployer).attach(
    mumbaiAddresses.idoruAddress
  );
  console.log(await token.balanceOf(deployer.address));

  // await token.verifyAddress("0x7CEba73a42916077C30FBBc7cB82A1fb3A48d173");

  if (!(await token.isVerified(deployer.address))) {
    console.log("User is not KYCed yet");

    await token.subscribeDividends();
    await token.verifyAddress(deployer.address);

    console.log(await token.numCheckpoints(deployer.address));

    console.log(`User ${deployer.address} is now KYCed`);
  }

  // await setPresaleLimit(deployer);
  // await giveMinterPermissions(deployer);

  // await verifyUserAddBalance(
  //   deployer,
  //   "0x7f7B1CD0fCf2aDdFF3459dbE1cA42be23c089036"
  // );

  // burnAll(token, deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
