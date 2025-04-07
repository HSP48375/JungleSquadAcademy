// This file contains references to background images for quote sharing
// These are placeholder URLs that point to Unsplash images

export const QUOTE_BACKGROUNDS = [
  {
    id: 'jungle-tech-1',
    url: 'https://images.unsplash.com/photo-1518050346340-aa2ec3bb424b?q=80&w=800&auto=format&fit=crop',
    theme: 'default',
  },
  {
    id: 'jungle-tech-2',
    url: 'https://images.unsplash.com/photo-1518050346340-aa2ec3bb424b?q=80&w=800&auto=format&fit=crop',
    theme: 'default',
  },
  {
    id: 'math-bg',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
    theme: 'math',
  },
  {
    id: 'history-bg',
    url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=800&auto=format&fit=crop',
    theme: 'history',
  },
  {
    id: 'language-bg',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
    theme: 'language',
  },
  {
    id: 'science-bg',
    url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=800&auto=format&fit=crop',
    theme: 'science',
  },
  {
    id: 'art-bg',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecaea4752?q=80&w=800&auto=format&fit=crop',
    theme: 'art',
  },
  {
    id: 'tech-bg',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    theme: 'tech',
  },
];

export const LOGO_URL = 'https://images.unsplash.com/photo-1696446700704-46484532a18e?q=80&w=300&auto=format&fit=crop';

export const getBackgroundForTheme = (theme) => {
  const backgrounds = QUOTE_BACKGROUNDS.filter(bg => bg.theme === theme);
  if (backgrounds.length === 0) {
    // Return default if no matching theme
    return QUOTE_BACKGROUNDS[0].url;
  }
  
  // Return a random background for the theme
  return backgrounds[Math.floor(Math.random() * backgrounds.length)].url;
};