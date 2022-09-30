import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'ng2-tooltip-directive';



@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    TooltipModule
  ],
  exports: [
    HeaderComponent,
    SidebarComponent
  ]
})
export class CoreModule { }
