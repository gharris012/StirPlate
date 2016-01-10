
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
    { name: 'plateType', type: 'choice', values: ["top","middle","bottom","conn","face"], initial: "middle", caption: "Part" }
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
            style: 'solid',
            latticeAngle: 33.5,
            latticeCount: 3,
            latticeXOffset: -1.20,
            cutMountingHoles: true,
        }
    }
    else if ( params.plateType == "bottom" || params.plateType == "conn" || params.plateType == "face" )
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
        //var motorDiameter = 30;
        //var motorSpindleDiameter = 10;
        //var motorScrewDistance = 8;
        //var screwMotorMount = new screw("M2.5");

        // 6v 7000RPM motor
        //var motorDiameter = 25;
        //var motorSpindleDiameter = 7.0;
        //var motorScrewDistance = 8;
        //var screwMotorMount = new screw("EG1.5");

        // 12v Nidec 22H
        var motorDiameter = 36;
        var motorSpindleDiameter = 13.0;
        var motorScrewDistance = 25 / 2;
        var screwMotorMount = new screw("M3");

        var motorMountDiameter = 0;
        if ( plateArgs.style == 'lattice' && sparSpace )
        {
            motorMountDiameter = Math.max((motorScrewDistance + wallThickness) * 2, sparSpace / 2);
        }
        else
        {
            motorMountDiameter = ( motorScrewDistance + wallThickness) * 2;
        }

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
                             .subtract(screwMotorMount.hole({length:plateThickness}).translate([motorScrewDistance,0,0]))
                             .subtract(screwMotorMount.hole({length:plateThickness}).translate([-motorScrewDistance,0,0]));
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
    else if ( params.plateType == "bottom" || params.plateType == "conn" || params.plateType == "face" )
    {
        if ( params.plateType == "bottom"
                || ( params.plateType == "conn" && params.showReferences === "yes" )
                || ( params.plateType == "face" && params.showReferences === "yes" ) )
        {
            var insertPost = screw14.roundThreadedInsertPost().translate([plateHoleOffset, plateHoleOffset, wallThickness]);
            var insertHole = screw14.threadedInsertHole({"flipX":true}).translate([plateHoleOffset, plateHoleOffset, wallThickness]);
            stirPlate = stirPlate.union(insertPost);
            stirPlate = stirPlate.subtract(insertHole);

            insertPost = insertPost.rotateZ(90);
            insertHole = insertHole.rotateZ(90);
            stirPlate = stirPlate.union(insertPost)
                                 .subtract(insertHole);
            insertPost = insertPost.rotateZ(90);
            insertHole = insertHole.rotateZ(90);
            stirPlate = stirPlate.union(insertPost)
                                 .subtract(insertHole);
            insertPost = insertPost.rotateZ(90);
            insertHole = insertHole.rotateZ(90);
            stirPlate = stirPlate.union(insertPost)
                                 .subtract(insertHole);

        }

        if ( params.plateType == "face" || params.plateType == "conn" )
        {
            var connWallExpansion = 0.2;
            var connWallThickness = 2.0;
            var connWallWidth = 0;
            var connWallHeight = 0;
            var connWallClearance = 5.0; // min spacing between items

            var connWallWidthMax = ( ( ( plateArgs.plateSize / 2 ) - plateArgs.rad ) * 2 ) - connWallThickness;

            connWallThickness = connWallThickness - ( connWallExpansion * 2 );

            // set up initial sizes
            if ( params.plateType == "conn" )
            {
                var pwrJackDiameter = 8.0;
                var pwrJackClearanceDiameter = 13.0;
                var auxJackDiameter = 6.0;
                var auxJackClearanceDiameter = 10.0;

                pwrJackDiameter = pwrJackDiameter + tol;
                auxJackDiameter = auxJackDiameter + tol;

                connWallWidth = pwrJackDiameter + auxJackDiameter + ( connWallThickness * 3 ); // just big enough to fit both connectors
                connWallWidth = Math.max(connWallWidth, pwrJackClearanceDiameter + auxJackClearanceDiameter);
                connWallHeight = Math.max(pwrJackDiameter,auxJackDiameter) + ( connWallThickness * 2 );
                connWallHeight = Math.max(connWallHeight, pwrJackClearanceDiameter, auxJackClearanceDiameter);
            }
            if ( params.plateType == "face" )
            {
                var ledDiameter = 5.0;
                var ledOffset = 5.0;
                var potDiameter = 7.0;
                var potBaseDiameter = 16.0;  // base is big
                var switchWidth = 7.0;
                var switchHeight = 19.0;
                var switchOverlap = 1.5;     // plastic overhang in the front

                connWallWidth = ( ( ledDiameter + connWallClearance ) * 3 )
                                + potBaseDiameter + connWallClearance
                                + switchHeight + ( switchOverlap * 2 ) + connWallClearance;
                connWallHeight = switchHeight + ( switchOverlap * 2 )
                                + ( connWallThickness * 2 )
            }

            connWallWidth = Math.min(connWallWidth, connWallWidthMax);

            var supportLength =  Math.min(connWallWidth / 4, 10);
            supportLength = Math.max(supportLength, 5);

            var wall = CSG.cube({
                            center: [connWallWidth / 2,connWallThickness / 2, connWallHeight / 2],
                            radius: [connWallWidth / 2,connWallThickness / 2, connWallHeight / 2]
                        }).translate([0,0,plateThickness]);
            var wallSupport = CSG.cube({
                            center: [0,0,0],
                            radius: [supportLength / 2,connWallThickness / 2, connWallHeight / 2]
                        })
                        .rotateZ(90)
                        .translate([connWallThickness / 2, supportLength / 2, ( connWallHeight / 2 ) + plateThickness]);

            wall = wall.union(wallSupport);
            wall = wall.union(wallSupport.translate([connWallWidth,0,0]));

            wall = wall.expand(connWallExpansion, 8);
            // get rid of the expansion on the bottom
            wall = wall.translate([-connWallWidth / 2,0,0]).subtract(stirPlate);
            wall = wall.translate([connWallWidth / 2,0,0]);

            if ( params.plateType == "face" )
            {
                var ledHole = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, connWallThickness * 2],
                                    radius: ( ledDiameter ) / 2
                                })
                                .rotateX(90)
                                .translate([0,connWallThickness + tol,plateThickness]);

                ledHole = ledHole.translate([ledDiameter / 2 + connWallClearance,0,connWallHeight - connWallClearance - ( ledDiameter / 2 ) ]);
                wall = wall.subtract(ledHole);
                ledHole = ledHole.translate([ledDiameter + connWallClearance,0,0]);
                wall = wall.subtract(ledHole);
                ledHole = ledHole.translate([ledDiameter + connWallClearance,0,0]);
                wall = wall.subtract(ledHole);

                var powerSwitchOffset = switchWidth + switchOverlap + connWallClearance;
                var powerSwitch = CSG.cube({
                            center: [switchWidth / 2,plateThickness / 2, switchHeight / 2],
                            radius: [switchWidth / 2,plateThickness / 2, switchHeight / 2]
                        }).translate([connWallWidth - powerSwitchOffset,-tol,plateThickness + ( ( connWallHeight - switchHeight ) / 2 ) ]);
                wall = wall.subtract(powerSwitch);

                var potHole = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, connWallThickness * 2],
                                    radius: ( potDiameter ) / 2
                                })
                                .rotateX(90)
                                .translate([0,connWallThickness + tol,plateThickness]);
                potHole = potHole.translate([connWallWidth - powerSwitchOffset - connWallClearance - ( potBaseDiameter / 2 ),0,( ( connWallHeight - potBaseDiameter ) / 2 ) + ( potBaseDiameter / 2 )]);
                wall = wall.subtract(potHole);
            }

            if ( params.plateType == "conn" )
            {
                var pwrJackOffsetWidth = connWallThickness + ( pwrJackClearanceDiameter / 2 );
                var pwrJackOffsetHeight = pwrJackClearanceDiameter / 2;

                var pwrJack = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, plateThickness],
                                    radius: ( pwrJackDiameter ) / 2
                                })
                                .rotateX(90)
                                .translate([0,connWallThickness + tol,plateThickness])
                                .translate([pwrJackOffsetWidth,0,pwrJackOffsetHeight])
                wall = wall.subtract(pwrJack);

                var auxJackOffsetWidth = connWallWidth - ( auxJackClearanceDiameter / 2 );
                var auxJackOffsetHeight = connWallHeight / 2;

                var auxJack = CSG.cylinder({
                                    start: [0, 0, 0],
                                    end:   [0, 0, plateThickness],
                                    radius: ( auxJackDiameter ) / 2
                                })
                                .rotateX(90)
                                .translate([0,connWallThickness + tol,plateThickness])
                                .translate([auxJackOffsetWidth,0,auxJackOffsetHeight])
                wall = wall.subtract(auxJack);
                wall = wall.union(wall.translate([-connWallWidth,0,0]));
            }

            if ( params.showReferences === "yes" )
            {
                wall = wall;
                output.push(wall);
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
