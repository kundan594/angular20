import { Injectable } from '@angular/core';
import { SCROLLING_CONFIG } from './scrolling.constants';

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollingService {
  async fetchPosts(page: number): Promise<Post[]> {
    const params = new URLSearchParams({
      _page: page.toString(),
      _limit: SCROLLING_CONFIG.PAGE_SIZE.toString()
    });

    const response = await fetch(
      `${SCROLLING_CONFIG.API_URL}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const posts: Post[] = await response.json();
    return posts;
  }

  filterPosts(posts: Post[], term: string): Post[] {
    const searchTerm = term.trim().toLowerCase();
    if (!searchTerm) {
      return posts;
    }

    return posts.filter((post) => {
      return (
        post.title.toLowerCase().includes(searchTerm) ||
        post.body.toLowerCase().includes(searchTerm)
      );
    });
  }
}
