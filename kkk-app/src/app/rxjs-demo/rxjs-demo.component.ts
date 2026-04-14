import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Comment, Post, RxjsService } from './rxjs.service';

/**
 * RxJS Demo Component
 * 
 * REFACTORED: Now uses RxjsService for all business logic
 * 
 * This component is now CLEANER and SIMPLER:
 * - Focuses only on UI and user interactions
 * - Delegates API calls to the service
 * - All subjects and observables managed by service
 * - Much easier to test and maintain
 * 
 * Benefits of this architecture:
 * ✅ Separation of Concerns
 * ✅ Reusability (service can be used in other components)
 * ✅ Testability (easier to mock the service)
 * ✅ Maintainability (business logic isolated)
 * ✅ Scalability (add features to service without cluttering component)
 */
@Component({
  selector: 'app-rxjs-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rxjs-demo.component.html',
  styleUrls: ['./rxjs-demo.component.css']
})
export class RxjsDemoComponent implements OnInit, OnDestroy {
  public combineLatestDemo$: Observable<{ userId: number; search: string }>;
  public filteredPosts$: Observable<Post[]>;
  public postSearchResults$: Observable<Post[]>;
  public selectedPostComments$: Observable<Comment[]>;
  public selectedUserId = 1;
  public searchQuery = '';
  public postSearchQuery = '';
  public selectedPostId: number | null = null;

  constructor(private rxjsService: RxjsService) {
    this.combineLatestDemo$ = this.rxjsService.combineLatestDemo$;
    this.filteredPosts$ = this.rxjsService.filteredPosts$;
    this.postSearchResults$ = this.rxjsService.postSearchResults$;
    this.selectedPostComments$ = this.rxjsService.selectedPostComments$;
  }

  ngOnInit() {
    // Run all demonstrations from service
    this.rxjsService.runAllDemos();
  }

  ngOnDestroy() {
    // Cleanup all subscriptions
    this.rxjsService.destroy();
  }

  /**
   * Handle click events
   * Delegates to subject managed by service
   */
  onClick(action: string): void {
    this.rxjsService.clickSubject.next(action);
  }

  /**
   * Handle search events
   * Delegates to subject managed by service
   */
  onSearch(term: string): void {
    this.rxjsService.clickSubject.next(term);
  }

  /**
   * Select a user ID for the combineLatest example.
   */
  selectUser(userId: number): void {
    this.selectedUserId = userId;
    this.rxjsService.selectUser(userId);
  }

  /**
   * Update search text for the combineLatest example.
   */
  updateSearch(term: string): void {
    this.searchQuery = term;
    this.rxjsService.updateSearchTerm(term);
  }

  /**
   * Update the live post search query for the real-world search scenario.
   */
  updatePostSearch(term: string): void {
    this.postSearchQuery = term;
    this.rxjsService.searchPosts(term);
  }

  /**
   * Choose a post and load its comments.
   */
  selectPost(postId: number): void {
    this.selectedPostId = postId;
    this.rxjsService.selectPost(postId);
  }
}