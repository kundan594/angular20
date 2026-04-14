import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Subject, BehaviorSubject, ReplaySubject, AsyncSubject, Observable, of, from, interval, timer,
  combineLatest, forkJoin, concat, merge, zip, race
} from 'rxjs';
import {
  map, take, takeUntil, skip, first, last, distinctUntilChanged, debounceTime, throttleTime,
  mergeMap, concatMap, switchMap, exhaustMap,
  catchError, retry, retryWhen, delay, reduce, scan, filter, shareReplay, tap
} from 'rxjs/operators';

/**
 * Interface for Post data from API
 */
export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}


/**
 * Interface for User data from API
 */
export interface User {
  id: number;
  name: string;
  email: string;
}

/**
 * Interface for Comment data from API
 */
export interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

/**
 * RxJS Service
 * Manages all API calls, subjects, and RxJS operator demonstrations
 * Centralizes business logic and data management
 * 
 * Benefits of using a service:
 * 1. Separation of Concerns - Component focuses on UI, Service handles data
 * 2. Reusability - Service can be injected into multiple components
 * 3. Testability - Easier to unit test service methods independently
 * 4. Maintainability - Centralized API and subject management
 * 5. Scalability - Easy to add new features without cluttering component
 */
@Injectable({
  providedIn: 'root'
})
export class RxjsService {
  private apiUrl = 'https://jsonplaceholder.typicode.com';
  private destroy$ = new Subject<void>();

  

  // PUBLIC Subjects for external subscriptions
  public clickSubject = new Subject<string>();
  public behaviorSubject = new BehaviorSubject<string>('Initial value');
  public replaySubject = new ReplaySubject<string>(3);
  public asyncSubject = new AsyncSubject<string>();

  // combineLatest demo subjects
  public selectedUser$ = new BehaviorSubject<number>(1);
  public searchTerm$ = new BehaviorSubject<string>('');

  // Real-world search + detail scenario
  public postSearchQuery$ = new BehaviorSubject<string>('');
  public selectedPostId$ = new BehaviorSubject<number | null>(null);

  /**
   * Public combineLatest demo observable.
   * Emits whenever selectedUser$ or searchTerm$ changes.
   */
  public combineLatestDemo$ = combineLatest([this.selectedUser$, this.searchTerm$]).pipe(
    map(([userId, search]) => ({ userId, search }))
  );

  /**
   * Advanced reactive search example.
   * Uses combineLatest, debounceTime, distinctUntilChanged, switchMap, catchError, and shareReplay.
   * This is a realistic pattern for live search and filter UIs.
   */
  public filteredPosts$ = combineLatest([
    this.selectedUser$,
    this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
  ]).pipe(
    switchMap(([userId, search]) =>
      this.getPosts(50).pipe(
        map(posts =>
          posts.filter(post =>
            post.userId === userId &&
            post.title.toLowerCase().includes(search.toLowerCase())
          )
        ),
        catchError(error => {
          console.error('Error filtering posts:', error);
          return of([] as Post[]);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Search results for a realistic typeahead scenario.
   * Debounces user input, ignores unchanged search terms, cancels stale requests,
   * and shares the latest result across multiple subscribers.
   */
  public postSearchResults$ = this.postSearchQuery$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query =>
      this.getPosts(50).pipe(
        map(posts =>
          posts.filter(post =>
            post.title.toLowerCase().includes(query.toLowerCase())
          )
        ),
        catchError(error => {
          console.error('Error loading search results:', error);
          return of([] as Post[]);
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Selected post comments loader.
   * Uses switchMap so selecting a different post cancels the previous comment-load request.
   */
  public selectedPostComments$ = this.selectedPostId$.pipe(
    switchMap(postId =>
      postId === null
        ? of([] as Comment[])
        : this.getComments(postId).pipe(
            catchError(error => {
              console.error('Error loading comments for selected post:', error);
              return of([] as Comment[]);
            })
          )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Queue of save operations processed one after the other.
   * concatMap is ideal for sequential workflows like autosave or upload queues.
   */
  private saveDraft$ = new Subject<Post>();
  public saveDraftResults$ = this.saveDraft$.pipe(
    concatMap(post =>
      this.simulateSave(post).pipe(
        tap(() => console.log('Saved draft for post', post.id)),
        catchError(error => {
          console.error('Save failed for post', post.id, error);
          return of({ success: false, postId: post.id });
        })
      )
    )
  );

  constructor(private http: HttpClient) {}

  /**
   * Cleanup method to unsubscribe from all observables
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== API Methods ====================

  /**
   * Get all posts from API
   * @param limit - Number of posts to fetch (optional)
   * @returns Observable of Post array
   */
  getPosts(limit: number = 10): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts`).pipe(
      map(posts => posts.slice(0, limit)),
      catchError(error => {
        console.error('Error fetching posts:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all users from API
   * @param limit - Number of users to fetch (optional)
   * @returns Observable of User array
   */
  getUsers(limit: number = 10): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      map(users => users.slice(0, limit)),
      catchError(error => {
        console.error('Error fetching users:', error);
        return of([]);
      })
    );
  }

  /**
   * Get comments for a specific post
   * @param postId - Post ID to fetch comments for
   * @returns Observable of Comment array
   */
  getComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/posts/${postId}/comments`).pipe(
      catchError(error => {
        console.error(`Error fetching comments for post ${postId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Update selected user for combineLatest demo.
   */
  selectUser(userId: number): void {
    this.selectedUser$.next(userId);
  }

  /**
   * Update search term for combineLatest demo.
   */
  updateSearchTerm(search: string): void {
    this.searchTerm$.next(search);
  }

  /**
   * Update the live post search query.
   */
  searchPosts(query: string): void {
    this.postSearchQuery$.next(query);
  }

  /**
   * Select a post to load detail comments.
   */
  selectPost(postId: number): void {
    this.selectedPostId$.next(postId);
  }

  /**
   * Queue a draft save operation.
   */
  queueSaveDraft(post: Post): void {
    this.saveDraft$.next(post);
  }

  // ==================== Transformation Operators ====================

  /**
   * Demonstrates map and pluck operators
   * Transforms posts to uppercase titles
   */
  demonstrateTransformation(): void {
    console.log('=== Transformation Operators ===');

    // map - transforms each value
    this.getPosts(5)
      .pipe(
        map(posts => posts.map(post => ({ ...post, title: post.title.toUpperCase() }))),
        takeUntil(this.destroy$)
      )
      .subscribe(posts => console.log('map:', posts.slice(0, 2)));

    // scan - accumulates values with intermediate results
    of(1, 2, 3, 4, 5)
      .pipe(scan((acc, val) => acc + val, 0), takeUntil(this.destroy$))
      .subscribe(val => console.log('scan sum:', val));

    // reduce - accumulates to single result
    of(1, 2, 3, 4, 5)
      .pipe(reduce((acc, val) => acc + val, 0), takeUntil(this.destroy$))
      .subscribe(val => console.log('reduce sum:', val));
  }

  // ==================== Filtering Operators ====================

  /**
   * Demonstrates filtering operators
   */
  demonstrateFiltering(): void {
    console.log('=== Filtering Operators ===');

    // filter - emits only even IDs
    this.getPosts(10)
      .pipe(
        map(posts => posts.filter(post => post.id % 2 === 0)),
        takeUntil(this.destroy$)
      )
      .subscribe(posts => console.log('filter even ids:', posts));

    // take - first n values
    of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      .pipe(take(3), takeUntil(this.destroy$))
      .subscribe(val => console.log('take 3 values:', val));

    // distinctUntilChanged - unique consecutive values
    of(1, 1, 2, 2, 3, 3, 3, 4)
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(val => console.log('distinctUntilChanged:', val));

    // skip - skip first n values
    of(1, 2, 3, 4, 5)
      .pipe(skip(2), takeUntil(this.destroy$))
      .subscribe(val => console.log('skip 2:', val));

    // first - first value
    of(1, 2, 3, 4, 5)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe(val => console.log('first:', val));

    // last - last value
    of(1, 2, 3, 4, 5)
      .pipe(last(), takeUntil(this.destroy$))
      .subscribe(val => console.log('last:', val));
  }

  // ==================== Combination Operators ====================

  /**
   * Demonstrates combination operators
   */
  demonstrateCombination(): void {
    console.log('=== Combination Operators ===');

    // combineLatest - latest values from multiple sources
    combineLatest([this.getPosts(3), this.getUsers(3)])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([posts, users]) => 
        console.log('combineLatest:', { posts: posts.length, users: users.length })
      );

    // forkJoin - wait for all to complete
    forkJoin({
      posts: this.getPosts(2),
      users: this.getUsers(2)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => console.log('forkJoin:', result));

    // concat - sequential merging
    concat(of(1, 2, 3), of(4, 5, 6))
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('concat:', val));

    // merge - concurrent merging
    merge(
      timer(1000).pipe(map(() => 'timer1')),
      timer(2000).pipe(map(() => 'timer2'))
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('merge:', val));

    // zip - corresponding values from arrays
    zip(of('A', 'B', 'C'), of(1, 2, 3))
      .pipe(takeUntil(this.destroy$))
      .subscribe(([letter, number]) => console.log('zip:', letter, number));

    // race - first to emit
    race(
      timer(1000).pipe(map(() => 'fast')),
      timer(3000).pipe(map(() => 'slow'))
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('race winner:', val));
  }

  // ==================== Flattening Operators ====================

  /**
   * Demonstrates flattening operators
   * mergeMap, concatMap, switchMap, exhaustMap
   */
  demonstrateFlattening(): void {
    console.log('=== Flattening Operators ===');

    // mergeMap - concurrent mapping
    this.getPosts(3)
      .pipe(
        mergeMap(posts => from(posts)),
        mergeMap(post => 
          this.getComments(post.id).pipe(
            map(comments => ({ title: post.title, commentCount: comments.length }))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(result => console.log('mergeMap:', result));

    // concatMap - sequential mapping
    of(1, 2, 3)
      .pipe(
        concatMap(id => timer(500).pipe(map(() => `Request ${id} completed`))),
        takeUntil(this.destroy$)
      )
      .subscribe(val => console.log('concatMap:', val));

    // switchMap - cancel previous on new value
    this.clickSubject
      .pipe(
        switchMap(term => this.simulateSearch(term)),
        takeUntil(this.destroy$)
      )
      .subscribe(results => console.log('switchMap search:', results));

    // exhaustMap - ignore while active
    this.clickSubject
      .pipe(
        exhaustMap(() => timer(2000).pipe(map(() => 'Request completed'))),
        takeUntil(this.destroy$)
      )
      .subscribe(val => console.log('exhaustMap:', val));
  }

  // ==================== Time-based Operators ====================

  /**
   * Demonstrates debounce and throttle
   */
  demonstrateTimeOperators(): void {
    console.log('=== Time-based Operators ===');

    // debounceTime - wait after pause
    this.clickSubject
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(val => console.log('debounced:', val));

    // throttleTime - emit then ignore
    interval(200)
      .pipe(throttleTime(1000), take(5), takeUntil(this.destroy$))
      .subscribe(val => console.log('throttled:', val));
  }

  // ==================== Error Handling ====================

  /**
   * Demonstrates error handling operators
   */
  demonstrateErrorHandling(): void {
    console.log('=== Error Handling ===');

    // catchError - handle and recover
    this.http.get(`${this.apiUrl}/invalid`).pipe(
      catchError(error => {
        console.log('catchError caught:', error.message);
        return of({ error: 'Fallback data' });
      }),
      takeUntil(this.destroy$)
    )
      .subscribe(result => console.log('catchError result:', result));

    // retry - retry on failure
    let attempts = 0;
    this.http.get(`${this.apiUrl}/posts/1`)
      .pipe(
        map(() => {
          attempts++;
          if (attempts < 3) throw new Error('Simulated error');
          return { success: true };
        }),
        retry(2),
        catchError(() => of({ finalError: true })),
        takeUntil(this.destroy$)
      )
      .subscribe(result => console.log('retry result:', result));

    // retryWhen - custom retry logic
    this.http.get(`${this.apiUrl}/posts/1`)
      .pipe(
        retryWhen(errors => errors.pipe(delay(1000), take(3))),
        catchError(() => of({ retryFailed: true })),
        takeUntil(this.destroy$)
      )
      .subscribe(result => console.log('retryWhen result:', result));
  }

  // ==================== Subjects Demo ====================

  /**
   * Demonstrates all types of subjects
   */
  demonstrateSubjects(): void {
    console.log('=== Subjects ===');

    // Subject - multicast, no initial value
    this.clickSubject.subscribe(val => console.log('Subject sub1:', val));
    this.clickSubject.subscribe(val => console.log('Subject sub2:', val));

    // BehaviorSubject - has initial value
    this.behaviorSubject.subscribe(val => console.log('BehaviorSubject:', val));
    this.behaviorSubject.next('Updated value');

    // ReplaySubject - replays last n values
    this.replaySubject.next('Value 1');
    this.replaySubject.next('Value 2');
    this.replaySubject.next('Value 3');
    this.replaySubject.subscribe(val => console.log('ReplaySubject:', val));

    // AsyncSubject - only last value on complete
    this.asyncSubject.next('Val 1');
    this.asyncSubject.next('Val 2');
    this.asyncSubject.subscribe(val => console.log('AsyncSubject:', val));
    this.asyncSubject.next('Final');
    this.asyncSubject.complete();
  }

  // ==================== Multicasting Demo ====================

  /**
   * Demonstrates share and shareReplay
   */
  demonstrateMulticasting(): void {
    console.log('=== Multicasting ===');

    // share - single subscription for multiple subscribers
    const shared$ = this.getPosts(5);
    shared$.subscribe(posts => console.log('Shared 1:', posts.length));
    shared$.subscribe(posts => console.log('Shared 2:', posts.length));
  }

  // ==================== Helper Methods ====================

  /**
   * Simulates a search operation
   * @param term - Search term
   * @returns Observable of search results
   */
  private simulateSearch(term: string): Observable<string[]> {
    return timer(500).pipe(
      map(() => [
        `Result for "${term}" 1`,
        `Result for "${term}" 2`,
        `Result for "${term}" 3`
      ])
    );
  }

  /**
   * Simulates saving a draft to the server.
   * In a real app this would be a POST/PUT call.
   */
  private simulateSave(post: Post): Observable<{ success: boolean; postId: number }> {
    return timer(600).pipe(
      map(() => ({ success: true, postId: post.id }))
    );
  }

  /**
   * Run all demonstrations
   */
  runAllDemos(): void {
    this.demonstrateTransformation();
    this.demonstrateFiltering();
    this.demonstrateCombination();
    this.demonstrateFlattening();
    this.demonstrateTimeOperators();
    this.demonstrateErrorHandling();
    this.demonstrateSubjects();
    this.demonstrateMulticasting();
  }
}
