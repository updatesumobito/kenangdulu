export const EVENT_THEME_IDS=['booking','wedding-ivory','maroon-romance','botanical-sage','graduation-navy','birthday-pastel','corporate-minimal','curtain-olive'] as const;
export const EVENT_THEMES=EVENT_THEME_IDS.map(id=>({id,label:id==='curtain-olive'?'Curtain Olive · Burgundy & Ivory (design 5)':id}));
