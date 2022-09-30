import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegisterRoutingModule } from './register-routing.module';
import { RegisterComponent } from './register.component';
import { FormsModule } from '@angular/forms';
import { LottieModule } from 'ngx-lottie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'ng2-tooltip-directive';


@NgModule({
  declarations: [
    RegisterComponent
  ],
  imports: [
    CommonModule,
    RegisterRoutingModule,
    FormsModule,
    LottieModule,
    FontAwesomeModule,
    TooltipModule
  ]
})
export class RegisterModule { }
