export default function ProductImage({ src, alt, className = '', eager = false }) {
  return <img className={className} src={src || '/assets/product-fallback.svg'} alt={alt}
    loading={eager ? 'eager' : 'lazy'} decoding="async"
    onError={(event) => { if (!event.currentTarget.src.endsWith('product-fallback.svg')) event.currentTarget.src = '/assets/product-fallback.svg'; }} />;
}
