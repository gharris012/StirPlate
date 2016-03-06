// OpenJSCAD translation of magnet holder

function getParameterDefinitions()
{
  return [
    { name: 'showReferences', type: 'choice', values: ["yes", "no"], initial: "yes", caption: "Show References?" },
    { name: 'useSpacer', type: 'choice', values: ["yes", "no"], initial: "no", caption: "Use a spacer?" },
    { name: 'stirBarLength', type: 'int', initial: 34, caption: "Distance between magnets." }
  ];
}

function main(params)
{
    var totalHeight = 10.0; // 6.0 for reference stand, 8.5? for 1/4" magnet
    var hubDiameter = 33;
    var hubHeight = 2.0; // distance from the top of the fan ribs to the top of the hub
    var wallThickness = 1.0;
    var standOpening = 52;
    var magnetDiameter = 13.00;
    var magnetHeight = 6.35;
    var washerDiameter = 0;
    var washerHeight = 0.1;
    var maxSpacerHeight = 1.0; // max height of the spacer - any extra height will become a ledge
    var washerLedgeDef = 2.0; // the width of the ledge that the washer and/or spacer rest on

    var stirBarLength = params.stirBarLength;
    var mountingTapeHeight = 1.50;

    var tol=0.50;

    var maxLength = standOpening - 2;
    var holderDiameter = hubDiameter + ( wallThickness * 2 ) + ( tol * 2);
    var componentLength = stirBarLength + magnetDiameter + ( wallThickness * 2 ) + ( tol * 2 );
    var magnetWallHeight = ( washerDiameter > 0 ? 2 : magnetHeight + wallThickness + tol );
    var componentHeight = ( washerDiameter > 0 ? washerHeight + magnetHeight : magnetHeight );
    var washerLedge = ( wallThickness > washerLedgeDef ? wallThickness : washerLedgeDef );

    echo("componentHeight: " + ( componentHeight + wallThickness ))

    var mainBody;
    var output = [];

    var interiorHeight = totalHeight - wallThickness - mountingTapeHeight - hubHeight - tol;
    echo("Interior Height: ", interiorHeight);
    if ( ( componentHeight + tol ) < totalHeight && params.useSpacer == "yes" )
    {
        //spacerHeight = totalHeight - componentHeight - tol - mountingTapeHeight;
        var spacerHeight = ( interiorHeight > maxSpacerHeight ? maxSpacerHeight : interiorHeight );

        var spacer = cylinder({h:spacerHeight,d:hubDiameter}).translate([holderDiameter * 2, 0, 0]);
        output.push(spacer);
    }

    var hubMount = cylinder({h:totalHeight, d:holderDiameter});
    var magnetWall1 = cylinder({h:magnetWallHeight, d:magnetDiameter + ( wallThickness * 2 ) + ( tol * 2 )}).translate([stirBarLength/2,0,0]);
    var magnetWall2 = cylinder({h:magnetWallHeight, d:magnetDiameter + ( wallThickness * 2 ) + ( tol * 2 )}).translate([-stirBarLength/2,0,0]);

    if ( washerDiameter === 0 )
    {
        // wtf? jscad only does 2d hulling??
        //var mainBody = hull(hubMount, magnetWall1, magnetWall2);
        var mainBodyRef = union(hubMount, magnetWall1, magnetWall2);
        var hulledBody = hullZ([mainBodyRef], [0, 0, magnetWallHeight]);

        mainBody = union(mainBodyRef, hulledBody)

        // create a ledge if needed
        if ( ( componentHeight + tol ) < totalHeight )
        {
            if ( spacerHeight < interiorHeight && params.useSpacer == "yes" )
            {
                mainBody = mainBody.subtract(cylinder({h:totalHeight + tol,d:hubDiameter - washerLedge})
                                                .translate([0,0,wallThickness]))
                                .subtract(cylinder({h:totalHeight,d:hubDiameter + ( tol * 2 )})
                                                .translate([0,0,interiorHeight - spacerHeight]));
            }
            else
            {
                var gapper = cylinder({h:totalHeight,d:hubDiameter + ( tol * 2 )})
                                                .translate([0,0,totalHeight-interiorHeight]).setColor(255,255,0,0.25);;
                //output.push(gapper);
                mainBody = mainBody.subtract(gapper);
            }
        }
        else
        {
            mainBody = mainBody.subtract(cylinder({h:totalHeight + tol, d:holderDiameter - ( wallThickness * 2 )})
                                    .translate([0,0,wallThickness]));
        }
    }
    else
    {
        echo("Warning!: using a washer is not finalized");
        mainBody = union(hubMount, magnetWall1, magnetWall2);
    }

    var magnetRecess = ( washerDiameter > 0 ? totalHeight : magnetHeight );
    mainBody = mainBody.subtract(cylinder({h:magnetRecess + ( tol * 2 ),d:magnetDiameter + tol}).translate([stirBarLength / 2, 0, -tol]))
            .subtract(cylinder({h:magnetRecess + ( tol * 2 ),d:magnetDiameter + tol}).translate([-stirBarLength / 2, 0, -tol]));

    output.push(mainBody);

    // warning objects need to be added last to maintain transparency
    if ( componentLength > maxLength )
    {
        echo("Warning!: Component Length exceeds maximum Length.");
        echo("maxLength=" + maxLength,"componentLength=" + componentLength);
        var collisionReference = cylinder({h:totalHeight,d:maxLength}).setColor(255,0,0,0.25);
        output.push(collisionReference);
    }
    // warning objects need to be added last to maintain transparency
    if ( componentHeight + wallThickness > totalHeight )
    {
        echo("Warning!: Component Height exceeds maximum Height.");
        echo("totalHeight=" + totalHeight,"componentHeight=" + ( componentHeight + wallThickness ));
        var collisionReference = cylinder({h:totalHeight,d:maxLength}).setColor(255,0,0,0.25);
        output.push(collisionReference);
    }
    // reference objects need to be added last to maintain transparency
    if ( standOpening > 0 && params.showReferences == "yes" )
    {
        var openingReference = cylinder({h:totalHeight,d:standOpening}).setColor(0,255,0,0.25);
        output.push(openingReference);
    }

    return output;
}

// squish a 3d object into 2d geometry, then hull it, then extrude it
function hullZ(e,offset)
{
    var body = union(e);
    var shape = body.sectionCut(CSG.OrthoNormalBasis.Z0Plane());
    var hulledShape = hull(shape);
    var hulledBody = hulledShape.extrude({offset:offset});
    return hulledBody;
}
