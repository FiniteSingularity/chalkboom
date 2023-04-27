import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/chalk-boom/chalk-boom.component').then(
        (comp) => comp.ChalkBoomComponent
      ),
  },
];
