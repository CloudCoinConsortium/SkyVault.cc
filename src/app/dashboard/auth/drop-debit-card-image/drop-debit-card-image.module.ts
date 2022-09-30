import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropDebitCardImageRoutingModule } from './drop-debit-card-image-routing.module';
import { DropDebitCardImageComponent } from './drop-debit-card-image.component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { LottieModule } from 'ngx-lottie';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [
    DropDebitCardImageComponent
  ],
  imports: [
    CommonModule,
    DropDebitCardImageRoutingModule,
    FormsModule,
    NgxDropzoneModule,
    LottieModule,
    FontAwesomeModule
  ]
})
export class DropDebitCardImageModule { }
