// rrpl/compress.js
//
// compress a rrpl .json file to binary file (~half in size)

/*
0 = 0
1 = 1
2 = 2
3 = 3
4 = 4
5 = 5
6 = 6
7 = 7
8 = 8
9 = unused
a = -
b = |
c = (
d = )
e = ref
f = delim
*/

var fs = require('fs')

var to_halfbyte = {
    "0" : "0",
    "1" : "1",
    "2" : "2",
    "3" : "3",
    "4" : "4",
    "5" : "5",
    "6" : "6",
    "7" : "7",
    "8" : "8",
    "-" : "a",
    "|" : "b",
    "(" : "c",
    ")" : "d",
}
var from_halfbyte = {
    "0" : "0",
    "1" : "1",
    "2" : "2",
    "3" : "3",
    "4" : "4",
    "5" : "5",
    "6" : "6",
    "7" : "7",
    "8" : "8",
    "a" : "-",
    "b" : "|",
    "c" : "(",
    "d" : ")",
}

function isop(x){
  return ["|","-"].indexOf(x) != -1
}

function loadFile(filepath,callback){
    fs.readFile(filepath, function (err, data) {
      if (err) {
        throw err; 
      }
      return callback(data);
    });
}

//https://unicodebook.readthedocs.io/unicode_encodings.html
function decode_utf16_pair(units)
{
    // assert(0xD800 <= units[0] && units[0] <= 0xDBFF);
    // assert(0xDC00 <= units[1] && units[1] <= 0xDFFF);
    var code = 0x10000;
    code += (units[0] & 0x03FF) << 10;
    code += (units[1] & 0x03FF);
    return code;
}

function encode_utf16_pair(character)
{
    var code; var units = [];
    // assert(0x10000 <= character && character <= 0x10FFFF);
    code = (character - 0x10000);
    units[0] = 0xD800 | (code >> 10);
    units[1] = 0xDC00 | (code & 0x3FF);
    return units;
}

function key2hex(k){
    var kh = k.charCodeAt(0).toString(16).padStart(5,"0");
    if (k.length > 1){
      kh = decode_utf16_pair([k.charCodeAt(0),k.charCodeAt(1)]) . toString(16);
    }
    return kh
}

function hex2key(h){
    if (h[0] == "0"){
        return String.fromCharCode(parseInt(h,16));
    }else{
        var pair = encode_utf16_pair(parseInt(h,16));
        return String.fromCharCode(pair[0])+String.fromCharCode(pair[1])
    }
}

// Convert a hex string to a byte array
// https://stackoverflow.com/questions/14603205/
//   how-to-convert-hex-string-into-a-bytes-array-and-a-bytes-array-in-the-hex-strin
function hexToBytes(hex) {
    var bytes = []
    for (var c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return new Uint8Array(bytes);
}


function encodeRRPL(frompath,topath){
    var ret = loadFile(frompath,function(file){
        
        var dict = JSON.parse(file)
        var result = ""

        console.log(":::");
        for (var k in dict){
            var res = "";
            var i = 0;
            var ucb = "";
            while (i < dict[k].length){
                var c = dict[k][i]
                var isab = Object.keys(to_halfbyte).includes(c)
                if (!isab){
                    ucb += c;
                }
                if (ucb != "" && (i == dict[k].length-1 || isab )){
                    res += "e"+key2hex(ucb)
                    ucb = "";
                }
                if (isab){
                    res += to_halfbyte[c]
                }
                i++;
            }

            res = "f"+key2hex(k)+res;
            console.log(k,res)
            result += res;
        }
        var rbytes = hexToBytes(result)
        fs.writeFile(topath, rbytes, (err) => {console.log('written.');});
    })
}

function decodeRRPL(frompath,callback){
    var ret = loadFile(frompath,function(file){
        var hexstr = file.toString('hex');
        var result = ""
        var i = 0;
        while (i < hexstr.length){
            if (hexstr[i] == "f"){
                result += '","'+hex2key(hexstr.slice(i+1,i+6))+'":"'
                i += 6;
            }else if (hexstr[i] == "e"){
                // console.log(hexstr.slice(i+1,i+6))
                result += hex2key(hexstr.slice(i+1,i+6))
                i += 6;
            }else{
                result += from_halfbyte[hexstr[i]];
                i += 1;
            }
        }
        result = '{'+result.slice(2) + '"}'
        callback(JSON.parse(result));
    })
}

module.exports = {
    decodeRRPL:decodeRRPL,
    encodeRRPL:encodeRRPL,
    hex2key:hex2key,
    key2hex:key2hex,
}

