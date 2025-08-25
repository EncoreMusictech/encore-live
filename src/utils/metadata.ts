interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

export const updatePageMetadata = ({ title, description, keywords, ogImage }: PageMetadata) => {
  if (title) {
    document.title = title;
    updateMetaTag('og:title', title);
    updateMetaTag('twitter:title', title);
  }
  
  if (description) {
    updateMetaTag('description', description);
    updateMetaTag('og:description', description);
    updateMetaTag('twitter:description', description);
  }
  
  if (keywords) {
    updateMetaTag('keywords', keywords);
  }
  
  if (ogImage) {
    updateMetaTag('og:image', ogImage);
    updateMetaTag('twitter:image', ogImage);
  }
};

const updateMetaTag = (name: string, content: string) => {
  let element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(name.includes(':') ? 'property' : 'name', name);
    document.head.appendChild(element);
  }
  
  element.content = content;
};