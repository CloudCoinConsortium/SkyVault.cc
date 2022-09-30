import { DebitCardDetailsComponent } from './debit-card-details.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DebitCardDetailsRoutingModule } from './debit-card-details-routing.module';
import { LottieModule } from 'ngx-lottie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxMaskModule } from 'ngx-mask';

@NgModule({
  declarations: [DebitCardDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    DebitCardDetailsRoutingModule,
    LottieModule,
    FontAwesomeModule,
    NgxMaskModule.forRoot()
  ]
})
export class DebitCardDetailsModule { }
