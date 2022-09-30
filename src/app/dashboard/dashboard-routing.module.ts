import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        loadChildren: ()=> import('./welcome/welcome.module').then(m => m.WelcomeModule)
      },
      {
        path: 'welcome',
        redirectTo: ''
      },
      {
        path: 'auth',
        loadChildren: ()=> import('./auth/auth.module').then(m => m.AuthModule)
      },
      {
        path: 'balance',
        loadChildren: ()=> import('./balance/balance.module').then(m => m.BalanceModule)
      },
      {
        path: 'myqr',
        loadChildren: ()=> import('./myqr/myqr.module').then(m => m.MyqrModule)
      },

      {
        path: 'withdraw',
        loadChildren: ()=> import('./withdraw/withdraw.module').then(m => m.WithdrawModule)
      },
      {
        path: 'deposit',
        loadChildren: ()=> import('./deposit/deposit.module').then(m => m.DepositModule)
      },
      {
        path: 'transfer',
        loadChildren: ()=> import('./transfer/transfer.module').then(m => m.TransferModule)
      },
      {
        path: 'statements',
        loadChildren: ()=> import('./statement/statement.module').then(m => m.StatementModule)
      },
      {
        path: 'payment',
        loadChildren: ()=> import('./payment/payment.module').then(m => m.PaymentModule)
      },
      {
        path: 'b4u',
        loadChildren: () => import('./b4u/b4u.module').then(m => m.B4uModule)
      },
      {
        path: 'bitmart',
        loadChildren: () => import('./bitmart/bitmart.module').then(m => m.BitmartModule)
      },
      {
        path: 'download-passkey',
        loadChildren: () => import('./passkey/passkey.module').then(m => m.PasskeyModule)
      },

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
