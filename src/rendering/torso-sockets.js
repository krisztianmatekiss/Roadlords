// Socket coordinates belong to the source torso, just like its neck/waist.
// Changing torso size or position must move the attached shoulders with it.
export function torsoSockets(manifest,name,waist,height){
  const r=manifest.parts[name],a=manifest.anchors[name],width=height*r[2]/r[3];
  const at=[waist[0]-a.waist[0]*width,waist[1]-a.waist[1]*height];
  return imageSockets(manifest,name,at,height);
}
export function imageSockets(manifest,name,at,height){
  const r=manifest.parts[name],width=height*r[2]/r[3];
  return manifest.anchors[name].shoulders.map(([x,y])=>[at[0]+x*width,at[1]+y*height]);
}
