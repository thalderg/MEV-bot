const ethers = require('ethers');

const provider = new ethers.providers.WebSocketProvider("wss://goerli.infura.io/ws/v3/845041c982504a089d1f73b93196f756");
const tokenABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];


let genesis = {
    AMM: {A1: 0, A2: 0, s: 0, fee: 0.02},
    Trader: {A1: 0, A2: 100, s: 0},
    LP: {A1: 0, A2: 0, s: 0}
};

function swapToAsset1(state, inputs) {
    let agent = inputs[0];
    let dA2 = inputs[1];
    let feeFactor = 1 - state["AMM"]["fee"];
    let dA1 = (state["AMM"]["A1"] / (state["AMM"]["A2"] + dA2 * feeFactor)) * dA2 * feeFactor;

    if (dA2 > 0 && state[agent]["A2"] - dA2 >= 0) {
        state["AMM"]["A2"] += dA2;
        state[agent]["A2"] -= dA2;
        state["AMM"]["A1"] -= dA1;
        state[agent]["A1"] += dA1;
    }
}


const token1Address = "0xeD61FD27F19b55bf78701D6a9e8B4Eb7834B198B"
const WethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
const UniPoolAddress = "0xbe4007c8aC6E2Bf2Bc0670056062DE540C57C121"

let token1Contract = new ethers.Contract(token1Address, tokenABI, provider);
let token2Contract = new ethers.Contract(token2Address, tokenABI, provider);

async function getContractValues() {
    let token1Balance = await token1Contract.balanceOf(UnioolAddress);
    let token2Balance = await token2Contract.balanceOf(UnipoolAddress);


    genesis.AMM.A1 = parseFloat(ethers.utils.formatEther(token1Balance));
    genesis.AMM.A2 = parseFloat(ethers.utils.formatEther(token2Balance));
}

getContractValues().then(() => {
    console.log(genesis);
});


