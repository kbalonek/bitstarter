#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require("restler");
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var URL_DEFAULT = "http://whispering-wildwood-1454.herokuapp.com/";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); /* http://nodejs.org/api/process.html#process_process_exit_code*/
    }
    return instr;
};

var validate = function($, checksArr){
    var out = {};
    for(var ii in checksArr) {
	var present = $(checksArr[ii]).length > 0;
	out[checksArr[ii]] = present;
    }
    return out;
};

var buildRestFn = function(url, checksfile){

    var getDocument = function(result, response) {

	if (result instanceof Error) {
	    console.error("%s does not exist. Exiting.", url);
	    process.exit(1);
	} else {
	    logJson(checkHtmlString(result, checksfile));
	}
    } ;
    return getDocument;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    console.log("* loadChecks: checksfile="+checksfile);
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlString = function(htmlString, checksfile) {
    $ = cheerio.load(htmlString);
    var checks = loadChecks(checksfile).sort();
    return validate($, checks);
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    return validate($, checks);
};

var clone = function(fn) {
    /* Workaround for commander.js issue.
     http://stackoverflow.com/a/6772648 */
    return fn.bind({});
};

var processUrl = function(url, checksfile) {
    console.log("* processUrl: "+url+", "+checksfile);
    var loadAndCheck = buildRestFn(url, checksfile);
    restler.get(url).on('complete', loadAndCheck);
    console.log("checked");
};

var logJson = function(obj) {
    var outJson = JSON.stringify(obj, null, 4);
    console.log(outJson);
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>',
		'Path to checks.json',
		clone(assertFileExists),
		CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>',
		'Path to index.html',
		clone(assertFileExists),
		HTMLFILE_DEFAULT)
	.option('-u, --url <url>',
		'URL to index.html')
	.parse(process.argv);
    if (typeof program.url === "undefined") {
	logJson(checkHtmlFile(program.file, program.checks));
    } else {
	console.log("checking "+program.url);
	processUrl(program.url, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
