import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PasskeyComponent } from './passkey.component';

const routes: Routes = [
  {
    path: '',
    component: PasskeyComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PasskeyRoutingModule { }
