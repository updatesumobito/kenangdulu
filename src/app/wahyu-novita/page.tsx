import GuestWelcome from '@/app/e/[slug]/page';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false}};
export default function WahyuNovita(){
 return <GuestWelcome params={Promise.resolve({slug:'wahyu-novita'})}/>;
}
