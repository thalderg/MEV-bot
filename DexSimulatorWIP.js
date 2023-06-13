const ethers = require("ethers");

const provider = new ethers.providers.WebSocketProvider(
  "wss://goerli.infura.io/ws/v3/845041c982504a089d1f73b93196f756"
);
const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

let genesis = {
  AMM1: { A1: 0, A2: 0, s: 0, fee: 0.02 },
  AMM2: { A1: 0, A2: 0, s: 0, fee: 0.02 },
  Trader: { A1: 0, A2: 100, s: 0 },
  LP: { A1: 0, A2: 0, s: 0 },
};

function swapToAsset1(state, inputs, ammKey) {
  let agent = inputs[0];
  let dA2 = inputs[1];
  let feeFactor = 1 - state[ammKey]["fee"];
  let dA1 =
    (state[ammKey]["A1"] / (state[ammKey]["A2"] + dA2 * feeFactor)) *
    dA2 *
    feeFactor;

  if (dA2 > 0 && state[agent]["A2"] - dA2 >= 0) {
    state[ammKey]["A2"] += dA2;
    state[agent]["A2"] -= dA2;
    state[ammKey]["A1"] -= dA1;
    state[agent]["A1"] += dA1;
  }
}

const token1Address = "0xeD61FD27F19b55bf78701D6a9e8B4Eb7834B198B";
const token2Address = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const UniPoolAddress1 = "0xbe4007c8aC6E2Bf2Bc0670056062DE540C57C121";
const UniPoolAddress2 = "0xYourSecondPoolAddressHere";

let token1Contract = new ethers.Contract(token1Address, tokenABI, provider);
let token2Contract = new ethers.Contract(token2Address, tokenABI, provider);

async function getContractValues(ammKey, uniPoolAddress) {
  let token1Balance = await token1Contract.balanceOf(uniPoolAddress);
  let token2Balance = await token2Contract.balanceOf(uniPoolAddress);

  genesis[ammKey].A1 = parseFloat(ethers.utils.formatEther(token1Balance));
  genesis[ammKey].A2 = parseFloat(ethers.utils.formatEther(token2Balance));
}

async function compareProfitability(state, dA2) {
  let initialAsset1 = state.Trader.A1;
  swapToAsset1(state, ["Trader", dA2], "AMM1");
  let afterFirstTrade = state.Trader.A1;
  swapToAsset1(state, ["Trader", dA2], "AMM2");
  let afterSecondTrade = state.Trader.A1;

  console.log(`Asset1 after first trade: ${afterFirstTrade}`);
  console.log(`Asset1 after second trade: ${afterSecondTrade}`);

  if (afterSecondTrade > afterFirstTrade) {
    console.log("Trading with both pools is more profitable.");
  } else if (afterSecondTrade < afterFirstTrade) {
    console.log("Trading with the first pool is more profitable.");
  } else {
    console.log("Both trading strategies yield the same profit.");
  }

  // Reset Trader's Asset1 to initial value for further simulation
  state.Trader.A1 = initialAsset1;
}

getContractValues("AMM1", UniPoolAddress1)
  .then(() => {
    console.log("Pool 1: ", genesis.AMM1);
    return getContractValues("AMM2", UniPoolAddress2);
  })
  .then(() => {
    console.log("Pool 2: ", genesis.AMM2);
    compareProfitability(genesis, 10);
  });
