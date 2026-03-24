import { CommonModule } from '@angular/common';
import { Component, computed, signal, WritableSignal } from '@angular/core';
import { ScrollingService, Post } from './scrolling.service';
import { SCROLLING_CONFIG } from './scrolling.constants';

@Component({
  selector: 'app-scrolling',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scrolling.component.html',
  styleUrl: './scrolling.component.css'
})
export class ScrollingComponent {
  private readonly scrollingService = new ScrollingService();

  protected readonly posts: WritableSignal<Post[]> = signal([]);
  protected readonly page = signal(1);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');
  protected readonly filter = signal('');

  protected readonly hasMore = computed(
    () => this.page() * SCROLLING_CONFIG.PAGE_SIZE <= SCROLLING_CONFIG.MAX_POSTS
  );

  protected readonly filteredPosts = computed(() => {
    return this.scrollingService.filterPosts(this.posts(), this.filter());
  });

  private readonly onWindowScroll = () => {
    if (this.isLoading() || !this.hasMore()) {
      return;
    }

    const scrollPosition = window.scrollY + window.innerHeight;
    const triggerPoint = document.documentElement.scrollHeight - SCROLLING_CONFIG.SCROLL_THRESHOLD;

    if (scrollPosition >= triggerPoint) {
      this.loadNextPage();
    }
  };

  constructor() {
    this.loadNextPage();
    window.addEventListener('scroll', this.onWindowScroll, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onWindowScroll);
  }

  protected onFilterChange(value: string) {
    this.filter.set(value);
  }

  protected async loadNextPage() {
    if (this.isLoading() || !this.hasMore()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    const currentPage = this.page();

    try {
      const newPosts = await this.scrollingService.fetchPosts(currentPage);
      this.posts.set([...this.posts(), ...newPosts]);
      this.page.set(currentPage + 1);

      // Add delay for testing loader visibility
      await new Promise((resolve) => setTimeout(resolve, SCROLLING_CONFIG.LOADER_DELAY));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.error.set(`Failed to load posts: ${message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
