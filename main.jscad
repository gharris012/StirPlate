
include("common.jscad");
include("screws.jscad");
include("lattice.jscad");
include("plate.jscad");

var tol = 0.5;
var wallThickness = 2.0;

var sparSpace;
var plateHoleOffset;

function getParameterDefinitions()
{
  return [
    { name: 'showReferences', type: 'choice', values: ["yes", "no"], initial: "yes", caption: "Show References?" },
    { name: 'plateType', type: 'choice', values: ["top","middle","bottom","wall","wall-front"], initial: "wall-front", caption: "Plate Type" }
  ];
}

function main(params)
{
    var bodyDiameter = 40;
    var output = [];

    var screw14 = new screw("1/4-20", {head: "pan-square"});
    var nut14 = new nut("1/4-20", {screw: screw14});
    var washerM6 = new washer("M6", {screw: screw14}); // just use M6 washers for now
    var plateThickness = 3.0;

    // Axis
    if ( params.showReferences === 'yes' )
    {
        var extents = [bodyDiameter,bodyDiameter,20];
        output.push(makeAxis(extents));
    }

    if ( params.plateType == "top" )
    {
        var plateArgs = {
            rad: ( screw14.type.head[screw14.head].diameter + (wallThickness * 2) ) / 2.0,
            radMultiplier: 6,
            mountingHoleDiameter: screw14.type.fit.close,
            plateThickness: plateThickness,
            style: 'solid',
            latticeAngle: 45,
            latticeCount: 4,
            cutMountingHoles: false,
        }
    }
    else if ( params.plateType == "middle" )
    {
        var plateArgs = {
            rad: ( screw14.type.head[screw14.head].diameter / 2.0),
            radMultiplier: 1,
            mountingHoleDiameter: screw14.type.fit.free,
            plateThickness: plateThickness,
            style: 'lattice',
            latticeAngle: 33.5,
            latticeCount: 3,
            latticeXOffset: -1.20,
            cutMountingHoles: true,
        }
    }
    else if ( params.plateType == "bottom" || params.plateType == "walls" )
    {
        var plateArgs = {
            plateSize: 90,
            rad: ( nut14.diameter + (wallThickness * 2) ) / 2.0,
            radMultiplier: 6,
            mountingHoleDiameter: screw14.type.fit.close,
            plateThickness: plateThickness,
            style: 'solid',
            cutMountingHoles: false,
        }
    }

    var stirPlate = plate(plateArgs);

    if ( params.plateType == "middle" )
    {
        //// 12v 6000RPM motor
        var motorDiameter = 30;
        var motorSpindleDiameter = 10;
        var motorScrewDistance = 8;
        var screwM25 = new screw("M2.5");

        // 6v 7000RPM motor
        //var motorDiameter = 25;
        //var motorSpindleDiameter = 7.0;
        //var motorScrewDistance = 8;
        //var screwM25 = new screw("EG1.5");

        var motorMountDiameter = Math.max((motorScrewDistance + wallThickness) * 2, sparSpace / 2);


        var motorMount = CSG.cylinder({
                start: [0, 0, 0],
                end:   [0, 0, plateThickness],
                radius: ( motorMountDiameter / 2 ) + 1
            });
        stirPlate = stirPlate.union(motorMount)
                             .subtract(CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, plateThickness],
                                    radius: ( ( motorSpindleDiameter + tol ) / 2 )
                                }))
                             .subtract(screwM25.hole({length:plateThickness}).translate([motorScrewDistance,0,0]))
                             .subtract(screwM25.hole({length:plateThickness}).translate([-motorScrewDistance,0,0]));
    }
    else if ( params.plateType == "top" )
    {
        var centerHoleDiameter = 52;
        stirPlate = stirPlate.union(cylinder({d: centerHoleDiameter + ( wallThickness * 3 ),
                                                 h: plateThickness,
                                                 center: false}));
        stirPlate = stirPlate.subtract(cylinder({d: centerHoleDiameter + (tol*2),
                                                 h: plateThickness * 2.5,
                                                 center: true}));

        var mountingPostHeight = screw14.type.head[screw14.head].height + wallThickness - plateThickness;
        var mountingPostDiameter = screw14.type.head[screw14.head].diameter + (wallThickness * 2);

        var mountingPost = CSG.cylinder({
                start: [0, 0, 0],
                end:   [0, 0, mountingPostHeight],
                radius: ( mountingPostDiameter / 2 )
            }).translate([plateHoleOffset, plateHoleOffset, -mountingPostHeight ]);

        stirPlate = stirPlate.union(mountingPost);
        mountingPost = mountingPost.rotateZ(90);
        stirPlate = stirPlate.union(mountingPost);
        mountingPost = mountingPost.rotateZ(90);
        stirPlate = stirPlate.union(mountingPost);
        mountingPost = mountingPost.rotateZ(90);
        stirPlate = stirPlate.union(mountingPost);

        var screwHeadRecess = screw14.headRecess().setColor([255,0,0]).translate([plateHoleOffset, plateHoleOffset, -( ( screw14.type.head[screw14.head].height + tol ) - plateThickness ) ]);
        var screwHole = screw14.hole({fit: 'close'}).translate([plateHoleOffset, plateHoleOffset, -( screw14.type.head[screw14.head].height + tol )]);

        stirPlate = stirPlate.subtract(screwHeadRecess).subtract(screwHole);
        screwHeadRecess = screwHeadRecess.rotateZ(90);
        screwHole = screwHole.rotateZ(90);
        stirPlate = stirPlate.subtract(screwHeadRecess).subtract(screwHole);
        screwHeadRecess = screwHeadRecess.rotateZ(90);
        screwHole = screwHole.rotateZ(90);
        stirPlate = stirPlate.subtract(screwHeadRecess).subtract(screwHole);
        screwHeadRecess = screwHeadRecess.rotateZ(90);
        screwHole = screwHole.rotateZ(90);
        stirPlate = stirPlate.subtract(screwHeadRecess).subtract(screwHole);
    }
    else if ( params.plateType == "bottom" || params.plateType == "wall" || params.plateType == "wall-front" )
    {
        //var baseWallSize = ( plateArgs.plateSize / 2 ) - plateArgs.rad - wallThickness - tol;
        var baseWallSize = ( 150 - 20 ) / 2 / 2; // small enough to fit 8 on the 150mm build plate
        var baseWallHeight = 30.0;
        var baseWallThickness = 1.0;


        if ( params.plateType == "bottom" ||
                ( ( params.plateType == "wall" || params.plateType == "wall-front" ) && params.showReferences === "yes" ) )
        {
            nut14.screw.length = nut14.height + wallThickness;
            var nutInsert = nut14.insert().translate([plateHoleOffset, plateHoleOffset, wallThickness]);
            //nutInsert = nutInsert.subtract(nut14.insertHole().translate([plateHoleOffset, plateHoleOffset, wallThickness]));
            var insertHole = nut14.insertHole().translate([plateHoleOffset, plateHoleOffset, wallThickness]);
            stirPlate = stirPlate.union(nutInsert)
                                 .subtract(insertHole);

            nutInsert = nutInsert.rotateZ(90);
            insertHole = insertHole.rotateZ(90);
            stirPlate = stirPlate.union(nutInsert)
                                 .subtract(insertHole);

            nutInsert = nutInsert.rotateZ(90);
            insertHole = insertHole.rotateZ(90);
            stirPlate = stirPlate.union(nutInsert)
                                 .subtract(insertHole);

            nutInsert = nutInsert.rotateZ(90);
            insertHole = insertHole.rotateZ(90);
            stirPlate = stirPlate.union(nutInsert)
                                 .subtract(insertHole);

            var baseWallPath = new CSG.Path2D([ [baseWallSize,baseWallSize],
                                        [-baseWallSize,baseWallSize],
                                        [-baseWallSize,-baseWallSize],
                                        [baseWallSize,-baseWallSize] ], /*closed=*/true);
            var baseWall = baseWallPath.rectangularExtrude(baseWallThickness + tol, 4, 16, false)   // w, h, resolution, roundEnds
                            .translate([0,0,plateThickness-(wallThickness/2)]);
            stirPlate = stirPlate.subtract(baseWall);
        }

        if ( params.plateType == "wall" || params.plateType == "wall-front" )
        {
            var wall = lattice(( baseWallSize * 2 ) - ( tol * 2 ), baseWallHeight, baseWallThickness, baseWallThickness, 45, 3);

            // add power and aux holes
            if ( params.plateType == 'wall-front' )
            {
                var pwrJackDiameter = 8.0;
                var pwrJackOffsetWidth = ( baseWallSize * 2 ) * 0.33;
                pwrJackOffsetWidth = pwrJackOffsetWidth + 1.30; // fluff to line up with lattice
                var pwrJackOffsetLength = baseWallHeight / 2;
                pwrJackDiameter = pwrJackDiameter + tol;

                var pwrJackBorder = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, baseWallThickness],
                                    radius: ( pwrJackDiameter + ( baseWallThickness * 2 ) ) / 2
                                }).translate([pwrJackOffsetWidth,pwrJackOffsetLength,0])
                wall = wall.union(pwrJackBorder);

                var pwrJack = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, plateThickness],
                                    radius: ( pwrJackDiameter ) / 2
                                }).translate([pwrJackOffsetWidth,pwrJackOffsetLength,0])
                wall = wall.subtract(pwrJack);

                var auxJackDiameter = 6.0;
                var auxJackOffsetWidth = ( baseWallSize * 2 ) * 0.66;
                auxJackOffsetWidth = auxJackOffsetWidth - 0.25; // fluff to line up with lattice
                var auxJackOffsetLength = baseWallHeight / 2;
                auxJackOffsetLength = auxJackOffsetLength - 1.0; // fluff to line up with lattice
                auxJackDiameter = auxJackDiameter + tol;

                var auxJackBorder = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, baseWallThickness],
                                    radius: ( auxJackDiameter + ( baseWallThickness * 2 ) ) / 2
                                }).translate([auxJackOffsetWidth,auxJackOffsetLength,0])
                wall = wall.union(auxJackBorder);

                var auxJack = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, plateThickness],
                                    radius: ( auxJackDiameter ) / 2
                                }).translate([auxJackOffsetWidth,auxJackOffsetLength,0])
                wall = wall.subtract(auxJack);

            }

            var hinge = CSG.cube({
                            center: [baseWallThickness / 2,(baseWallHeight*0.30) / 2,baseWallThickness / 2],
                            radius: [baseWallThickness / 2,(baseWallHeight*0.30) / 2,baseWallThickness / 2]
                        });
            var hingeCenterHeight = (baseWallHeight*0.40)-tol;
            var hingeCenter = CSG.cube({
                center: [baseWallThickness / 2,hingeCenterHeight / 2,baseWallThickness / 2],
                radius: [baseWallThickness / 2,hingeCenterHeight / 2,baseWallThickness / 2]
            });
            wall = wall.translate([baseWallThickness, 0, 0]);

            var hingeA = hinge.subtract(
                           CSG.sphere({
                            center: [baseWallThickness / 2,0,baseWallThickness / 2],
                            radius: baseWallThickness / 3
                        })).translate([0,( baseWallHeight - ( baseWallHeight*0.30 ) ),0]);
            var hingeB = hingeCenter.union(
                           CSG.sphere({
                            center: [baseWallThickness / 2,0,baseWallThickness / 2],
                            radius: baseWallThickness / 3
                        })).union(
                           CSG.sphere({
                            center: [baseWallThickness / 2,hingeCenterHeight,baseWallThickness / 2],
                            radius: baseWallThickness / 3
                        })).translate([( baseWallSize * 2 ),( baseWallHeight - hingeCenterHeight ) / 2,0]);
            var hingeC = hinge.subtract(
                           CSG.sphere({
                            center: [baseWallThickness / 2,(baseWallHeight*0.30),baseWallThickness / 2],
                            radius: baseWallThickness / 3
                        })).translate([0,baseWallHeight * 0.0,0]);

            wall = wall.union([hingeA, hingeB, hingeC]);

            if ( params.showReferences === "bob" )
            {
                wall = wall
                    .rotateX(90)
                    .translate([-baseWallSize,-baseWallSize,0]);
                var walls = wall;
                walls = walls.union(wall.rotateZ(90));
                walls = walls.union(wall.rotateZ(180));
                walls = walls.union(wall.rotateZ(-90).setColor(0,0,255,90));

                output.push(walls);
            }
            else
            {
                stirPlate = wall;
            }
        }
    }
    output.push(stirPlate);

    return output;
}
