import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { IndicatorService } from 'src/app/services/indicator.service';
import Swal from 'sweetalert2';
import { round } from 'mathjs'

@Component({
  selector: 'app-bitmart',
  templateUrl: './bitmart.component.html',
  styleUrls: ['./bitmart.component.scss']
})
export class BitmartComponent implements OnInit {

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
  amount:number;
  receiverAddress:any;
  guid:any;
  memo: string = null;
  doRecord:boolean = true;

  public balance = 0;
  public balanceString = '0';
  balanceBreakup: string = null;
  opinions = 0;
  public balances: any = {};

  watch:any;
  watchIndicator:any;
  processing:boolean;
  syncCount = 0;
  lowestUnsync:number = 0;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private activatedRoute:ActivatedRoute, private http: HttpClient, private indc: IndicatorService, private changeDetectorRef: ChangeDetectorRef) {
    this.processing = false;
    this.doRecord = JSON.parse(localStorage.getItem('statements'));
    localStorage.setItem('bitmartPay', 'null');
    localStorage.removeItem('bitmartPay');

    this.activatedRoute.queryParams.subscribe(params => {
      this.amount = params['amount'] ? params['amount'] : 0;
      this.memo = params['memo'] ? params['memo'] : null;
      this.receiverAddress = params['receiver_address'] ? params['receiver_address'] : null; //CloudCoin.BitMart.com
    });

    const bitmartPay = {
      amount: this.amount,
      receiver_address: this.receiverAddress,
      memo: this.memo
    }

    if (!this.auth.getLoggedIn()) {
      localStorage.setItem("bitmartPay", JSON.stringify(bitmartPay));
      this.router.navigate(['/auth/drop-image']);
    }

    if(!this.receiverAddress || !this.memo){
      Swal.fire('Error', "Receiver Address or Memo missing!!", 'error');
      this.router.navigate(['balance']);
    }
  }

  ngOnInit(): void {
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
      this.loadingMessage = 'Fetching balance';
      let response = await this.skyvault.showBalance(params);
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
            // check if the property/key is defined in the object itself, not in parent
            if (response.balances.hasOwnProperty(key)) {
              // console.log(key, response.balances[key]);
              this.balanceBreakup += '<li style="text-align: left!important">' + response.balances[key] +
                ' RAIDA(s) - ' + parseInt(key).toLocaleString() + ' cc </li>';
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
          if(this.lowestUnsync > 5){
            this.balanceBreakup += '</ul> It is advised that you sync your SkyVault by clicking the sync button</div>';
          }
          this.balanceBreakup += '</ul></div>';
          this.showLoading(false);
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


  onAmountChange(amt) {
    if(this.amount){
      this.amount = round(this.amount);
    }
  }

  async payment() {
    if(!this.mySkyVault){
      this.showErrorMessage('Invalid Sender! To continue please re-login.');
      return;
    }

    if (isNaN(this.amount) ||  this.amount < 1 )
    {
      this.showErrorMessage('Invalid amount');
      return;
    }

    if (this.amount > this.balance)
    {
      this.showErrorMessage('Not enough balance!! Current balance: ' + this.balanceString + ' CC');
      return;
    }
    if (this.amount > 16000)
    {
      this.showErrorMessage('Cannot send more than 16000 coins at a time');
      return;
    }

    this.processing = true;
    localStorage.setItem('job', '1');
    if (!this.auth.getLoggedIn())
    {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    }
    else {
      this.loadingMessage = 'Transferring Cloudcoins...';
      const token = this.auth.getToken();

      const coin = {
        sn: token.sn,
        an: token.an
      };

      this.amount = round(this.amount);
      const params = {
        an: coin.an,
        sender_name: this.mySkyVault,
        from: this.mySkyVault,
        to: this.receiverAddress,
        amount: this.amount,
        memo : this.memo
      };

      this.showLoading(true);
      let response = await this.skyvault.payment(params);
      localStorage.setItem('job', '0');

      if(response){
          localStorage.setItem('job', '0');
        if (response.status === 'error') {
          if ('errorText' in response) {
            if (response.errorText.indexOf('Failed to resolve') !== -1) {
              this.showErrorMessage('Invalid Recipient SkyVault Address: ' + this.receiverAddress);
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

        if(!this.doRecord && response.transaction_id) {
          const token = this.auth.getToken();
          const coin = {
            sn: token.sn,
            an: token.an
          };

          localStorage.setItem('job', '1');

          let param = {
            "coin" : coin,
            "guid" : response.transaction_id
          }
          await this.skyvault.deleteRecords(param);
          this.changeDetectorRef.detectChanges();
          localStorage.setItem('job', '0');
        }

        this.complete = true;
        this.showCompleteMessage("Payment Complete");
      }
    }
  }

  sleep(ms): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showCompleteMessage(message): void {
    this.completeMessage = message;
    this.complete = true;
    this.showError = false;
    this.showNormal = false;
    this.showLoader = false;
  }
}
