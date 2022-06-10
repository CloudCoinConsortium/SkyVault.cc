import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DebitCardDetailsComponent } from './debit-card-details.component';

const routes: Routes = [
  {
    path: '',
    component: DebitCardDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DebitCardDetailsRoutingModule { }
