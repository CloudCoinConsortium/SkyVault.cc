import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'ng2-tooltip-directive';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { LottieModule } from 'ngx-lottie';

import { StatementComponent } from './statement.component';
import { StatementRoutingModule } from './statement-routing.module';


@NgModule({
  declarations: [StatementComponent],
  imports: [
    CommonModule,
    StatementRoutingModule,
    FormsModule,
    LottieModule,
    FontAwesomeModule,
    TooltipModule
  ]
})
export class StatementModule { }
