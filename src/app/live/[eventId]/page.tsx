import LiveWall from '@/components/live-wall';
export default async function Page({params}:{params:Promise<{eventId:string}>}){return <LiveWall id={(await params).eventId}/>}
