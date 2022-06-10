import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyqrComponent } from './myqr.component';

const routes: Routes = [
  {
    path: '',
    component: MyqrComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyqrRoutingModule { }
