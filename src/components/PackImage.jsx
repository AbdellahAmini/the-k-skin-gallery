import { useEffect, useState } from 'react';
import { Package } from '@phosphor-icons/react';

export default function PackImage({ src, alt, className = '', placeholder = 'Photo du pack à venir', eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <div className={`pack-art ${className}`}>
    {src && !failed
      ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
      : <div className="pack-art-placeholder" role="img" aria-label={placeholder}><Package size={42} weight="thin" /><span>{placeholder}</span></div>}
  </div>;
}
