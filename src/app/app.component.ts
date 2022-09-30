import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { EventService } from './services/event.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'skyvault ATM';

  public toggleMenu: boolean;

  constructor(private eventService: EventService, private router: Router) {
    this.toggleMenu = false;
    router.events.subscribe((val) => {
      // see also
      if (val instanceof NavigationEnd) {
        this.toggleMenu = false;
      }
  });
  }

  ngOnInit() {
    this.eventService.getMenuToggleEvent().subscribe(()=>{
      console.log('menutoggler Fired');
      this.toggleMenu = !this.toggleMenu;
    })
  }

}
