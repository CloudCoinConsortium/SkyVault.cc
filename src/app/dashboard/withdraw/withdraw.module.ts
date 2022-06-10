import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LottieModule } from 'ngx-lottie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { WithdrawComponent } from './withdraw.component';
import { WithdrawRoutingModule } from './withdraw-routing.module';


@NgModule({
  declarations: [WithdrawComponent],
  imports: [
    CommonModule,
    WithdrawRoutingModule,
    FormsModule,
    LottieModule,
    FontAwesomeModule
  ]
})
export class WithdrawModule { }
