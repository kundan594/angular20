import { Routes } from '@angular/router';
import { ScrollingComponent } from './scrolling/scrolling.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'scrolling',
    pathMatch: 'full'
  },
  {
    path: 'scrolling',
    component: ScrollingComponent
  }
];
