import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, WritableSignal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ScrollingService, Post } from './scrolling.service';
import { SCROLLING_CONFIG } from './scrolling.constants';

@Component({
  selector: 'app-scrolling',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scrolling.component.html',
  styleUrl: './scrolling.component.css'
})
export class ScrollingComponent implements OnInit, OnDestroy {
  private readonly scrollingService = inject(ScrollingService);
  @ViewChild('sentinel', { static: false }) sentinel!: ElementRef;

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

  private observer: IntersectionObserver | null = null;
  private loadTimeout: number | null = null;
  private isLoadingScheduled = false;

  ngOnInit(): void {
    this.loadNextPage();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.loadTimeout !== null) {
      clearTimeout(this.loadTimeout);
    }
  }

  private setupIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: `${SCROLLING_CONFIG.OBSERVER_THRESHOLD}px`,
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.isLoadingScheduled && this.hasMore()) {
          this.scheduleLoadNextPage();
        }
      });
    }, options);

    // Observe the sentinel element
    setTimeout(() => {
      if (this.sentinel) {
        this.observer!.observe(this.sentinel.nativeElement);
      }
    });
  }

  private scheduleLoadNextPage(): void {
    if (this.isLoadingScheduled) {
      return;
    }

    this.isLoadingScheduled = true;

    if (this.loadTimeout !== null) {
      clearTimeout(this.loadTimeout);
    }

    this.loadTimeout = window.setTimeout(() => {
      this.isLoadingScheduled = false;
      this.loadNextPage();
    }, SCROLLING_CONFIG.DEBOUNCE_DELAY);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.error.set(`Failed to load posts: ${message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
