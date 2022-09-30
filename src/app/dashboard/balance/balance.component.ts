import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { IndicatorService } from 'src/app/services/indicator.service';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { faCheck, faCross, fas } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss']
})
export class BalanceComponent implements OnInit, OnDestroy {
  fas = fas;
  faCheck = faCheck;
  faCross = faCross;
  public balance = 0;
  public balanceString = '0';
  public balances: any = {};
  errorMessage: string = null;
  options: AnimationOptions = {
    path: '/assets/animations/cloud_loading.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader = false;
  showNormal = true;
  showError = false;
  mySkyVault: string = null;
  balanceBreakup: string = null;
  opinions = 0;
  loadingMessage = '';
  isCounterfeit:boolean = false;
  watch:any;
  watchIndicator:any;
  processing:boolean;
  syncCount = 0;
  showCoinsModal:boolean = false;
  showCoinsDiv:boolean = false;
  coinDetail:any = null;
  perRaidaBalance:any = null;
  selectedSNS:any = null;
  optionModal:boolean = false;
  lowestUnsync:number = 0;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private changeDetectorRef: ChangeDetectorRef, private indc: IndicatorService) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.processing = false;
    this.showLoading(true);
  }

  ngOnInit(): void {
    // this.checkBalance();
    this.showLoading(true);
    localStorage.setItem('job', '0');
    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['/welcome']);
    }
    this.watch = this.auth.watch().subscribe((value) => {
      if (!value) {
        this.router.navigate(['/welcome']);
      }
    });

    let checked=0;
    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      // console.log("IndicatorService (balance): value", value);
      if(Object.keys(value).length == 0) {
        this.showLoading(true);
        this.loadingMessage = 'Contacting RAIDA...';
      }
      else{
        if(checked == 0) {
          checked++;
          setTimeout(() => {
            this.checkBalance();
          }, 2000);
        }
        else if(!this.processing){
          this.showLoading(false);
        }
      }
    });

    if (localStorage.getItem('skyvault')) {
      this.mySkyVault = localStorage.getItem('skyvault');
    }
  }

  ngOnDestroy(): void {
    if(this.watch) {
      this.watch.unsubscribe();
    }
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  async checkBalance() {
    this.showLoading(true);
    this.processing = true;
    localStorage.setItem('job', '1');
    this.loadingMessage = 'Fetching balance...';
    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    } else {
      const token = this.auth.getToken();
      let data = {
        sn: token.sn,
        an: token.an
      }

      let response = await this.skyvault.showBalance(data);
      localStorage.setItem('job', '0');

      if(response) {
        this.balance = 0;
        this.opinions = 0;
        let highestOpinion = 0;
        let highestOpinionBalance = 0;
        this.lowestUnsync = response.balance;
        this.balanceBreakup = '<div style="text-align: left; display: table;">Your SkyVault is out of sync. Balance returned by RAIDA servers are as follows: <ul style="text-align: left!important;">';

        if (response.balances) {
          this.balances = response.balances;
          for (const key in response.balances) {
            console.log("RED: key-", key);
            // check if the property/key is defined in the object itself, not in parent
            if (response.balances.hasOwnProperty(key)) {
              // console.log("Skyvault: key:", key, response.balances[key]);
              this.balanceBreakup += '<li style="text-align: left!important">' + response.balances[key] + ' RAIDA(s) - ' + parseInt(key).toLocaleString() + ' cc </li>';
              if (response.balances[key] > highestOpinion)
              {
                highestOpinion = response.balances[key];
                highestOpinionBalance = parseInt(key);
                this.balance = highestOpinionBalance;
                this.balanceString = this.balance.toLocaleString();
              }

              if (response.balances[key] < this.lowestUnsync) {
                this.lowestUnsync = response.balances[key];
              }
            }
            this.opinions++;
          }
          this.showLoading(false);

          if(this.opinions > 1 && this.syncCount == 0) {
            this.syncCount++;
            await this.syncAccount();
          }
        }

        if(response.balancesPerRaida){
          this.perRaidaBalance = response.balancesPerRaida;
        }
        if(this.lowestUnsync > 5){
          this.balanceBreakup += '</ul> It is advised that you sync your SkyVault by clicking the sync button</div>';
        }
        this.balanceBreakup += '</ul></div>';

        if(response.status == 'error') {
          if(response.errorText == "The coin is counterfeit"){
            this.isCounterfeit = true;
          }
          else{
            this.showErrorMessage(response.errorText);
            return;
          }
        }
      }
      this.showLoading(false);
    }

  }

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
  }

  async syncAccount() {
    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    } else {
      const token = this.auth.getToken();
      const params = {
        sn: token.sn,
        an: token.an
      };
      await this.skyvault.fixCoins(params);
      return true;
    }
  }

  sleep(ms): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showLoading(state): void {
    this.loadingMessage = '';
    if (state) {
      this.showNormal = false;
      this.showLoader = true;
      this.showError = false;
    } else {
      this.showNormal = true;
      this.showLoader = false;
      this.showError = false;
    }

  }

  showErrorMessage(message): void {
    this.errorMessage = message;
    this.showNormal = false;
    this.showError = true;
    this.showLoader = false;
  }

  hideErrorMessage(): void {
    this.errorMessage = '';
    this.showNormal = true;
    this.showError = false;
    this.showLoader = false;
  }
}
