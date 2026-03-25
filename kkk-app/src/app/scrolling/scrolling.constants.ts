export const SCROLLING_CONFIG = {
  API_URL: 'https://jsonplaceholder.typicode.com/posts',
  PAGE_SIZE: 10,
  MAX_POSTS: 100,
  OBSERVER_THRESHOLD: 100, // px from bottom for Intersection Observer
  DEBOUNCE_DELAY: 500, // ms to debounce scroll/load requests
} as const;
