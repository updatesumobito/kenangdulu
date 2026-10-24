import GuestWelcome from '../e/[slug]/page';
export const dynamic='force-dynamic';
export const metadata={title:'Nava & Akhsan · 25 Oktober 2026',robots:{index:false,follow:false}};
export default function NavaAkhsan(){
 return <GuestWelcome params={Promise.resolve({slug:'nava-akhsan'})}/>;
}
