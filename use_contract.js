var Web3 = require('web3');
var web3 = new Web3();

var provider = new web3.providers.HttpProvider('http://localhost:8545');
web3.setProvider(provider);

var GreeterContract = require('./modified-files-deployed/Greeter.sol.js');
GreeterContract.setProvider(provider);
GreeterContract.defaults({from:web3.eth.accounts[1]});

var contractAddress = process.argv[2];
//var contractAddress = '0x4c8111ef6ed8a678c6ffd4f2bcb798a657aad19f';
//var contractInstance = GreeterContract.at(contractAddress);
GreeterContract.new().then(function(contractInstance) {
    contractInstance
    .innerGreet.call().then(function(result) {
        console.log('contract inner greeter: '+result);
    }).catch(function(err) {
        console.log("Error executing contract!");
        console.log(err.stack);
    });
    contractInstance
    .greet.call().then(function(result) {
        console.log('contract greeter: '+result);
    }).catch(function(err) {
        console.log("Error executing contract!");
        console.log(err.stack);
    });
}).catch(function(){console.log('Error on new():',arguments);});
