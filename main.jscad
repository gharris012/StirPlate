
include("common.jscad");
include("screws.jscad");
include("lattice.jscad");
include("plate.jscad");

var tol = 0.5;
var wallThickness = 2.0;
var plateThickness = 2.0;

var sparSpace;
var plateHoleOffset;

function getParameterDefinitions()
{
  return [
    { name: 'showReferences', type: 'choice', values: ["yes", "no"], initial: "yes", caption: "Show References?" },
    { name: 'plateType', type: 'choice', values: ["top","middle","bottom"], initial: "top", caption: "Plate Type" }
  ];
}

function main(params)
{
    var bodyDiameter = 40;
    var output = [];

    var screw14 = new screw("1/4-20", {head: "pan-square"});
    var nut14 = new nut("1/4-20", {screw: screw14});
    var washerM6 = new washer("M6", {screw: screw14}); // just use M6 washers for now

    // Axis
    if ( params.showReferences === 'yes' )
    {
        var extents = [bodyDiameter,bodyDiameter,20];
        output.push(makeAxis(extents));
    }

    var rads = {
        top: washerM6.diameter + (wallThickness * 2),
        middle: washerM6.diameter,
        bottom: nut14.diameter + wallThickness
    }
    var radMult = {
        top: 6,
        middle: 1,
        bottom: 5
    }

    var plateArgs = {
        rad: ( rads[params.plateType] / 2.0),
        radMultiplier: radMult[params.plateType],
        mountingHoleDiameter: screw14.type.fit.close,
        plateThickness: plateThickness,
        style: 'lattice',
        latticeAngle: 32.5,   // center motor mount on lattice spars
        latticeCount: 3,      // center motor mount on lattice spars
        latticeXOffset: -2.5, // center motor mount on lattice spars
        cutMountingHoles: ( params.plateType == "middle" ? true : false ),
    }

    var stirPlate = plate(plateArgs);

    if ( params.plateType == "middle" )
    {
        var motorDiameter = 30;
        var motorSpindleDiameter = 10;
        var motorMountDiameter = Math.min(motorDiameter, sparSpace / 2);
        var screwM25 = new screw("M2.5");

        var motorMount = CSG.cylinder({
                start: [0, 0, 0],
                end:   [0, 0, plateThickness],
                radius: ( motorMountDiameter / 2 ) + 1
            }).subtract(CSG.cylinder({
                start: [0, 0, 0],
                end:   [0, 0, plateThickness],
                radius: ( ( motorSpindleDiameter + tol ) / 2 )
            })).subtract(screwM25.hole().translate([8,0,0]))
               .subtract(screwM25.hole().translate([-8,0,0]));
        stirPlate = stirPlate.union(motorMount);
    }
    else if ( params.plateType == "top" )
    {
        var centerHoleDiameter = 50;
        stirPlate = stirPlate.union(cylinder({d: centerHoleDiameter + ( wallThickness * 3 ),
                                                 h: plateThickness,
                                                 center: false}));
        stirPlate = stirPlate.subtract(cylinder({d: centerHoleDiameter,
                                                 h: plateThickness + 5,
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
    else if ( params.plateType == "bottom" )
    {
        nut14.screw.length = nut14.height + wallThickness;
        var nutInsert = nut14.insert().translate([plateHoleOffset, plateHoleOffset, wallThickness]);
        nutInsert = nutInsert.subtract(nut14.insertHole().translate([plateHoleOffset, plateHoleOffset, wallThickness]));
        stirPlate = stirPlate.union(nutInsert);
        nutInsert = nutInsert.rotateZ(90);
        stirPlate = stirPlate.union(nutInsert);
        nutInsert = nutInsert.rotateZ(90);
        stirPlate = stirPlate.union(nutInsert);
        nutInsert = nutInsert.rotateZ(90);
        stirPlate = stirPlate.union(nutInsert);
    }
    output.push(stirPlate);

    return output;
}
