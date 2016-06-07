var solc = require('solc');
var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();

var contractName = 'Greeter';
var source = fs.readFileSync(__dirname+'/'+contractName+'.sol').toString().replace(/\n/g,' ');
//console.log(source);

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

//var compiled = web3.eth.compile.solidity(source);
//console.log(compiled); 

var compiled = solc.compile(source, 1);
//console.log(compiled);
var bytecode = compiled.contracts[contractName].bytecode;
var interface = compiled.contracts[contractName].interface;
//console.log(interface); 

var accounts = web3.eth.accounts;
//console.log(accounts);

var transaction = {
    from: accounts[0],
    data: bytecode,
    gas: 300000
};

var ether_before = web3.fromWei(web3.eth.getBalance(accounts[0]), "ether");

var MyContract = web3.eth.contract(interface);
MyContract.abi = JSON.parse(MyContract.abi); //WHY???
//console.log(MyContract.abi);

var myContractInstance = MyContract.new('hello!',transaction);/*,function(error,ci) {
    if(!error) {
        if(!ci.address) {
            //first call, hash created
            console.log(ci.address);
        } else {
            //second call, contract deployed
            var ci2 = MyContract.at(ci.address);
            console.log(ci2);
        }
    }
    });*/
var createdAtBlock = web3.eth.blockNumber;
console.log(myContractInstance.address);
setTimeout(function() {
    console.log('after timeout!');
    console.log(myContractInstance.address);
    console.log(myContractInstance.greet.call());
},3000);

var ether_after = web3.fromWei(web3.eth.getBalance(accounts[0]), "ether");
 console.log(ether_after.minus(ether_before).toString(10) + ' ether');
 console.log(web3.toWei(ether_after.minus(ether_before)).toString(10) + ' wey');
