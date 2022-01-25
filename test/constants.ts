export const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const routerABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
];
export const tokenABI = [
  "function approve(address spender, uint amount) public returns(bool)",
  "function balanceOf(address who) public view returns(uint)",
  "function transfer(address to, uint amount) public returns(bool)",
  "function transferFrom(address from, address to, uint amount) public returns(bool)",
  "function decimals() public view returns(uint)",
];
