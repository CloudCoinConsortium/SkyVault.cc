import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { AnimationItem } from 'lottie-web';
import Swal from 'sweetalert2';
import { IndicatorService } from 'src/app/services/indicator.service';

@Component({
  selector: 'app-b4u',
  templateUrl: './b4u.component.html',
  styleUrls: ['./b4u.component.scss']
})
export class B4uComponent implements OnInit, OnDestroy {

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
  complete = false;
  completeMessage: string = null;
  loadingMessage: string = null;
  mySkyVault: string = null;
  cc:number = 0;
  usd:any;
  guid:any;
  merchantID:any;
  merchantName:string = null;
  terminalID:any;
  paymentTo:any;
  memo: string = null;

  balanceLoader = false;
  public balance = 0;
  public balanceString = '0';
  balanceBreakup: string = null;

  opinions = 0;
  public balances: any = {};
  watch:any;
  watchIndicator:any;
  processing:boolean;
  syncCount = 0;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private activatedRoute:ActivatedRoute, private http: HttpClient, private indc: IndicatorService) {

    this.processing = false;
    localStorage.setItem('b4uPay', 'null');
    localStorage.removeItem('b4uPay');

    this.activatedRoute.queryParams.subscribe(params => {
      this.cc = params['cc'] ? params['cc'] : 0;
      this.usd = params['usd'] ? params['usd'] : null;
      this.guid = params['b4u'] ? params['b4u'] : null;
      this.merchantID = params['m'] ? params['m'] : null;
      this.merchantName = params['n'] ? params['n'] : null;
      this.terminalID = params['t'] ? params['t'] : null;
      this.paymentTo = params['to'] ? params['to'] : null;
    });

    const b4uPay = {
      m: this.merchantID,
      t: this.terminalID,
      b4u: this.guid,
      cc: this.cc,
      to: this.paymentTo,
      usd: this.usd,
      mn: this.merchantName
    }

    if (!this.auth.getLoggedIn()) {
      localStorage.setItem("b4uPay", JSON.stringify(b4uPay));
      this.router.navigate(['/auth/drop-image']);
    }

    if(!this.paymentTo || !this.usd || !this.guid || !this.merchantID || !this.terminalID){
      this.router.navigate(['balance']);
    }
  }

  ngOnInit(): void {
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
        checked++;
        if(!this.processing && checked==1){
          setTimeout(() => {
            this.showLoading(false);
            this.checkBalance();
          }, 2000);
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

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
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


  async checkBalance() {
      this.showLoading(true);
      if (!this.auth.getLoggedIn()) {
        this.auth.checkLoginStatus();
        this.router.navigate(['welcome']);
      } else {
        localStorage.setItem('job', '1');
        const token = this.auth.getToken();

        const params = {
          sn: token.sn,
          an: token.an
        };

        let response = await this.skyvault.showBalance(params);
        // console.log("SKYVAULT: showBalance: ", response);
        localStorage.setItem('job', '0');

        if(response) {
          this.balance = 0;
          this.opinions = 0;
          let highestOpinion = 0;
          let highestOpinionBalance = 0;
          this.balanceBreakup = '<div style="text-align: left; display: table;">Your SkyVault is out of sync. Balance returned by RAIDA servers are as follows: <ul style="text-align: left!important;">';

          if (response.balances) {
            this.balances = response.balances;
            for (const key in response.balances) {
              // check if the property/key is defined in the object itself, not in parent
              if (response.balances.hasOwnProperty(key)) {
                this.balanceBreakup += '<li style="text-align: left!important">' + response.balances[key] +
                  ' RAIDA(s) - ' + parseInt(key).toLocaleString() + ' cc </li>';
                if (response.balances[key] > highestOpinion)
                {
                  highestOpinion = response.balances[key];
                  highestOpinionBalance = parseInt(key);
                  this.balance = highestOpinionBalance;
                  this.balanceString = this.balance.toLocaleString();
                }
              }
              this.opinions++;
            }
            this.balanceBreakup += '</ul> It is advised that you sync your SkyVault by clicking the sync icon</div>';
            if (this.opinions > 1 && this.syncCount == 0) {
              this.syncCount++;
              await this.syncAccount();
            }
          }
        }
        this.showLoading(false);
      }
  }

  async syncAccount() {
    this.showLoading(true);
    localStorage.setItem('job', '1');
    let completeCallBack = false;

    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    } else {
      const token = this.auth.getToken();
      this.loadingMessage = 'Synchronizing SkyVault';

      const params = {
        sn: token.sn,
        an: token.an
      };

      // console.log("SKYVAULT: apiFixTransfer params: ",params);
      let fixResponse = await this.skyvault.fixCoins(params);
      console.log("SKYVAULT: apiFixTransfer response: ",fixResponse);

      if(fixResponse.status == 'done') {
        if(!completeCallBack) {
          await this.checkBalance();
          completeCallBack = true;
        }
      }
      else {
        this.showErrorMessage(fixResponse.errorText);
        localStorage.setItem('job', '0');
        return;
      }
    }
    localStorage.setItem('job', '0');
  }

  async payment() {
    if (isNaN(this.cc) ||  this.cc < 1 )
    {
      this.showErrorMessage('Invalid amount');
      return;
    }

    if (this.cc > this.balance)
    {
      this.showErrorMessage('Not enough balance!! Current balance: ' + this.balanceString + ' CC');
      return;
    }

    this.memo = 'Payment of $' + this.usd + ' towards Merchant ID: ' + this.merchantID + ' and Terminal ID: ' + this.terminalID;

    this.processing = true;
    localStorage.setItem('job', '1');
    const token = this.auth.getToken();

    const coin = {
      sn: token.sn,
      an: token.an
    };

    const params = {an: coin.an, amount: this.cc, to: this.paymentTo, memo : this.memo, sender_name: this.mySkyVault, guid: this.guid };

    this.showLoading(true);
    let response = await this.skyvault.payment(params);
    console.log("Payment response:", response);
    localStorage.setItem('job', '0');

    if(response){
      if (response.status === 'error') {
        if ('errorText' in response) {
          if (response.errorText.indexOf('Failed to resolve') !== -1) {
            this.showErrorMessage('Invalid Recipient SkyVault Address: ' + this.paymentTo);
          }
          else
          {
            this.showErrorMessage(response.errorText);
          }
        }
        else {
          this.showErrorMessage('Your login session is not valid, please logout and try again');
        }
        return;
      }

      if (!('result' in response)) {
        this.showErrorMessage('Invalid response received');
        return;
      }

      this.complete = true;
      this.completeMessage = "Payment completed";
      setTimeout(() => {
        this.router.navigate(['/balance']);
      }, 2000);
    }
  }

  sleep(ms): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
