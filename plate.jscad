plate = function (args)
{
    var walls = typeof wallThickness != 'undefined' && Math.max(wallThickness,2) || 2;
    var tolerance = typeof tol != 'undefined' && tol || 0.5;
    var plateThickness = args && args.plateThickness || 3.0;
    var plateSize = args && args.plateSize || 90;
    var centerHoleDiameter = args && args.centerHoleDiameter || 50;
    var mountingHoleDiameter = args && args.mountingHoleDiameter || 10;
    var rad = args && args.rad || ( ( mountingHoleDiameter / 2 ) + walls );
    var cutMountingHoles = args && typeof(args.cutMountingHoles) != 'undefined' ? args.cutMountingHoles : true;
    var cutCenterHole = args && typeof(args.cutCenterHole) != 'undefined' ? args.cutCenterHole : true;
    var latticeAngle = args && args.latticeAngle || 30;
    var latticeCount = args && args.latticeCount || 3;
    var latticeSize = args && args.latticeSize || 2;
    var latticeXOffset = args && args.latticeXOffset || 0;
    var latticeYOffset = args && args.latticeYOffset || 0;

    var holeOffset = plateSize / 2;

    /*
    var plate = CSG.cube({                  // rounded cube
                    center: [0,0,plateThickness / 2],
                    radius: [holeOffset-rad,holeOffset-rad,plateThickness / 2]
                  });
    */
    var plate = lattice(plateSize-(rad*2), plateSize-(rad*2), latticeSize, wallThickness, latticeAngle, latticeCount, latticeXOffset, latticeYOffset)
                .translate([-(plateSize-(rad * 2))/2, -(plateSize-(rad * 2))/2, 0]);

    if ( cutCenterHole )
    {
        plate = plate.subtract(cylinder({d: centerHoleDiameter,
                                         h:plateThickness + 5,
                                         center: true}));
    }

    var b = [];
    // X ^, Y <>
    b.push(circle({r: rad}).translate([holeOffset, holeOffset, 0]));    // lower-right
    b.push(circle({r: rad}).translate([holeOffset-(rad/2), holeOffset-(rad/2), 0]));

    b.push(circle({r: rad}).translate([holeOffset-(rad/2), -holeOffset+(rad/2), 0]));
    b.push(circle({r: rad}).translate([holeOffset, -holeOffset, 0]));   // lower-left
    b.push(circle({r: rad}).translate([holeOffset-(rad/2), -holeOffset+(rad/2), 0]));

    b.push(circle({r: rad}).translate([-holeOffset+(rad/2), -holeOffset+(rad/2), 0]));
    b.push(circle({r: rad}).translate([-holeOffset, -holeOffset, 0]));  // upper-left
    b.push(circle({r: rad}).translate([-holeOffset+(rad/2), -holeOffset+(rad/2), 0]));

    b.push(circle({r: rad}).translate([-holeOffset+(rad/2), holeOffset-(rad/2), 0]));
    b.push(circle({r: rad}).translate([-holeOffset, holeOffset, 0]));   // upper-right
    b.push(circle({r: rad}).translate([-holeOffset+(rad/2), holeOffset-(rad/2), 0]));

    b.push(circle({r: rad}).translate([holeOffset-(rad/2), holeOffset-(rad/2), 0]));
    b.push(circle({r: rad}).translate([holeOffset, holeOffset, 0]));    // lower-right

    shape = chain_hull(b)
        .extrude({offset: [0,0,plateThickness]})
        .translate([-rad,-rad,0])
        .setColor([0,0,255,0.25]);

    var cutoutSize = (plateSize*2)-(rad*3); // this needs some real math
    var cutout = cylinder({d: cutoutSize,
                          h: plateThickness*2,
                          center: [true, true, false]})
                .translate([(cutoutSize/2)+(plateSize/2)-(rad/2)-(mountingHoleDiameter/2), 0, 0])
                .setColor(0,0,255,0.25);
    shape = shape.subtract(cutout);
    cutout = cutout.rotateZ(90);
    shape = shape.subtract(cutout);
    cutout = cutout.rotateZ(90);
    shape = shape.subtract(cutout);
    cutout = cutout.rotateZ(90);
    shape = shape.subtract(cutout);

    //cutout = cutout.rotateZ(90);
    //shape = shape.union(cutout);

    plate = plate.union(shape);

    if ( cutMountingHoles )
    {
        var mountingHole = cylinder({d: mountingHoleDiameter,
                                     h: plateThickness + tolerance,
                                     center: [true, true, false]})
                            .translate([holeOffset, holeOffset, -tolerance/2]);
        plate = plate.subtract(mountingHole);
        mountingHole = mountingHole.rotateZ(90);
        plate = plate.subtract(mountingHole);
        mountingHole = mountingHole.rotateZ(90);
        plate = plate.subtract(mountingHole);
        mountingHole = mountingHole.rotateZ(90);
        plate = plate.subtract(mountingHole);
    }

    return plate;
}
