/** Public event URL shared by guest navigation, admin links and QR exports. */
export function guestPath(slug:string){
 return ['wahyu-novita','nava-akhsan'].includes(slug)?'/'+slug:'/e/'+slug;
}
