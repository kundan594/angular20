export const SCROLLING_CONFIG = {
  API_URL: 'https://jsonplaceholder.typicode.com/posts',
  PAGE_SIZE: 10,
  MAX_POSTS: 100,
  SCROLL_THRESHOLD: 300, // px from bottom
  LOADER_DELAY: 3000, // ms for testing
} as const;
