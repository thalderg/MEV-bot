# encode_mev_bot

June 04, 2023

This is a team project for the project week of the Encode Solidity Bootcamp. We deploy an ERC20 token $MATH and add liquidity in Uniswap V2 and Sushiswap pools. We also write a script that monitors the Goerli mempool to detect transactions involving our token, do an analysis on their price impacts and, ideally, trade using that information.


1) DeployMatheusToken.ts is deploying the contract with the token on Goerli
2) mintAddLiquidity.ts is minting and adding liquidity on Sushiswap and Uniswap v2 in pair with WETH Goerli
3) Swap.ts is emulating a swap from a user that will be front-run by the bot
4) Scanner.js is scanning the mempool to spot arbitrage opportunity
5) ArbitrageLogic.js is the bot itself