import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from 'src/app/services/event.service';
import { IndicatorService } from 'src/app/services/indicator.service';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent implements OnInit {
  public isLoggedIn = false;
  files: File[] = [];
  serverList: any = [];
  serverNumber: any = 0;
  result: any;
  serverResponseList: any = [];
  showRaida:boolean = false;
  public disclaimberTypeModal: boolean;
  public supportTypeModal: boolean;
  watchIndicator:any;

  constructor(private eventService: EventService, private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private indc: IndicatorService) {
    if (this.auth.getLoggedIn())
    {
      this.isLoggedIn = true;
    }
    this.auth.watch().subscribe((value) => {
      this.isLoggedIn = value;
    });

    this.getEchoResponse();

    this.disclaimberTypeModal = false;
    this.supportTypeModal = false;
  }

  ngOnInit(): void {
    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      // console.log("IndicatorService (balance): value", value);
      if(Object.keys(value).length > 0) {
        this.createServerIndicator(value);
      }else{
        this.showRaida = false;
        this.getEchoResponse();
      }
    });
  }

  disclaimberModalToggler() {
    this.disclaimberTypeModal = !this.disclaimberTypeModal;
  }
  supportModalToggler() {
    this.supportTypeModal = !this.supportTypeModal;
  }

  menuToggle() {
    this.eventService.emitMenuToggleEvent();
  }

  async getEchoResponse() {
    let check = localStorage.getItem('job') ? localStorage.getItem('job') : '0';
    if(check == '0') {
      let response = await this.skyvault.getServerEchoResponse();
      // console.log("SKYVAULT: Echo:", response);

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
            message: 'unreachable'
          });
        }
      }
      this.serverResponseList = serverList;
      this.showRaida = true;
  }

  logout() {
    Swal.fire({
      title: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.value) {
        {
          localStorage.setItem('cc', 'null');
          localStorage.removeItem('cc');
          localStorage.setItem('skyvault', 'null');
          localStorage.removeItem('skyvault');
          localStorage.removeItem('statements');
          localStorage.setItem('b4uPay', 'null');
          localStorage.removeItem('b4uPay');
          localStorage.setItem('merchantPay', 'null');
          localStorage.removeItem('merchantPay');
          localStorage.setItem('bitmartPay', 'null');
          localStorage.removeItem('bitmartPay');
          localStorage.setItem('payRoute', 'null');
          localStorage.removeItem('payRoute');
          localStorage.setItem('job', 'null');
          localStorage.removeItem('job');
          this.auth.checkLoginStatus();
          this.router.navigate(['/welcome']);
        }
      }
    });
  }

}
