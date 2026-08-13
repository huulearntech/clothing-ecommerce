import { useEffect } from 'react';

export function usePageTitle(title: string, description?: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = `${title} | StyleShop`;
    document.title = fullTitle;

    if (description) {
      let metaDescription = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}
