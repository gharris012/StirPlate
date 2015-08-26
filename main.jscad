
include("common.jscad");
include("screws.jscad");
include("lattice.jscad");
include("plate.jscad");

var tol = 0.5;
var wallThickness = 2.0;

var sparSpace;

function getParameterDefinitions()
{
  return [
    { name: 'showReferences', type: 'choice', values: ["yes", "no"], initial: "yes", caption: "Show References?" },
  ];
}

function main(params)
{
    var bodyDiameter = 40;
    var output = [];

    var screwM6 = new screw("M6");
    var nutM6 = new nut("M6", {screw: screwM6});
    var washerM6 = new washer("M6", {screw: screwM6});

    // Axis
    if ( params.showReferences === 'yes' )
    {
        var extents = [bodyDiameter,bodyDiameter,20];
        output.push(makeAxis(extents));
    }

    //var cyl = CSG.cylinder({
    //        start: [0, 0, 0],
    //        end:   [0, 0, wallThickness / 2],
    //        radius: bodyDiameter / 2
    //    });
    //
    //cyl = cyl
    //        .subtract(washerM6.hole().translate([0,0,wallThickness/2-washerM6.height]))
    //        .subtract(nutM6.hole().translate([10,10,wallThickness/2-nutM6.height]))
    //        .subtract(washerM6.recess().translate([-10,-10,wallThickness/2-washerM6.getRecessHeight()]))

    //output.push(cyl);

    var plateArgs = {
        rad: (washerM6.diameter / 2.0),
        mountingHoleDiameter: screwM6.type.fit.close,
        plateThickness: wallThickness,
        latticeAngle: 32.5,   // center motor mount on lattice spars
        latticeCount: 3,      // center motor mount on lattice spars
        latticeXOffset: -2.5, // center motor mount on lattice spars
        cutMountingHoles: true,
        cutCenterHole: false
    }

    var stirPlate = plate(plateArgs);
    //output.push(stirPlate);

    var motorDiameter = 30;
    var motorSpindleDiameter = 10;
    var motorMountDiameter = Math.min(motorDiameter, sparSpace / 2);
    var screwM25 = new screw("M2.5");

    var motorMount = CSG.cylinder({
            start: [0, 0, 0],
            end:   [0, 0, wallThickness],
            radius: ( motorMountDiameter / 2 ) + 1
        }).subtract(CSG.cylinder({
            start: [0, 0, 0],
            end:   [0, 0, wallThickness],
            radius: ( ( motorSpindleDiameter + tol ) / 2 )
        })).subtract(screwM25.hole().translate([8,0,0]))
           .subtract(screwM25.hole().translate([-8,0,0]));

    output.push(motorMount.union(stirPlate));

    return output;
}
