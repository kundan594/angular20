import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  Observable,
  of,
  from,
  interval,
  timer,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject,
  combineLatest,
  forkJoin,
  concat,
  merge,
  zip,
  race,
  throwError,
  EMPTY,
  NEVER
} from 'rxjs';
import {
  map,
  filter,
  tap,
  catchError,
  retry,
  retryWhen,
  delay,
  delayWhen,
  debounceTime,
  throttleTime,
  distinctUntilChanged,
  take,
  takeUntil,
  takeWhile,
  skip,
  skipUntil,
  skipWhile,
  first,
  last,
  single,
  ignoreElements,
  elementAt,
  find,
  findIndex,
  count,
  min,
  max,
  reduce,
  scan,
  buffer,
  bufferCount,
  bufferTime,
  bufferToggle,
  bufferWhen,
  window,
  windowCount,
  windowTime,
  windowToggle,
  windowWhen,
  groupBy,
  mergeMap,
  concatMap,
  switchMap,
  exhaustMap,
  expand,
  mergeScan,
  pairwise,
  partition,
  pluck,
  repeat,
  repeatWhen,
  retryWhen as retryWhenOp,
  sample,
  sampleTime,
  share,
  shareReplay,
  startWith,
  withLatestFrom,
  zip as zipOp,
  audit,
  auditTime,
  debounce,
  throttle,
  distinct,
  distinctUntilKeyChanged,
  timeout,
  timeoutWith
} from 'rxjs/operators';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

@Component({
  selector: 'app-rxjs-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rxjs-demo.component.html',
  styleUrls: ['./rxjs-demo.component.css']
})
export class RxjsDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = 'https://jsonplaceholder.typicode.com';

  // Subjects for demonstration
  private clickSubject = new Subject<string>();
  private behaviorSubject = new BehaviorSubject<string>('Initial value');
  private replaySubject = new ReplaySubject<string>(3);
  private asyncSubject = new AsyncSubject<string>();

  // Observable examples
  results: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.demonstrateOperators();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private demonstrateOperators() {
    // 1. Static Observables
    this.staticObservables();

    // 2. Creation Operators
    this.creationOperators();

    // 3. Transformation Operators
    this.transformationOperators();

    // 4. Filtering Operators
    this.filteringOperators();

    // 5. Combination Operators
    this.combinationOperators();

    // 6. Flattening Operators
    this.flatteningOperators();

    // 7. Error Handling
    this.errorHandling();

    // 8. Subjects
    this.subjectsDemo();

    // 9. Multicasting
    this.multicastingDemo();
  }

  private staticObservables() {
    console.log('=== Static Observables ===');

    // of - emits values synchronously
    of(1, 2, 3, 4, 5)
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('of:', val));

    // from - converts array/promise/iterable to observable
    from([10, 20, 30])
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('from array:', val));

    // from with promise
    from(fetch(`${this.apiUrl}/posts/1`).then(res => res.json()))
      .pipe(takeUntil(this.destroy$))
      .subscribe(post => console.log('from promise:', post));
  }

  private creationOperators() {
    console.log('=== Creation Operators ===');

    // interval - emits sequential numbers at intervals
    interval(1000)
      .pipe(take(5), takeUntil(this.destroy$))
      .subscribe(val => console.log('interval:', val));

    // timer - emits after delay, then optionally at intervals
    timer(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => console.log('timer fired'));
  }

  private transformationOperators() {
    console.log('=== Transformation Operators ===');

    // map - transforms each value
    this.http.get<Post[]>(`${this.apiUrl}/posts`)
      .pipe(
        map(posts => posts.map(post => ({ ...post, title: post.title.toUpperCase() }))),
        takeUntil(this.destroy$)
      )
      .subscribe(posts => console.log('map:', posts.slice(0, 2)));

    // pluck - extracts property from object
    this.http.get<Post[]>(`${this.apiUrl}/posts`)
      .pipe(
        map(posts => posts.slice(0, 3)),
        pluck('title'),
        takeUntil(this.destroy$)
      )
      .subscribe(titles => console.log('pluck titles:', titles));

    // scan - accumulates values (like reduce but emits intermediate results)
    of(1, 2, 3, 4, 5)
      .pipe(scan((acc, val) => acc + val, 0), takeUntil(this.destroy$))
      .subscribe(val => console.log('scan sum:', val));

    // reduce - accumulates all values into single result
    of(1, 2, 3, 4, 5)
      .pipe(reduce((acc, val) => acc + val, 0), takeUntil(this.destroy$))
      .subscribe(val => console.log('reduce sum:', val));
  }

  private filteringOperators() {
    console.log('=== Filtering Operators ===');

    // filter - emits only values that pass predicate
    this.http.get<Post[]>(`${this.apiUrl}/posts`)
      .pipe(
        map(posts => posts.slice(0, 10).filter(post => post.id % 2 === 0)),
        takeUntil(this.destroy$)
      )
      .subscribe(posts => console.log('filter even ids:', posts));

    // take - emits first n values then completes
    this.http.get<Post[]>(`${this.apiUrl}/posts`)
      .pipe(
        take(3),
        takeUntil(this.destroy$)
      )
      .subscribe(posts => console.log('take 3:', posts));

    // takeUntil - emits until notifier emits
    interval(500)
      .pipe(
        takeUntil(timer(3000)),
        takeUntil(this.destroy$)
      )
      .subscribe(val => console.log('takeUntil timer:', val));

    // takeWhile - emits while condition is true
    of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
      .pipe(takeWhile(val => val <= 5), takeUntil(this.destroy$))
      .subscribe(val => console.log('takeWhile <=5:', val));

    // skip - skips first n values
    of(1, 2, 3, 4, 5)
      .pipe(skip(2), takeUntil(this.destroy$))
      .subscribe(val => console.log('skip 2:', val));

    // first - emits first value (or first that matches predicate)
    this.http.get<Post[]>(`${this.apiUrl}/posts`)
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe(post => console.log('first post:', post));

    // last - emits last value
    of(1, 2, 3, 4, 5)
      .pipe(last(), takeUntil(this.destroy$))
      .subscribe(val => console.log('last:', val));

    // distinctUntilChanged - emits when value changes
    of(1, 1, 2, 2, 3, 3, 3, 4)
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(val => console.log('distinctUntilChanged:', val));

    // debounceTime - emits value after pause in emissions
    this.clickSubject
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe(val => console.log('debounced click:', val));

    // throttleTime - emits then ignores for duration
    interval(500)
      .pipe(throttleTime(2000), take(5), takeUntil(this.destroy$))
      .subscribe(val => console.log('throttled:', val));
  }

  private combinationOperators() {
    console.log('=== Combination Operators ===');

    // combineLatest - combines latest values from multiple observables
    const posts$ = this.http.get<Post[]>(`${this.apiUrl}/posts`).pipe(map(posts => posts.slice(0, 3)));
    const users$ = this.http.get<User[]>(`${this.apiUrl}/users`).pipe(map(users => users.slice(0, 3)));

    combineLatest([posts$, users$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([posts, users]) => console.log('combineLatest:', { posts: posts.length, users: users.length }));

    // forkJoin - waits for all observables to complete, emits last values
    forkJoin({
      posts: this.http.get<Post[]>(`${this.apiUrl}/posts`).pipe(map(posts => posts.slice(0, 2))),
      users: this.http.get<User[]>(`${this.apiUrl}/users`).pipe(map(users => users.slice(0, 2)))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => console.log('forkJoin:', result));

    // concat - concatenates observables sequentially
    const obs1$ = of(1, 2, 3);
    const obs2$ = of(4, 5, 6);
    concat(obs1$, obs2$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('concat:', val));

    // merge - merges multiple observables concurrently
    const timer1$ = timer(1000).pipe(map(() => 'timer1'));
    const timer2$ = timer(2000).pipe(map(() => 'timer2'));
    merge(timer1$, timer2$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('merge:', val));

    // zip - combines corresponding values from multiple observables
    const letters$ = of('A', 'B', 'C');
    const numbers$ = of(1, 2, 3);
    zip(letters$, numbers$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([letter, number]) => console.log('zip:', letter, number));

    // race - emits from first observable to emit
    const fast$ = timer(1000).pipe(map(() => 'fast'));
    const slow$ = timer(3000).pipe(map(() => 'slow'));
    race(fast$, slow$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => console.log('race winner:', val));
  }

  private flatteningOperators() {
    console.log('=== Flattening Operators ===');

    // mergeMap - maps to observable and merges emissions
    this.http.get<Post[]>(`${this.apiUrl}/posts`)
      .pipe(
        map(posts => posts.slice(0, 3)),
        mergeMap(posts => from(posts)),
        mergeMap(post => this.http.get<Comment[]>(`${this.apiUrl}/posts/${post.id}/comments`).pipe(
          map(comments => ({ post: post.title, comments: comments.length }))
        )),
        takeUntil(this.destroy$)
      )
      .subscribe(result => console.log('mergeMap:', result));

    // concatMap - maps to observable and concatenates sequentially
    of(1, 2, 3)
      .pipe(
        concatMap(id => timer(1000).pipe(map(() => `Request ${id} completed`))),
        takeUntil(this.destroy$)
      )
      .subscribe(val => console.log('concatMap:', val));

    // switchMap - maps to observable, cancels previous inner observable
    this.clickSubject
      .pipe(
        switchMap(searchTerm => this.simulateSearch(searchTerm)),
        takeUntil(this.destroy$)
      )
      .subscribe(results => console.log('switchMap search:', results));

    // exhaustMap - maps to observable, ignores new values while inner is active
    this.clickSubject
      .pipe(
        exhaustMap(() => timer(2000).pipe(map(() => 'Request completed'))),
        takeUntil(this.destroy$)
      )
      .subscribe(val => console.log('exhaustMap:', val));
  }

  private errorHandling() {
    console.log('=== Error Handling ===');

    // catchError - catches error and returns new observable
    this.http.get(`${this.apiUrl}/nonexistent`)
      .pipe(
        catchError(error => {
          console.log('catchError caught:', error.message);
          return of({ error: 'Fallback data' });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => console.log('catchError result:', result));

    // retry - retries failed observable
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

    // retryWhen - retries based on custom logic
    this.http.get(`${this.apiUrl}/posts/1`)
      .pipe(
        map(() => {
          if (Math.random() > 0.7) throw new Error('Random error');
          return { success: true };
        }),
        retryWhen(errors => errors.pipe(delay(1000), take(3))),
        catchError(() => of({ retryWhenFailed: true })),
        takeUntil(this.destroy$)
      )
      .subscribe(result => console.log('retryWhen result:', result));
  }

  private subjectsDemo() {
    console.log('=== Subjects ===');

    // Subject - multicast, no initial value
    this.clickSubject.subscribe(val => console.log('Subject subscriber 1:', val));
    this.clickSubject.subscribe(val => console.log('Subject subscriber 2:', val));

    // BehaviorSubject - has initial value, emits last value to new subscribers
    this.behaviorSubject.subscribe(val => console.log('BehaviorSubject:', val));
    this.behaviorSubject.next('New value');

    // ReplaySubject - replays last n emissions to new subscribers
    this.replaySubject.next('First');
    this.replaySubject.next('Second');
    this.replaySubject.next('Third');
    this.replaySubject.subscribe(val => console.log('ReplaySubject:', val));

    // AsyncSubject - only emits last value when complete
    this.asyncSubject.next('Value 1');
    this.asyncSubject.next('Value 2');
    this.asyncSubject.subscribe(val => console.log('AsyncSubject:', val));
    this.asyncSubject.next('Final value');
    this.asyncSubject.complete();
  }

  private multicastingDemo() {
    console.log('=== Multicasting ===');

    // share - shares single subscription among multiple subscribers
    const shared$ = this.http.get<Post[]>(`${this.apiUrl}/posts`).pipe(share());

    shared$.pipe(takeUntil(this.destroy$)).subscribe(posts => console.log('Shared 1:', posts.length));
    shared$.pipe(takeUntil(this.destroy$)).subscribe(posts => console.log('Shared 2:', posts.length));

    // shareReplay - shares and replays last n emissions
    const sharedReplay$ = this.http.get<Post[]>(`${this.apiUrl}/posts`).pipe(shareReplay(1));

    sharedReplay$.pipe(takeUntil(this.destroy$)).subscribe(posts => console.log('SharedReplay 1:', posts.length));
    setTimeout(() => {
      sharedReplay$.pipe(takeUntil(this.destroy$)).subscribe(posts => console.log('SharedReplay 2 (replayed):', posts.length));
    }, 1000);
  }

  private simulateSearch(term: string): Observable<string[]> {
    return timer(500).pipe(map(() => [`Result for ${term} 1`, `Result for ${term} 2`]));
  }

  // Methods for template interaction
  onClick(action: string) {
    this.clickSubject.next(action);
  }

  onSearch(term: string) {
    this.clickSubject.next(term);
  }
}