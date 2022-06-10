import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LottieModule } from 'ngx-lottie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'ng2-tooltip-directive';
import { HttpClientModule } from '@angular/common/http';
import { BitmartRoutingModule } from './bitmart-routing.module';
import { BitmartComponent } from './bitmart.component';



@NgModule({
  declarations: [BitmartComponent],
  imports: [
    CommonModule,
    BitmartRoutingModule,
    FormsModule,
    LottieModule,
    FontAwesomeModule,
    TooltipModule,
    HttpClientModule
  ]
})
export class BitmartModule { }
