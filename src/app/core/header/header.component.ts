import { Component, OnInit } from '@angular/core';
import { EventService } from 'src/app/services/event.service';
import { IndicatorService } from 'src/app/services/indicator.service';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService} from 'src/app/services/skyvault.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  public isLoggedIn = false;
  public username:string = '';
  public toggleMenu: boolean;
  serverList: any = [];
  serverNumber: any = 0;
  result: any;
  serverResponseList: any = [];
  showRaida:boolean;
  data: string;
  watchIndicator:any;

  constructor(private auth: LoginService, private eventService: EventService, private skyvault: SkyvaultService, private indc: IndicatorService) {
    this.toggleMenu = false;
    this.showRaida = false;
    this.auth.watch().subscribe((value) => {
      this.isLoggedIn = value;
      this.username = localStorage.getItem('skyvault') ? localStorage.getItem('skyvault') : '';
    });

    if (this.auth.getLoggedIn())
    {
      this.isLoggedIn = true;
      this.username = localStorage.getItem('skyvault') ? localStorage.getItem('skyvault') : '';
    }
    else{
      this.isLoggedIn = false;
      this.username = '';
    }

    setInterval(() => {
      this.getEchoResponse();
    }, 120000);
  }

  ngOnInit(): void {
    localStorage.setItem('job', '0');
    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      if(Object.keys(value).length > 0) {
        this.createServerIndicator(value);
      }else{
        this.showRaida = false;
        this.getEchoResponse();
      }
    });
  }

  ngOnDestroy(): void {
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  menuToggle() {
    this.toggleMenu = !this.toggleMenu;
    this.eventService.emitMenuToggleEvent();
  }

  async getEchoResponse() {
    let check = localStorage.getItem('job') ? localStorage.getItem('job') : '0';
    if(check == '0') {
      let response = await this.skyvault.getServerEchoResponse();
      console.log("SKYVAULT: Echo:", response);

      if (response && response.status === 'done') {
        this.indc.changeRIndicator(response);
        this.createServerIndicator(response);
      }
    }
  }

  createServerIndicator(rEcho) {
    let serverList = [];
    this.serverNumber = rEcho.totalServers;

      let serverStatus = rEcho.serverStatuses;

      for (let index = 0; index < this.serverNumber; index++) {
        if(serverStatus[index]) {
          serverList.push({
            server: index,
            status: serverStatus[index],
            message: 'ready'
          });
        }else{
          serverList.push({
            server: index,
            status: 0,
            message: 'down'
          });
        }
      }
      this.serverResponseList = serverList;
      this.showRaida = true;
  }


}
