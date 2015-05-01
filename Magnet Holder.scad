// height of the original holder
//totalHeight=8.5;

// distance from fan to top of skeleton
totalHeight=6.0;

// this should be the diameter of the fan hub
hubDiameter=33;
wallThickness=1.0;
tol=0.25;

holderDiameter=hubDiameter+(wallThickness*2)+(tol*2);

// opening is 52, so the biggest part we can make is 50
maxLength=50;

washerDiameter=35;
// Washer Diameter - 0 will make a solid holder
washerDiameter=0;
washerHeight=2.4;

// reference/original sizes
//magnetDiameter=15;
//magnetHeight=3;

magnetDiameter=12.70;
//magnetHeight=3.16; // 1/8 in disc
magnetHeight=6.35; // 1/4 in disc
stirBarLength=34; // 34 is the biggest we can do and still fit in the hole of the top of the frame.

componentLength=stirBarLength+magnetDiameter+wallThickness*2+tol*2;

washerLedgeDef=2;
magnetWallHeight=( washerDiameter > 0 ? 2 : magnetHeight + wallThickness+tol );

washerLedge=( wallThickness > washerLedgeDef ? wallThickness : washerLedgeDef );

// if the stirbar is longer than the holder we will not be using a washer so the component height isn't important
// except the top then needs to be modified too.. put this on the backburner
componentHeight = ( washerDiameter > 0 ? washerHeight + magnetHeight : magnetHeight );

if ( componentLength > maxLength )
{
    echo("<b>Warning!</b>: Component Length exceeds maximum Length.");
    echo(maxLength=maxLength,componentLength=componentLength);
    %cylinder(h=totalHeight,d=maxLength);
}

if ( totalHeight < componentHeight )
{
    echo("<b>Warning!</b>: Component Height exceeds requested Total Height");
    echo(totalHeight=totalHeight,componentHeight=componentHeight);
    %cylinder(h=componentHeight,d=washerDiameter);
}
else if ( totalHeight == componentHeight )
{
    echo("<b>Warning!</b>: Component Height exactly matches Total Height");
    echo(totalHeight=totalHeight,componentHeight=componentHeight);
    %cylinder(h=componentHeight,d=washerDiameter);
}

// main body
difference()
{
    maybeHull(( washerDiameter > 0 ? false : true ))
    {
        cylinder(h=totalHeight,d=holderDiameter);
        
        // magnet walls
        translate([stirBarLength/2,0,0])
            cylinder(h=magnetWallHeight,d=magnetDiameter+wallThickness*2+tol*2);
        translate([-stirBarLength/2,0,0])
            cylinder(h=magnetWallHeight,d=magnetDiameter+wallThickness*2+tol*2);
    }

    if ( washerDiameter > 0 )
    {
        // washer recess
        translate([0,0,magnetHeight])
            cylinder(h=totalHeight,d=washerDiameter+(tol*2));
        // washer ledge
        translate([0,0,wallThickness])
            cylinder(h=totalHeight+tol,d=washerDiameter-washerLedge);
    }
    else
    {
        // hollow it out
        translate([0,0,wallThickness])
            cylinder(h=totalHeight+tol,d=holderDiameter-(wallThickness*2));
    }

    // magnet holes
    magnetRecess=(washerDiameter > 0 ? totalHeight : magnetHeight );
    translate([stirBarLength/2,0,-tol])
        cylinder(h=magnetRecess+tol+tol,d=magnetDiameter+tol);
    translate([-stirBarLength/2,0,-tol])
        cylinder(h=magnetRecess+tol+tol,d=magnetDiameter+tol);  
}

// if there is more than <tol> difference, make a spacer
if ( ( componentHeight + tol ) < totalHeight )
{
    spacerHeight=totalHeight-componentHeight-tol;
    translate([holderDiameter*2,0])
        cylinder(h=spacerHeight,d=washerDiameter);
}

module maybeHull(doHull=true)
{
    if ( doHull )
    {
        hull()
        {
            children();
        }
    }
    else
    {
        children();
    }
}
