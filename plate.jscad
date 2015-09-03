plate = function (args)
{
    var walls = typeof wallThickness != 'undefined' && Math.max(wallThickness,2) || 2;
    var tolerance = typeof tol != 'undefined' && tol || 0.5;
    var plateThickness = args && args.plateThickness || 3.0;
    var plateSize = args && args.plateSize || 90;
    var mountingHoleDiameter = args && args.mountingHoleDiameter || 10;
    var rad = args && args.rad || ( ( mountingHoleDiameter / 2 ) + walls );
    // instead of doing real math, trial and error!
    var radMultiplier = args && args.radMultiplier || 3;
    var cutMountingHoles = args && typeof(args.cutMountingHoles) != 'undefined' ? args.cutMountingHoles : true;
    var plateStyle = args && args.style || 'lattice';
    var latticeAngle = args && args.latticeAngle || 30;
    var latticeCount = args && args.latticeCount || 3;
    var latticeSize = args && args.latticeSize || 2;
    var latticeXOffset = args && args.latticeXOffset || 0;
    var latticeYOffset = args && args.latticeYOffset || 0;

    var holeOffset = plateSize / 2;

    // sets this as a global variable for external reference
    plateHoleOffset = holeOffset;

    var plate;

    if ( plateStyle == 'solid' )
    {
        plate = CSG.cube({                  // rounded cube
                        center: [0,0,plateThickness / 2],
                        radius: [holeOffset-rad,holeOffset-rad,plateThickness / 2]
                      });
    }
    else
    {
        plate = lattice(plateSize-(rad*2), plateSize-(rad*2), latticeSize, wallThickness, latticeAngle, latticeCount, latticeXOffset, latticeYOffset)
                    .translate([-(plateSize-(rad * 2))/2, -(plateSize-(rad * 2))/2, 0]);
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

    var cutoutSize = (plateSize*2)-(rad*radMultiplier); // this needs some real math
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
