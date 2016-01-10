
include("common.jscad");
include("screws.jscad");

var wallThickness = 0.5;
var tol = 0.5;

function getParameterDefinitions()
{
  return [
    { name: 'showReferences', type: 'choice', values: ["yes", "no"], initial: "no", caption: "Show References?" },
    { name: 'stirBarLength', type: 'int', initial: 35, caption: "Distance between magnets." }
  ];
}


function main(params)
{
    var standOpening = 52;
    var stirBarLength = params.stirBarLength;

    var nutSlotType = "nut";

    //// 12V 1000 rpm geared motor
    //var shaftDiameter = 4.0;
    //var shaftLength = 12.0;
    //var hubDiameter = 30.0;
    //var hubLength = 5.0;

    //// 12V 6000 rpm motor
    //var shaftDiameter = 2.3;
    //var shaftLength = 10.0;
    //var couplerNutType = "#4-40";
    //var couplerHoleCount = 2;
    //var couplerDiameter = 14.0; // inner diameter of washer
    //nutSlotType = "insert";

    //// 12V Nidec 22H BLDC
    var shaftDiameter = 4.0;
    var shaftLength = 18.0;
    var couplerNutType = "#4-40";
    var couplerHoleCount = 2;
    var couplerDiameter = 14.0; // inner diameter of washer
    nutSlotType = "insert";

    //// 6V 7000 rpm motor
    //var shaftDiameter = 2.0;
    //var shaftLength = 5.0;
    //var couplerScrewType = "EG1.5";
    //var couplerHoleCount = 2;
    //nutSlotsType = "none";

    var magnetDiameter = 13.00;
    var magnetHeight = 3.16;
    var magnetHeight = 6.0; // big boys

    var washerTotalDiameter = 34.0;
    var washerHoleDiameter = 17.0;
    var washerThickness = 3.0;

    var couplerScrew;
    var couplerNut;
    var couplerDiameter;
    var couplerHeight;

    if ( nutSlotType == "nut" )
    {
        couplerScrew = new screw(couplerNutType, {fit: 'tap'});
        couplerNut = new nut(couplerNutType, {screw: couplerScrew});
        couplerDiameter = ( couplerNut.diameter * 2 );
        couplerHeight = couplerNut.diameter;
    }
    else if ( nutSlotType == 'insert' )
    {
        var insertWallThickness = 1.0;
        couplerScrew = new screw(couplerNutType, {fit: 'close'});
        couplerNut = new nut(couplerNutType, {screw: couplerScrew});
        //couplerDiameter = couplerDiameter || ( couplerNut.diameter * 2 );
        couplerDiameter = washerHoleDiameter - tol;
        couplerDiameter = ( shaftDiameter + tol ) + ( ( couplerScrew.type.threadedInsert.length + tol ) * 2 );
        couplerHeight = couplerScrew.type.threadedInsert.b + ( insertWallThickness * 2 ) + washerThickness ;
        couplerScrewOffset = insertWallThickness + ( couplerScrew.type.threadedInsert.b / 2 );
    }
    else
    {
        couplerScrew = new screw(couplerScrewType, {fit: 'tap'});
        couplerDiameter = ( couplerScrew.length * 2 ) - ( tol * 2 );
        couplerHeight = couplerScrew.diameter * 2;
    }
    //couplerHeight = Math.min(couplerHeight, shaftLength / 2);

    echo("couplerHeight: " + couplerHeight);
    echo("shaftLength: " + shaftLength);

    //var hubDiameter = couplerDiameter * 2;//Math.max(couplerDiameter, magnetDiameter + ( wallThickness * 2 ));
    var hubDiameter = washerTotalDiameter;
    var maxLength = standOpening - 2;

    var holderDiameter = hubDiameter + ( wallThickness * 2 ) + ( tol * 2);
    var componentLength = stirBarLength + magnetDiameter + ( wallThickness * 2 ) + ( tol * 2 );
    var magnetWallHeight = magnetHeight + wallThickness + tol;
    var componentHeight = magnetHeight;

    var totalHeight = magnetWallHeight;
    var hubLength = totalHeight;

    var output = [];

    // Axis
    if ( params.showReferences === 'yes' )
    {
        var extents = [componentLength, componentLength, componentHeight + shaftLength];
        output.push(makeAxis(extents));
    }

    var coupler = CSG.cylinder({
            start: [0, 0, 0],
            end:   [0, 0, couplerHeight],
            radius: couplerDiameter / 2
        }).union(CSG.cylinder({
            start: [0, 0, 0],
            end:   [0, 0, washerThickness + tol],
            radius: washerHoleDiameter / 2
        })).subtract(CSG.cylinder({
            start: [0, 0, 0],
            end:   [0, 0, shaftLength],
            radius: ( shaftDiameter + tol ) / 2
        })).translate([0,0,hubLength]);

    var hole;
    var slot;
    hole = couplerScrew.hole({length:couplerDiameter})
                .rotateX(90)
                .translate([0,0,hubLength + couplerHeight - couplerScrewOffset ])
    // double slots to get straight walls all the way down

    echo("couplerScrewOffset: " + couplerScrewOffset);

    if ( nutSlotType == "nut" )
    {
        var slota;
        var slotb;
        slota = couplerNut.slot()
                    .rotateY(90)
                    .rotateZ(90)
                    .translate([0,-couplerNut.height/2,0])
                    .translate([0,-( (couplerScrew.length/2) + (couplerNut.height/3) ),hubLength + 0.5 + (shaftLength/4)]);
        slotb = couplerNut.slot()
                    .rotateY(90)
                    .rotateZ(90)
                    .translate([0,-couplerNut.height/2,0])
                    .translate([0,-( (couplerScrew.length/2) + (couplerNut.height/3) ),hubLength + (couplerNut.length/2) + (shaftLength/4)]);
        slot = union([hole,slota,slotb]);
    }
    else if ( nutSlotType == 'insert' )
    {
        slot = couplerScrew.threadedInsertHole({"extendB":tol*2})
                .rotateX(90)
                .translate([0,(couplerDiameter/2)-tol,hubLength + couplerHeight - couplerScrewOffset ])
                .union(hole);
    }
    else
    {
        slot = hole;
    }

    for ( var i = 0 ; i < couplerHoleCount ; i ++ )
    {
        coupler = coupler.subtract(slot.rotateZ(i*(360/couplerHoleCount)));
    }
    output.push(coupler);

    var mainBody;
    var hubMount = cylinder({h:totalHeight, d:holderDiameter});
    var magnetWall1 = cylinder({h:magnetWallHeight, d:magnetDiameter + ( wallThickness * 2 ) + ( tol * 2 )}).translate([stirBarLength/2,0,0]);
    var magnetWall2 = cylinder({h:magnetWallHeight, d:magnetDiameter + ( wallThickness * 2 ) + ( tol * 2 )}).translate([-stirBarLength/2,0,0]);

    var mainBodyRef = union(hubMount, magnetWall1, magnetWall2).translate([0,0,-1]);
    var hulledBody = hullZ([mainBodyRef], [0, 0, magnetWallHeight]);

    var shaftCutoutLength = magnetWallHeight - ( shaftLength - couplerHeight );
    var minWallThickness = Math.max(wallThickness, 1.0);
    if ( shaftCutoutLength < minWallThickness )
    {
        shaftCutoutLength = minWallThickness;
    }

    mainBody = union(hulledBody).subtract(CSG.cylinder({
        start: [0, 0, 0],
        end:   [0, 0, shaftLength],
        radius: ( shaftDiameter + tol ) / 2
    }).translate([0,0,shaftCutoutLength]));

    var magnetRecess = magnetHeight;
    mainBody = mainBody.subtract(cylinder({h:magnetRecess + ( tol * 2 ),d:magnetDiameter + tol}).translate([stirBarLength / 2, 0, -tol]))
            .subtract(cylinder({h:magnetRecess + ( tol * 2 ),d:magnetDiameter + tol}).translate([-stirBarLength / 2, 0, -tol]));

    // reapply slots to cut into mainBody
    // do this second so mainBody and coupler keep their colors/opacity
    for ( var i = 0 ; i < couplerHoleCount ; i ++ )
    {
        mainBody = mainBody.subtract(slot.rotateZ(i*(360/couplerHoleCount)));
    }

    output.push(mainBody.setColor(255,0,0,0.50));

        // reference objects need to be added last to maintain transparency
    if ( standOpening > 0 && params.showReferences == "yes" )
    {
        var openingReference = cylinder({h:totalHeight,d:standOpening}).setColor(0,255,0,0.25);
        output.push(openingReference);
    }

    return union(output);
}
