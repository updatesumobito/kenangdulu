// Ratio-locked side handles must preserve the opposite midpoint, including pan/zoom/rotation.
import assert from 'node:assert/strict';
import {constrainTransformBox} from '../src/lib/frame-editing';
import {RESIZE_ANCHORS,anchorPoint,oppositeAnchor,resizeBox,rotate} from '../src/lib/mokabooth/frame-geometry';
import {panPhotoCrop,photoPlacement,CENTER_CROP} from '../src/lib/mokabooth/frame-crop';
let cases=0;
for(const scale of [.25,1,2,6])for(const rotation of [0,30,90])for(const anchor of RESIZE_ANCHORS)for(const locked of [false,true]){
 const original={x:29.5,y:7,w:43,h:54,rotation},start=anchorPoint(original,anchor),proposal=resizeBox(original,anchor,{x:start.x+8,y:start.y+12},undefined,1),topLeft=anchorPoint(proposal,'top-left'),view={x:91,y:-35,scale},result=constrainTransformBox(original,anchor,{x:view.x+topLeft.x*scale,y:view.y+topLeft.y*scale,width:proposal.w*scale,height:proposal.h*scale,rotation:rotation*Math.PI/180},view,locked?43/54:undefined),w=result.width/scale,h=result.height/scale,center=rotate({x:w/2,y:h/2},rotation),box={x:(result.x-view.x)/scale+center.x-w/2,y:(result.y-view.y)/scale+center.y-h/2,w,h,rotation},fixed=anchorPoint(original,oppositeAnchor(anchor)),actual=anchorPoint(box,oppositeAnchor(anchor));
 assert.ok(Math.hypot(fixed.x-actual.x,fixed.y-actual.y)<1e-8);if(locked)assert.ok(Math.abs(w/h-43/54)<1e-8);assert.ok(w>=1&&h>=1);cases++;
}
const source={w:1800,h:1200},target={w:100,h:100},before=photoPlacement(source,target,'cover'),moved=panPhotoCrop(source,target,'cover',CENTER_CROP,{x:10,y:0}),after=photoPlacement(source,target,'cover',moved);assert.ok(Math.abs(after.x-before.x-10)<1e-8);assert.equal(moved.focal_y,.5);assert.deepEqual(target,{w:100,h:100});assert.equal(photoPlacement(source,target,'cover',panPhotoCrop(source,target,'cover',CENTER_CROP,{x:999,y:0})).x,0);assert.deepEqual(panPhotoCrop(source,target,'contain',CENTER_CROP,{x:20,y:30}),CENTER_CROP);
console.log(`Transform/crop regression completed: ${cases} geometry combinations; all eight handles, ratio lock, pan, four scales and 0°/30°/90° rotation; crop drag direction/clamping/contain and unchanged slot dimensions. Pointer/touch UI acceptance remains NOT_TESTED.`);
