// title: Example 001
// author: gharris012
// description: make a latticed(?) wall

var wallThickness = 1.0;
var wallHeight = 30; // x
var wallLength = 10; // y

var sparSize = 0.5;
var sparAngle = 30;
//var sparSpace = 30;
var sparSpace = wallHeight/5.0;

var trimSpar;
var deg2rad = Math.PI/180;
var rad2deg = 180/Math.PI;

var showAxis = true;

function makeBorder(vec)
{
    var dvec = [
        vec[0]/2,
        vec[1]/2,
        vec[2]/2
    ];
    var shell=CSG.cube({radius: dvec});
    var inner=CSG.cube({radius: [dvec[0]-vec[2], dvec[1]-vec[2], dvec[2]]});

    return shell.subtract(inner);
}

function makeTrimSpar(width,length,thickness)
{
    var vec = [width, length, thickness];
    var dvec = [
        vec[0]/2,
        vec[1]/2,
        vec[2]/2
    ];
    return CSG.cube({radius: [dvec[0]-dvec[2], dvec[1]-dvec[2], dvec[2]]});
}

function makeSpar(size, thickness, rot, xh, yh)
{
    var hyp = ( ( Math.sqrt(Math.pow(xh, 2) + Math.pow(yh, 2)) ) / 2 );
    hyp = ( hyp <=0 ? 1 : hyp );
    var spar = rotate(rot, [0,0,1], CSG.cube({radius: [size/2, thickness/2, hyp]})
                    .translate([size/2, thickness/2, -hyp])
                    .rotateX(90));
    return spar;
}

function Char(ltr)
{
    var l = vector_char(0,0,ltr);
    var a = l.segments;
    var p = [];
    a.forEach(function(s)
    {
        p.push(rectangular_extrude(s, { w:3, h:3 }));
    });
    return union(p).scale(1/6);
}

function lattice(width,length,size,thickness,angle,count)
{
    var retval = [];
    var border = makeBorder([width, length, thickness]).translate([width/2,length/2,thickness/2]);
    retval.push(border);
    var trimSpar = makeTrimSpar(width,length,thickness).translate([width/2,length/2,thickness/2]);

    var xStart = 0;
    var xFinish = width + sparSpace;

    var spars = [];
    var spar;
    var yMv = 0;
    var ny = 0;
    var nx = 0;
    var yh = 0;
    var xh = 0;
    var ySpace = Math.tan((90-angle) * deg2rad) * sparSpace;
    var yTotal = length + ( Math.tan((90-angle) * deg2rad) * width );

    for ( xMv = xStart ; xMv < xFinish || yMv < yTotal ; xMv = xMv + sparSpace )
    {
        nx = ( xMv >= xFinish ? nx : xMv );
        xh = nx;
        ny = ( xMv >= xFinish ? ny + ySpace : 0 );
        yh = ( xMv >= xFinish ? yh : yMv );
        //echo("nx",nx,"ny",ny);

        spars.push(makeSpar(size, thickness, angle, xh, yh).translate([nx,ny,0]));

        yMv += ySpace;
    }
    retval.push(union(spars).intersect(trimSpar));

    spars = [];
    yMv = 0;
    ny = 0;
    nx = 0;
    yh = 0;
    xh = 0;
    xStart = width;
    xFinish = 0-sparSpace;
    for ( xMv = xStart ; xMv > xFinish || yMv < yTotal ; xMv = xMv - sparSpace )
    {
        nx = ( xMv <= xFinish ? nx : xMv );
        xh = ( xMv <= xFinish ? xh : width - xMv );
        ny = ( xMv <= xFinish ? ny + ySpace : 0 );
        yh = ( xMv <= xFinish ? yh : yMv );
        //echo("-nx",nx,"-ny",ny,"-xh",xh,"-yh",yh);

        spars.push(makeSpar(size, thickness, -angle, xh, yh).translate([nx,ny,0]));

        yMv += ySpace;
    }
    retval.push(union(spars).intersect(trimSpar));

    return union(retval);
}

function main()
{
    var output = [];

    // Axis
    if ( showAxis )
    {
        output.push(cylinder({r:1, h:10, center:true}).setColor(1,0,255));

        output.push(Char('X').translate([18,-6,0]).setColor(0,0,0));
        //output.push(cylinder({r:1, h:10, center:true}).translate([20,0,0]).setColor(0,255,0));

        output.push(Char('Y').translate([-5,18,0]).setColor(0,0,0));
        //output.push(cylinder({r:1, h:10, center:true}).translate([0,20,0]).setColor(255,255,0))
    }

    output.push(lattice(10,20,1.0,1.0,30,5));

    //output.push(trimSpar.setColor(255,0,0,20));

    return output;
}
