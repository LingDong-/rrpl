// rrpl/comile.js
// expand all references and fallback glyphs in a rrpl .json file

// usage: $node compile.js path/to/input.json path/to/fallback.json path/to/output.json

var fs = require('fs');
var parser = require('./rrpl_parser');

function main(dict,fdict){
    parser.preprocess(dict)
    console.log("step 1/3")
    parser.preprocess(fdict,dict);
    console.log("step 2/3")
    Object.assign(dict,fdict);
    console.log("step 3/3")
    return dict
}
//input file
var file_in  = (process.argv[3] != undefined) ? process.argv[3]: 'dist/min-trad.json'

//fallback file
var file_fb = (process.argv[4] != undefined) ? process.argv[4]: 'dist/min-trad-fallback.json'

//output file
var file_out = (process.argv[5] != undefined) ? process.argv[5]: 'dist/min-trad-compiled.json'

fs.readFile(file_in, 'utf8', function(err, contents0) {
    fs.readFile(file_fb, 'utf8', function(err, contents1) {
        fs.writeFile(file_out, JSON.stringify(
            main(JSON.parse(contents0),JSON.parse(contents1))
        ), function(err) {});
    });
});