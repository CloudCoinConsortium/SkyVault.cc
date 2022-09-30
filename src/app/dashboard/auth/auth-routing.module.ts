import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'drop-image',
        pathMatch: 'full'
      },
      // {
      //   path: 'login',
      //   loadChildren: () => import('./login/login.module').then(m => m.LoginModule)
      // },
      {
        path: 'register',
        loadChildren: () => import('./register/register.module').then(m => m.RegisterModule)
      },
      {
        path: 'debit-card-details',
        loadChildren: () => import('./debit-card-details/debit-card-details.module').then(m => m.DebitCardDetailsModule)
      },
      {
        path: 'drop-image',
        loadChildren: () => import('./drop-debit-card-image/drop-debit-card-image.module').then(m => m.DropDebitCardImageModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
