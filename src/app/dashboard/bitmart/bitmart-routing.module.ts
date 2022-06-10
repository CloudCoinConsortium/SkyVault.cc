import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BitmartComponent } from './bitmart.component';

const routes: Routes = [
  {
    path:'',
    component: BitmartComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BitmartRoutingModule { }
