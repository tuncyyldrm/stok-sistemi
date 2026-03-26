'use client';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className }: ProductImageProps) {
  const getImageUrl = (url: string) => {
    if (!url) return '/placeholder.png';

    // Google Drive linki kontrolü
    if (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com')) {
      // ID'yi ayıklayan en temiz regex
      const idMatch = url.match(/[-\w]{25,}/);
      
      if (idMatch) {
        // Thumbnail URL hem daha hızlıdır hem de 429 hatası alma olasılığı çok daha düşüktür.
        // sz=w1000 parametresi yüksek çözünürlük sağlar.
        return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w1000`;
      }
    }
    
    // Eğer doğrudan bir resim linkiyse (örn: .jpg, .png) olduğu gibi döndür
    return url;
  };

  return (
    <img 
      src={getImageUrl(src)} 
      alt={alt} 
      className={className}
      // Önemli: Tarayıcı bazlı cache'i zorlamak ve yönlendirmeleri takip etmek için
      referrerPolicy="no-referrer"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        // Eğer thumbnail yapısı da hata verirse, son çare 'uc' (export) yöntemini dene
        if (!target.src.includes('export=view')) {
           const idMatch = src.match(/[-\w]{25,}/);
           if (idMatch) {
             target.src = `https://drive.google.com/uc?export=view&id=${idMatch[0]}`;
             return;
           }
        }
        target.src = '/placeholder.png';
      }}
    />
  );
}