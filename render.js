// rrpl/render.js
//
// various rendering utilities
//
// usage:
// 1. generate a preview.html containing a rendering of all characters in a rrpl .json file:
//    $node render.js preview path/to/input.json
//
// 2. generate a realtime.html where user inputs are parsed and rendered interactively
//    $node render.js realtime path/to/input.json
//

/*

 1_2_3
 |\|/|
8|-+-|4
 |/|\|
 7 6 5

*/

function renderChar (L,args){
  var args = (args != undefined) ?  args : {};
  var xof = (args.xof != undefined) ?  args.xof : 0;
  var yof = (args.yof != undefined) ?  args.yof : 0;
  var wid = (args.wid != undefined) ?  args.wid : 100;
  var hei = (args.hei != undefined) ?  args.hei : 100;
  var col = (args.col != undefined) ?  args.col : "black";
  var gri = (args.gri != undefined) ?  args.gri : false;

  var render = function(l,col){
    return "<g stroke='"+col+"' stroke-width='3'>"+
      l.map(x=>("<line x1='"+Math.round(x[0]*wid+xof)+"' y1='"+Math.round(x[1]*hei+yof)
                   +"' x2='"+Math.round(x[2]*wid+xof)+"' y2='"+Math.round(x[3]*hei+yof)+
                "'/>"))
      +"</g>"
  }
  var canv = ""
  if (gri){
    canv += render(parser.toLines(parser.toRects(L).map(
      x=>x.split(",").slice(0,4).join(",")+",12345678"
    )),"#EDEDED")
  }
  gri = false
  canv +=render(parser.toLines(parser.toRects(L)),col)
  return canv
}


function draw(dict){
  var canv = "";
  var x = 0
  var y = 0
  var xmax = 0
  var ymax = 0
  var cnt = 0
  for (var k in dict){
    if (k.indexOf("`") == -1 && dict[k].length > 0){
      cnt ++;
      var parsed = parser.parse(dict[k])
      console.log(k)
      console.log(parsed)
      canv += renderChar(parsed,{xof:x,yof:y,gri:true,wid:100,hei:100})
      canv += "<text x='"+x+"' y='"+y+"'>"+k+"</text>"
      y += 120
      if (y > 6400){
        y = 0
        x += 120
      }
    }
    xmax = Math.max(x+120,xmax)
    ymax = Math.max(y+120,ymax)
  }
  console.log(cnt)
  canv = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "+xmax+" "+ymax+"'>" + canv + "</svg>";
  return canv;
}


function preview(dict){
  parser.preprocess(dict)
  var d = `<!--this file is generated; do not edit-->
  <meta http-equiv="content-type" content="application/xhtml+xml; charset=utf-8"/>`
  +draw(dict)
  fs.writeFile("preview.html", d, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("written.");
  });
}

function realtime(dict){

  parser.preprocess(dict)

  var update_func_str = (function update(){
    var val = document.getElementById("IN").value
    if (val != lastval){
      lastval = val;
      var vlist = val.replace(new RegExp("\\n", 'g'),"").split("$").slice(0,maxchr);
      var vdict = {}
      for (var i = 0; i < vlist.length; i++){
        vdict["_"+i] = vlist[i];
      }
      preprocess(vdict,dict)

      for (var i = 0; i < maxchr; i++){
       
        try{
          var result = renderChar(parse(vdict["_"+i]),{gri:true,xof:28,yof:28,wid:200,hei:200});
          document.getElementById("OUT"+i).innerHTML = result
          document.getElementById("OUT"+i).style.backgroundColor = "white"
        }catch (e){
          document.getElementById("OUT"+i).innerHTML = ""
          document.getElementById("OUT"+i).style.backgroundColor = (i < vlist.length) ? "pink" : "white"
        }
        
      }
    }
    setTimeout(update,500);
  }).toString();
  var htm = `
    <!--this file is generated; do not edit-->
    <meta http-equiv="content-type" content="application/xhtml+xml; charset=utf-8"/>
    <span id="OUT"></span>
    <br>
    <textarea id="IN" style="width:1290px; height:256px; font-size: 24px; font-family: Courier;">`
    +`(1|78|17|15)-(月)-(46|(幺)|(長)|(75|0))-(148|(言)|(馬)|(1|14))-(68|(幺)|(長)|(5|18))-(刂)$`+
    `</textarea>
    <script>parser={parse:parse,toRects:toRects,toLines:toLines};`
    +parser.preprocess.toString()
    +parser.isop.toString()
    +parser.parse.toString()
    +parser.pure.toString()
    +parser.toLines.toString()
    +parser.toRects.toString()
    +renderChar.toString()
    +"var dict="+JSON.stringify(dict)+";"
    +`
    var maxchr = 5;
    var lastval = "";
    for (var i = 0; i < maxchr; i++){
      document.getElementById("OUT").innerHTML+=
      "<svg id='OUT"+i+"' style='border: 1px solid black; width:256px; height:256px'></svg>"
    }
    `+update_func_str+`
    update();
    console.log("init.")
    </script>
  `
  fs.writeFile("interactive.html", htm, function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("written.");
  });
}

function count(s,a){
  var cnt = 0;
  for (var i = 0; i < s.length; i++){
    if (s[i] == a){
      cnt += 1;
    }
  }
  return cnt;
}

function single(X){
  var vdict = {"_0":X}
  parser.preprocess(vdict,JSON.parse(fs.readFileSync("dist/min-trad-compiled.json")))
  var conf = {gri:true,xof:14,yof:14,wid:100,hei:100,col:"black"}
  var c = "";
  while (count(vdict["_0"], "(") < count(vdict["_0"],")")){
    vdict["_0"]="("+vdict["_0"]
  }
  for (var j = 0; j < 10; j++){
    try{
      c = renderChar(parser.parse(vdict["_0"]),conf)
      break;
    }catch (e){
      vdict["_0"]+=")"
    }
  }
  return "<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>"+c+"</svg>"  
}



if (typeof process === "object"){
  var fs = require('fs');
  var parser = require('./rrpl_parser');
  console.log(single("((口)-(口))|(甲)|十"))
  if (process.argv[2] == "preview"){
    fs.readFile(process.argv[3], 'utf8', function(err, contents) {
        preview(JSON.parse(contents))
    });
  }else if (process.argv[2] == "realtime"){
    fs.readFile(process.argv[3], 'utf8', function(err, contents) {
        realtime(JSON.parse(contents))
    });
  }
}
