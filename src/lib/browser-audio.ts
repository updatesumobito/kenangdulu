/** Normalize Chrome's fragmented Opus/MP4 voice drafts before server upload. */
export async function uploadableGuestVoice(blob:Blob){
 if(!/^audio\/mp4\s*;.*\bopus\b/i.test(blob.type))return blob;
 // Decode all samples without playing the recording or requiring microphone
 // permission again. PCM/WAV avoids fragmented MP4 timestamp/codec differences.
 const context=new OfflineAudioContext(1,1,48000),audio=await context.decodeAudioData(await blob.arrayBuffer());
 const channels=audio.numberOfChannels,length=audio.length*channels*2;
 if(!channels||!audio.length||length+44>8*1024**2)throw Object.assign(Error('Rekaman suara belum dapat disiapkan. Pilih rekaman yang lebih pendek.'),{code:'FILE_TOO_LARGE'});
 const bytes=new ArrayBuffer(44+length),view=new DataView(bytes);
 const text=(offset:number,value:string)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
 text(0,'RIFF');view.setUint32(4,36+length,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,audio.sampleRate,true);view.setUint32(28,audio.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,length,true);
 const tracks=Array.from({length:channels},(_,channel)=>audio.getChannelData(channel));let offset=44;
 for(let frame=0;frame<audio.length;frame++)for(const track of tracks){const value=Math.max(-1,Math.min(1,track[frame]));view.setInt16(offset,Math.round(value*(value<0?32768:32767)),true);offset+=2;}
 return new Blob([bytes],{type:'audio/wav'});
}
