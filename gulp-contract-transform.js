var through = require('through2');
var gutil = require('gulp-util');
var graphlib = require('graphlib');
var Graph = require("graphlib").Graph;
var Web3 = require('web3');
var solc = require('solc');
var Pudding = require('ether-pudding');
var PluginError = gutil.PluginError;

// consts
const PLUGIN_NAME = 'gulp-contract-transform';

var contractTransform = {};

var createContractFile = function(contract,name) {
    name = name || contract.contract_name;
    var newFile = new gutil.File({
        cwd: "",
        base: "",
        path: name+'.sol.js',
        contents: new Buffer(contract)
    });
    return newFile;
};

var deployContract = function(web3,g,contract,account,gas) {
    gutil.log('Deploying:',contract.contract_name);
    var regex = /__([^_]*)_*/g;
    var match;
    while(match = regex.exec(contract.binary)) {
        var address = g.node(match[1]).address.slice(2);
        //gutil.log(match[0],address);
        contract.binary = contract.binary
        .replace(RegExp(match[0],'g'),address);
    }

    contract.setProvider(web3.currentProvider);
    contract.defaults({ from: account, gas: gas });
    var deployedContract = contract.new(contract,{});
    //gutil.log(contract.address,account);
    deployedContract = deployedContract.then(function(contractInstance) {
        gutil.log('Contract deployed with address:',contractInstance.address);
        contract.address = contractInstance.address;
        //return contractInstance;
        return contract;
    }).catch(function(err) {
        console.log("Error deploying contract!");
        console.log(err.stack);
    });

    return deployedContract;
};

contractTransform.compileContracts = function() {

    var g = new Graph();

    var stream = through.obj(function(file, enc, cb) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return cb();
        }

        if (file.isBuffer()) {
            var contractSrc = file.contents.toString();
            var filename = file.path.slice(file.base.length);
            //gutil.log(filename);
            g.setNode(filename,contractSrc);

            var regex = /import\s+["']([^"']+)["']/g;
            var match;
            while(match = regex.exec(contractSrc)) {
                //gutil.log(filename,match[1]);
                g.setEdge(filename,match[1]);
            }
        }
        //this.push(file)
        cb();
    },function(cb) {
        gutil.log('Compiling contracts...');
        if(!graphlib.alg.isAcyclic(g)) {
            gutil.log(gutil.colors.red('THROW AN ERROR HERE! THERE ARE CYCLES!'));
        } else {
            var orderedNodes = graphlib.alg.topsort(g).reverse();
            var source = orderedNodes.reduce(function(obj,filename) {
                obj[filename] = g.node(filename)
                .replace(/\/\/[^\n]*\n/g,' ')
                .replace(/\n/g,' ')
                .replace(/\/\*[^\*]*\*\//g,' ')
                .replace(/\s+/g,' ');

            //gutil.log(obj[filename]);
                return obj;
            },{});

            var compiled = solc.compile({sources:source}, 1);
            //gutil.log(compiled);
            //gutil.log(Object.keys(compiled));

            var contractNameArray = Object.keys(compiled.contracts);
            contractNameArray.forEach(function(name) {
                var interface = compiled.contracts[name].interface;
                var bytecode = compiled.contracts[name].bytecode;

                var contract_data = {
                    abi: JSON.parse(interface),
                    binary: bytecode,
                    unlinked_binary: bytecode
                };
                //gutil.log(name);
                var contract = Pudding.generate(name,contract_data);

                /*var newFile = new gutil.File({
                    cwd: "",
                    base: "",
                    path: name+'.sol.js',
                    contents: new Buffer(contract)
                });
                this.push(newFile)*/
                this.push(createContractFile(contract,name));
                gutil.log('Contract JS created for',name);
            }.bind(this));
        }
        cb();
    });
    return stream;
};

contractTransform.deployContracts = function(providerURL,account,gas) {

    var web3 = new Web3();
    providerURL = providerURL || 'http://localhost:8545';
    var provider = new web3.providers.HttpProvider(providerURL);
    web3.setProvider(provider);
    account = account || web3.eth.accounts[0];
    gas = gas || 300000;

    var g = new Graph();

    var stream = through.obj(function(file, enc, cb) {
        if (file.isStream()) {
            this.emit('error',
                      new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return cb();
        }

        if (file.isBuffer()) {
            var filename = file.path.slice(file.base.length);
            //gutil.log(filename);
            var contractJS = require(file.path);//JSON.stringify(file.contents.toString());
            //gutil.log(contractJS.contract_name);
            //gutil.log(contractJS);
            g.setNode(contractJS.contract_name,contractJS);
            //gutil.log(contractSrc);
            var regex = /__([^_]*)_*/g;

            var match;
            while(match = regex.exec(contractJS.binary)) {
                //gutil.log(contractJS.contract_name,match[1]);
                g.setEdge(contractJS.contract_name,match[1]);
            }
        }
        //this.push(file)
        cb();
    },function(cb) {
        gutil.log('Deploying contracts...');
        if(!graphlib.alg.isAcyclic(g)) {
            gutil.log(gutil.colors.red('THROW AN ERROR HERE! THERE ARE CYCLES!'));
        } else {
            var orderedNodes = graphlib.alg.topsort(g).reverse();
            var lastProm = orderedNodes.reduce(function(promise,contractName) {
                var contract = g.node(contractName);
                var deployFunc = deployContract.bind(this,web3,g,contract,account,gas);
                if(promise) promise = promise.then(deployFunc);
                else promise = deployFunc()
                    return promise.then(function(x){

                        var name = x.contract_name
                        var contract_data = {
                            abi: x.abi,
                            binary: x.binary,
                            unlinked_binary: x.unlinked_binary
                        };
                        var contract = Pudding.generate(name,contract_data);

                        this.push(createContractFile(contract,name));
                    }.bind(this));
            }.bind(this),null);
            //run cb after it ended creating all the contracts
            lastProm.then(function(){
                gutil.log('All contracts deployed!');
                cb();
            });
        }
        //cb();
    });
    return stream;
};

// exporting the plugin main function
module.exports = contractTransform;
