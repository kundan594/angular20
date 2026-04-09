import { Routes } from '@angular/router';
import { ScrollingComponent } from './scrolling/scrolling.component';
import { RxjsDemoComponent } from './rxjs-demo/rxjs-demo.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'scrolling',
    pathMatch: 'full'
  },
  {
    path: 'scrolling',
    component: ScrollingComponent
  },
  {
    path: 'rxjs-demo',
    component: RxjsDemoComponent
  }
];
