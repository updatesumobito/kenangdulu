/** New orders use the explicit entitlement; existing snapshots keep their original QR behavior. */
export function canExportQrPdf(snapshot:{qrPdf?:boolean;frames:number}){return snapshot.qrPdf??snapshot.frames>0;}
