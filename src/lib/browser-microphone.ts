// Inspect the microphone without routing it to the speakers (avoids feedback).
export function microphoneMonitor(){
 let context:AudioContext|undefined,source:MediaStreamAudioSourceNode|undefined,analyser:AnalyserNode|undefined;
 let samples:Float32Array<ArrayBuffer>|undefined,heard=false,checks=0;
 try{context=new AudioContext();void context.resume().catch(()=>{});}catch{/* Recording can still work without Web Audio. */}
 return {
  connect(stream:MediaStream){
   if(!context)return;
   try{source=context.createMediaStreamSource(stream);analyser=context.createAnalyser();analyser.fftSize=16384;source.connect(analyser);samples=new Float32Array(analyser.fftSize);}catch{analyser=undefined;}
  },
  sample(){
   if(!analyser||!samples||context?.state!=='running')return null;
   analyser.getFloatTimeDomainData(samples);let sum=0;
   for(const value of samples)sum+=value*value;
   const rms=Math.sqrt(sum/samples.length);checks++;if(rms>.001)heard=true;
   return Math.min(1,rms*8);
  },
  get silent(){return checks>=3&&!heard;},
  close(){source?.disconnect();analyser?.disconnect();if(context&&context.state!=='closed')void context.close().catch(()=>{});}
 };
}
