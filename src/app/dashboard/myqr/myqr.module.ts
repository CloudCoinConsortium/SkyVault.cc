import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyqrRoutingModule } from './myqr-routing.module';
import { MyqrComponent } from './myqr.component';
import { FormsModule } from '@angular/forms';
import { LottieModule } from 'ngx-lottie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'ng2-tooltip-directive';
import { NgxQRCodeModule } from 'ngx-qrcode2';


@NgModule({
  declarations: [
    MyqrComponent
  ],
  imports: [
    CommonModule,
    MyqrRoutingModule,
    FormsModule,
    LottieModule,
    FontAwesomeModule,
    TooltipModule,
    NgxQRCodeModule
  ]
})
export class MyqrModule { }
