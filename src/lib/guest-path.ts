/** Public event URL shared by guest navigation, admin links and QR exports. */
export function guestPath(slug:string){
 return slug==='wahyu-novita'?'/wahyu-novita':'/e/'+slug;
}
