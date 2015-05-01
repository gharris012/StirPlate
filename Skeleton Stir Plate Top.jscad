// OpenJSCAD translation of Skeleton Stir Plate Top

function getParameterDefinitions()
{
  return [
//    { name: 'showReferences', type: 'choice', values: ["yes", "no"], initial: "yes", caption: "Show References?" },
  ];
}

function main(params)
{
    var output = [];
    var plateThickness = 3.0;
    var plateSize = 90;
    var stickDiameter = 10;
    var stickHeight = 25;
    var pegDiameter = 5.3;
    var pegHeight = 5.3;
    var rad = ( stickDiameter / 2 ) + 2;
    var stickOffset = plateSize / 2;

    var box = CSG.cube({                  // rounded cube
                    center: [0,0,plateThickness / 2],
                    radius: [stickOffset-rad,stickOffset-rad,plateThickness / 2]
                  });

    output.push(box.subtract(cylinder({d: 50, h:10, center: true})));

    output.push(cylinder({d: stickDiameter, h: stickHeight, center: [true, true, false]}).translate([stickOffset, stickOffset, plateThickness]));
    output.push(cylinder({d: stickDiameter, h: stickHeight, center: [true, true, false]}).translate([stickOffset, -stickOffset, plateThickness]));
    output.push(cylinder({d: stickDiameter, h: stickHeight, center: [true, true, false]}).translate([-stickOffset, stickOffset, plateThickness]));
    output.push(cylinder({d: stickDiameter, h: stickHeight, center: [true, true, false]}).translate([-stickOffset, -stickOffset, plateThickness]));

    output.push(cylinder({d: pegDiameter, h: pegHeight, center: [true, true, false]}).translate([stickOffset, stickOffset, plateThickness + stickHeight]));
    output.push(cylinder({d: pegDiameter, h: pegHeight, center: [true, true, false]}).translate([stickOffset, -stickOffset, plateThickness + stickHeight]));
    output.push(cylinder({d: pegDiameter, h: pegHeight, center: [true, true, false]}).translate([-stickOffset, stickOffset, plateThickness + stickHeight]));
    output.push(cylinder({d: pegDiameter, h: pegHeight, center: [true, true, false]}).translate([-stickOffset, -stickOffset, plateThickness + stickHeight]));

    var b = [];
    // X ^, Y <>
    b.push(circle({r: rad}).translate([stickOffset, stickOffset, 0]));    // lower-right
    b.push(circle({r: rad}).translate([stickOffset-(rad/2), stickOffset-(rad/2), 0]));

    b.push(circle({r: rad}).translate([stickOffset-(rad/2), -stickOffset+(rad/2), 0]));
    b.push(circle({r: rad}).translate([stickOffset, -stickOffset, 0]));   // lower-left
    b.push(circle({r: rad}).translate([stickOffset-(rad/2), -stickOffset+(rad/2), 0]));

    b.push(circle({r: rad}).translate([-stickOffset+(rad/2), -stickOffset+(rad/2), 0]));
    b.push(circle({r: rad}).translate([-stickOffset, -stickOffset, 0]));  // upper-left
    b.push(circle({r: rad}).translate([-stickOffset+(rad/2), -stickOffset+(rad/2), 0]));

    b.push(circle({r: rad}).translate([-stickOffset+(rad/2), stickOffset-(rad/2), 0]));
    b.push(circle({r: rad}).translate([-stickOffset, stickOffset, 0]));   // upper-right
    b.push(circle({r: rad}).translate([-stickOffset+(rad/2), stickOffset-(rad/2), 0]));

    b.push(circle({r: rad}).translate([stickOffset-(rad/2), stickOffset-(rad/2), 0]));
    b.push(circle({r: rad}).translate([stickOffset, stickOffset, 0]));    // lower-right

    shape = chain_hull(b).extrude({offset: [0,0,plateThickness]}).center([true, true, false]).setColor([0,255,0,0.25]);
    output.push(shape);

    var cutout = plateSize+(plateSize);
    output.push(cylinder({d: cutout, h: plateThickness*2, center: [true, true, false]}).translate([(cutout/2)+(plateSize/2), 0, 0]).setColor(0,0,255,0.25));

    return output;
}
