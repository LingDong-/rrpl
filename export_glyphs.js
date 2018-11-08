var fs = require('fs');
var parser = require('./rrpl_parser');
var compressor = require('./compress');

var PI = Math.PI
var cos = Math.cos
var sin = Math.sin

function dist(x0,y0,x1,y1){

    return Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2))
}

function flat2tuple(L){
    var result = []
    for (var i = 0; i < L.length; i+=2){
        result.push([L[i],L[i+1]])
    }
    return result;
}

function sameLine(x0,y0,x1,y1,x2,y2){
    var a=  x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1)
    return Math.abs(a) < 0.0001;
}
function angleBetween(x0,y0,x1,y1,x2,y2){
    var a0 = Math.atan2(y2-y1,x2-x1)
    var a1 = Math.atan2(y1-y0,x1-x0)
    return Math.abs(a0-a1)
}

function one2polylines(S){
    var lines = parser.toLines(parser.toRects(parser.parse(S))).map(x=>flat2tuple(x));
    // console.log(lines)
    // console.log("\n\n\n\n")
    var joined = lines.map(x=>false);

    for (var i = 0; i < lines.length; i++){
        if (!joined[i]){
            var redo = true;
            while (redo){
                redo = false;
                for (var j = 0; j < lines.length; j++){
                    if (!joined[j] && i != j){
                        var fbi = [lines[i],lines[i].slice().reverse()]
                        var fbj= [lines[j],lines[j].slice().reverse()]
                        var bk = false;
                        for (var ki = 0; ki < fbi.length; ki++){
                            for (var kj = 0; kj < fbj.length; kj++){
                                var d = dist(
                                    fbi[ki][fbi[ki].length-1][0],
                                    fbi[ki][fbi[ki].length-1][1],
                                    fbj[kj][0][0],
                                    fbj[kj][0][1])
                                var a = angleBetween(
                                    fbi[ki][fbi[ki].length-2][0],
                                    fbi[ki][fbi[ki].length-2][1],
                                    fbj[kj][0][0],
                                    fbj[kj][0][1],
                                    fbj[kj][1][0],
                                    fbj[kj][1][1],
                                    )

                                if (d < 0.01 && a < Math.PI/4){
                                    if (a < 0.001){
                                        lines[i] = fbi[ki].slice(0,-1).concat(fbj[kj].slice(1));
                                    }else{
                                        lines[i] = fbi[ki].concat(fbj[kj].slice(1));
                                    }
                                    joined[j] = true;
                                    redo = true;
                                    bk = true;
                                    break;
                                }
                            }
                            if (bk){break;}
                        }
                    }
                }
            }
        }
    }
    
    var lines = lines.filter((x,i)=>(!joined[i]));
    // console.log(lines)
    return lines
}


function tubify(args){
  var args = (args != undefined) ? args : {};
  var pts = (args.pts != undefined) ? args.pts : [];
  var wid = (args.wid != undefined) ? args.wid : (x)=>(10);
  var vtxlist0 = []
  var vtxlist1 = []
  var vtxlist = []
  for (var i = 1; i < pts.length-1; i++){
    var w = wid(i/pts.length)
    var a1 = Math.atan2(pts[i][1]-pts[i-1][1],pts[i][0]-pts[i-1][0]);
    var a2 = Math.atan2(pts[i][1]-pts[i+1][1],pts[i][0]-pts[i+1][0]);
    var a = (a1+a2)/2;
    if (a < a2){a+=PI}
    vtxlist0.push([pts[i][0]+w*cos(a),(pts[i][1]+w*sin(a))]);
    vtxlist1.push([pts[i][0]-w*cos(a),(pts[i][1]-w*sin(a))]);
  }
  var l = pts.length-1
  var a0 = Math.atan2(pts[1][1]-pts[0][1],pts[1][0]-pts[0][0]) - Math.PI/2;
  var a1 = Math.atan2(pts[l][1]-pts[l-1][1],pts[l][0]-pts[l-1][0]) - Math.PI/2;
  var w0 = wid(0)
  var w1 = wid(1)
  vtxlist0.unshift([pts[0][0]+w0*Math.cos(a0),(pts[0][1]+w0*Math.sin(a0))])
  vtxlist1.unshift([pts[0][0]-w0*Math.cos(a0),(pts[0][1]-w0*Math.sin(a0))])
  vtxlist0.push([pts[l][0]+w1*Math.cos(a1),(pts[l][1]+w1*Math.sin(a1))])
  vtxlist1.push([pts[l][0]-w1*Math.cos(a1),(pts[l][1]-w1*Math.sin(a1))])
  return [vtxlist0,vtxlist1]
}

function previewPolylines(P){
    var result = "<path d='";
    for (var i = 0; i < P.length; i++){
        for (var j = 0; j < P[i].length; j++){
            if (j == 0){
                result += "M "
            }else{
                result += "L "
            }
            var x = Math.round(P[i][j][0]*1000)
            var y = Math.round(P[i][j][1]*1000)
            result += x + " " + y + " "
        }
        // result += "z "
    }
    result += "' stroke-width='10' stroke='black' fill='none'/>"
    return result;
}
function drawOutlinedPolylines(P,args){
    var args = (args != undefined) ?  args : {};
    var strw = (args.strw != undefined) ?  args.strw : 16;
    var csize = (args.csize != undefined) ?  args.csize : 1000;
    var pad = (args.pad != undefined) ?  args.pad : 80;
    var transf = function(x,y){
        return [
            Math.round(x * (csize-pad*2) + pad),
            Math.round(y * (csize-pad*2) + pad),
        ]
    }
    var result = ""
    for (var i = 0; i < P.length; i++){
        result += "<path d='";
        var tube = tubify({pts:P[i],wid:x=>strw/csize})
        var half = tube[0].length;
        tube = tube[0].concat(tube[1].slice().reverse())

        for (var j = 0; j < tube.length+1; j++){
            if (j == 0){
                result += "M "
            }else if (j == half || j == half*2){
                result += "A "+Math.floor(strw/2)+" "+Math.floor(strw/2)+" 0 0 1 "
            }else{
                result += "L "
            }
            var x = tube[j%tube.length][0]
            var y = tube[j%tube.length][1]
            var [x,y] = transf(x,y);
            result += x + " " + y + " "
        }
        result += "z' />"
    }
    return result
}

function main(dict, toFolder, isCompiled){
  if (!isCompiled){
    parser.preprocess(dict)
  }
  dict["。"] = "0-(0|((0-47-48-58-0)|(35-0-0-0-17)|(0-14-48-38-0))|0)-0";
  for (var k in dict){
    if (!dict[k].length){
        continue;
    }
    process.stdout.write(k);
    var ret = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'>"
        + drawOutlinedPolylines(one2polylines(dict[k]))
        + "</svg>"
    fs.writeFile(toFolder+"/"+compressor.key2hex(k)+".svg", ret, function(err) {
    });
  }
}

var file_in = (process.argv[2] != undefined) ? process.argv[2]: 'dist/min-trad-compiled.json'
var file_out = (process.argv[3] != undefined) ? process.argv[3]: 'svg'
var is_compiled = (process.argv[4] != undefined) ? process.argv[4]-0: 1

fs.readFile(file_in, 'utf8', function(err, contents) {
    main(JSON.parse(contents),file_out,is_compiled)
});



