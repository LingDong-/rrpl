// generate a fallback file given two character sets

var fs = require('fs')
function loadFile(filepath,callback){
    fs.readFile(filepath, function (err, data) {
      if (err) {
        throw err; 
      }
      return callback(data);
    });
}
function listKeys(frompath){
    var ret = loadFile(frompath,function(file){
        
        var dict = JSON.parse(file)
        var result = ""

        for (var k in dict){
            result += k+" "
        }
        console.log(result);
    })
}
function mergeMap(path, tradpath, simppath, callback){
    loadFile(path,function(file){
        loadFile(tradpath,function(tradfile){
            loadFile(simppath,function(simpfile){
                var mapper = {}
                var dict = JSON.parse(file)
                var trads = tradfile.toString().split(" ");
                var simps = simpfile.toString().split(" ");
                for (var i = 0; i < simps.length; i++){
                    if (!(simps[i] in dict) && (trads[i] in dict)){
                        mapper[simps[i]] = trads[i]
                    }
                }
                callback(mapper)
            })
        })
    })    
}


mergeMap("min-trad.json","trad-map.txt","simp-map.txt",console.log)