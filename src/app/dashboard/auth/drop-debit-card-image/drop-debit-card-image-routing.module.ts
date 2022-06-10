import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DropDebitCardImageComponent } from './drop-debit-card-image.component';

const routes: Routes = [
  {
    path: '',
    component: DropDebitCardImageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DropDebitCardImageRoutingModule { }
