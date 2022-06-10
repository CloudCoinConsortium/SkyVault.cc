import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from 'src/app/services/event.service';
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

  constructor(private eventService: EventService, private auth: LoginService, private router: Router, private skyvault: SkyvaultService) {
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
    let response = await this.skyvault.getServerEchoResponse();

    if (response && response.status === 'done') {
      this.serverNumber = response.totalServers;
      let serverStatus = response.serverStatuses;

      for (let index = 0; index < this.serverNumber; index++) {
          if(serverStatus[index]) {
            this.serverResponseList.push({
              server: index,
              status: serverStatus[index],
              message: 'ready'
            });
          }else{
            this.serverResponseList.push({
              server: index,
              status: 0,
              message: 'down'
            });
          }
      }
      this.showRaida = true;
    }
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
