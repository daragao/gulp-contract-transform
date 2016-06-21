# gulp-contract-transform

> Compile and Deploy your Ethereum contracts with Gulp :) (this uses solc for the compilation and ether-pudding for deployment)

*Any issues just shot me and email or something

## Install

```
npm install --save-dev gulp-contract-transform
```

## Usage

```
var gulp = require('gulp');
var contractTransform = require('gulp-contract-transform');

gulp.task('default', function() {
});

gulp.task('compile', function() {
    gulp.src('contracts/**/*.sol')
    .pipe(contractTransform.compileContracts())
    .pipe(gulp.dest('compiled-contracts'))
});

gulp.task('deploy', function() {
    gulp.src('compiled-contracts/**/*.sol.js')
    .pipe(contractTransform.deployContracts())
    .pipe(gulp.dest('deployed-contracts'))
});
```

## Example of usage of a contract that has been deployed

```
var Web3 = require('web3');
var web3 = new Web3();
var GreeterContract = require('./deployed-contracts/Greeter.sol.js');

var provider = new web3.providers.HttpProvider('http://localhost:8545');
web3.setProvider(provider);

GreeterContract.setProvider(provider);
GreeterContract.defaults({from:web3.eth.accounts[1]});

var contractAddress = process.argv[2];
//var contractAddress = '0x4c8111ef6ed8a678c6ffd4f2bcb798a657aad19f';
//var contractInstance = GreeterContract.at(contractAddress);
GreeterContract.new('hello').then(function(contractInstance) {
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
```
