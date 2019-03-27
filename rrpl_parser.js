// rrpl/rrpl_parser.js
//
// main parsing logic
// usage: toLines(toRects(parse("...")))

/*

 1_2_3
 |\|/|
8|-+-|4
 |/|\|
 7 6 5

*/

// check if string doesn't contain references
function pure(s){
 var chars = /^[0-8|()-]+$/;
 if(s.match(chars))
  return true;
 else
  return false;
}


// expand all references
function preprocess(dict, src_dict){
  if (src_dict == undefined){
    src_dict = dict
  }
  for (var k in dict){
    var trials = 50
    while(!pure(dict[k]) && trials > 0){
      trials -= 1;
      for (var k0 in src_dict){
        dict[k] = dict[k].replace(new RegExp(k0, 'g'),src_dict[k0])
      }
    }
  }
}

// is packing operator?
function isop(x){
  return ["|","-"].indexOf(x) != -1
}

// parse a string into tree structure
function parse(x){
  var isp = function(x){
    return ["(",")"].includes(x)
  }
  var ins = function(x,L,fun){
    if (L.length > 0 && typeof L[0] == "object"){
      return [ins(x,L[0],fun)].concat(L.slice(1))
    }else{
      return fun(x,L)
    }
  }
  var jump = function(x,L){
    if (L.length > 0 && typeof L[0] == "object"){
      if (L[0].length > 0 && typeof L[0][0] != "object"){
        return [x].concat(L)
      }
    }
    return [jump(x,L[0])].concat(L.slice(1))
  }
  var listify = function(x){
    if (x.length == 0){
      return []
    }
    var car = x[0]
    var cdr = x.slice(1)

    var res = listify(cdr)
    if (car == ")"){
      res = ins([],res,(x,L)=>[x].concat(L))
    }else if (car == "("){
      res = jump("$",res)
    }else if (isop(car)){
      res = ins(car,res,(x,L)=>[x].concat(L))
    }else{
      res = ins(car,res,(x,L)=>
        (L.length==0 || isop(L[0]))? [x].concat(L) : [x+L[0]].concat(L.slice(1))
      )
    }
    return res
  }
  var clean = function(x,L){
    return L.filter((y)=>typeof y=="object"?true:x!=y)
      .map((y)=>typeof y=="object"?clean(x,y):y)
  }
  var pfxop = function(L){
    if (typeof L != "object"){
      return L
    }
    if (L.length == 1){
      return pfxop(L[0])
    }
    return [L.filter(x=>isop(x)).join("")].concat(L.filter(x=>!isop(x)).map(pfxop))

  }
  return pfxop(clean("$",listify(x)))
}

// generate a intermediate `rects` object from the `parse()` result
function toRects (L){

  function recMap (f,L){
    return L.map((y)=>typeof y=="object"?recMap(f,y):f(y))
  }

  var CL = function(s,i,t){
    var x = s.split(",").map(parseFloat)
    return ""+[i+x[0]*t,x[1],i+x[2]*t,x[3],x[4]]
  }
  var CU = function(s,i,t){
    var x = s.split(",").map(parseFloat)
    return ""+[x[0],i+x[1]*t,x[2],i+x[3]*t,x[4]]
  }
  if (typeof L == "string"){
    return ["0,0,1,1,"+L]
  }
  var f = (L[0].indexOf("-")!=-1)?CL:CU

  var res = []
  var l = L[0].length+1
  for (var i = 1; i < L.length; i++){
    res = res.concat(recMap(x=>f(x,(i-1)/l,1/l),toRects(L[i])))
  }
  return res
}

// return the drawable line segments from a `rects` object
function toLines (R){
  if (R.length == 0){
    return []
  }
  var res = toLines(R.slice(1))
  var x = R[0].split(",")
  var transf = function(a){
    return [
      (1-a[0])*x[0]+a[0]*x[2],
      (1-a[1])*x[1]+a[1]*x[3],
      (1-a[2])*x[0]+a[2]*x[2],
      (1-a[3])*x[1]+a[3]*x[3]
    ]
  }
  var i2bx = {"1":[ 0, 0,.5,.5],"2":[.5, 0,.5,.5],
              "3":[ 1, 0,.5,.5],"4":[ 1,.5,.5,.5],
              "5":[ 1, 1,.5,.5],"6":[.5, 1,.5,.5],
              "7":[ 0, 1,.5,.5],"8":[ 0,.5,.5,.5]
             }

  res = res.concat(x[4].replace("0","").split("")
                   .map(a=>(transf(i2bx[a]))))
  return res
}


var parser = {
  preprocess:preprocess,
  parse:parse,
  toRects:toRects,
  toLines:toLines,
  isop:isop,
  pure:pure,
}

if (typeof module === "object"){
  module.exports = parser;
}


