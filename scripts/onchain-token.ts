/**
 * Test the contracts on test chain
 */
import { ethers } from "hardhat";
import {
  // Idoru,
  Idoru__factory,
  // RoleNames,
  // RoleNames__factory,
} from "../typechain";

// import IdoruABI from "../artifacts/contracts/Idoru.sol/Idoru.json";

// https://data-seed-prebsc-1-s1.binance.org:8545
const IDORU_ADDRESS = "0xd48300a2ffd2a84334204dc43d91ef60da2d8349";

async function main() {
  const [deployer] = await ethers.getSigners();

  //   console.log("Deploying contracts with the account:", deployer.address);

  //   console.log("Account balance:", (await deployer.getBalance()).toString());

  //   const tokenFactory = new Idoru__factory(deployer);
  //   const token = await tokenFactory.deploy();
  //   await token.deployed();

  // const token: Idoru = new Idoru(
  //   "0xD48300A2FFD2a84334204DC43d91Ef60dA2d8349",
  //   IdoruABI.abi
  // );

  const token = new Idoru__factory(deployer).attach(IDORU_ADDRESS);
  console.log(await token.balanceOf(deployer.address));

  // await token.delegate(deployer.address);
  console.log(await token.numCheckpoints(deployer.address));

  // await token.burnFrom(100);

  //   console.log("Token address:", token.address);

  //   const uni = new ethers.Contract(
  //     UNISWAP,
  //     [
  //       "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  //     ],
  //     wallet
  //   );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
