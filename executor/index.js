require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');

const schedule = require('node-schedule');

// Inject Web3
var web3 = new Web3(new Web3.providers.HttpProvider(process.env.Executor_httpProvider),null,{
    defaultBlock: 'latest',
    defaultGas: 20000,
    defaultGasPrice: 1,
    transactionBlockTimeout: 50,
    transactionConfirmationBlocks: 12,
    transactionPollingTimeout: 480,
});



// Contract definition and account setting
const ABI = JSON.parse(fs.readFileSync('ABI.json'));
const rebaseContract = new web3.eth.Contract(ABI, process.env.Executor_contractAddress)
const account = web3.eth.accounts.privateKeyToAccount(process.env.Executor_privateKey);
const reqConfirmations = process.env.Executor_reqConfirmations;
const chainId = process.env.Executor_chainId;


// const job = schedule.scheduleJob('* 10 * * *', function(){
//     console.log('Rebasing now ....');
//     rebase()
// });

const job = schedule.scheduleJob('0 * * * * *', async function(){
    console.log('Rebasing now ....');
    await rebase()
});



async function rebase(){
    var nonce = await web3.eth.getTransactionCount(account.address,'pending');

    await rebaseContract.methods.rebase().estimateGas({
        from: account.address,
    })
    .then(function(gasAmount){
        //console.log(gasAmount);
    })
    .catch(async function(error){
        console.log(error)
        return;
    });

    var byteCode = rebaseContract.methods.rebase().encodeABI()
    var tx = {
        to: rebaseContract.options.address,
        gas: 3000000,
        data: byteCode,
        nonce: nonce,
        chainId: chainId
    }

    var signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    if(receipt.transactionHash) {
        console.log('Success rebase ' + receipt.transactionHash)
    } else{
        console.log('Error sending transaction');
    }
}