/** Guest features available for each event, including existing guest sessions. */
export function guestSettings<T extends {modes:string[]}>(slug:string,settings:T):T{
 if(slug!=='wahyu-novita')return settings;
 return {...settings,modes:settings.modes.filter(mode=>!['photo_strip','gif'].includes(mode))};
}
