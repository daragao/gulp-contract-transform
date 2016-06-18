var through = require('through2');
var gutil = require('gulp-util');
var graphlib = require('graphlib');
var Graph = require("graphlib").Graph;
var solc = require('solc');
var Pudding = require('ether-pudding');
var PluginError = gutil.PluginError;

// consts
const PLUGIN_NAME = 'gulp-contract-transform';

var contractTransform = {};

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
        this.push(file)
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

                var newFile = new gutil.File({
                    cwd: "",
                    base: "",
                    path: name+'.sol.js',
                    contents: new Buffer(contract)
                });
                this.push(newFile)
                gutil.log('Contract JS created for',name);
            }.bind(this));
        }
        cb();
    });
    return stream;
};

contractTransform.deployContracts = function() {

    var g = new Graph();

    var stream = through.obj(function(file, enc, cb) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
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
        cb();
    },function(cb) {
        gutil.log('Deploying contracts...');
        if(!graphlib.alg.isAcyclic(g)) {
            gutil.log(gutil.colors.red('THROW AN ERROR HERE! THERE ARE CYCLES!'));
        } else {
            var orderedNodes = graphlib.alg.topsort(g).reverse();
            orderedNodes.forEach(function(contractName) {
                //gutil.log(contractName);
                var contract = g.node(contractName);
                var regex = /__([^_]*)_*/g;
                var reLib;
                var match;
                while(match = regex.exec(contract.binary)) {
                    var address = '<<<<<<<<HELLOADDRESS>>>>>>>>>>';
                    reLib = RegExp(match[0],'g')
                    contract.binary = contract.binary.replace(reLib,address);
                    gutil.log(contract.binary);
                }
            });
            //gutil.log(orderedNodes);
        }
        cb();
    });
    return stream;
};

// exporting the plugin main function
module.exports = contractTransform;
