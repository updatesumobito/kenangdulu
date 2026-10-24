type Variant='horizontal'|'signature'|'stacked'|'mark'|'wordmark';
export default function BrandLogo({variant='horizontal',appearance='auto'}:{variant?:Variant,appearance?:'auto'|'light'|'dark'}){
 return <span className={'brand-logo brand-logo-'+variant} data-appearance={appearance} role="img" aria-label="Kenang Dulu">
  <picture className="brand-logo-light"><source media="(max-width: 760px)" srcSet="/brand/kenang-dulu-mark-light.webp"/><img src={'/brand/kenang-dulu-'+variant+'-light.webp'} alt="" decoding="async"/></picture>
  <picture className="brand-logo-dark"><source media="(max-width: 760px)" srcSet="/brand/kenang-dulu-mark-dark.webp"/><img src={'/brand/kenang-dulu-'+(variant==='horizontal'?'signature':variant)+'-dark.webp'} alt="" decoding="async"/></picture>
 </span>;
}
