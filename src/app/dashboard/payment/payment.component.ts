import { HttpClient } from '@angular/common/http';
import { AnimationItem } from 'lottie-web';
import { ActivatedRoute, Router } from '@angular/router';
import { AnimationOptions } from 'ngx-lottie';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { LoginService } from 'src/app/services/login.service';
import { IndicatorService } from 'src/app/services/indicator.service';
import { round } from 'mathjs'

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {

  faInfoCircle = faInfoCircle;
  amount:number = 0;
  memo: string = null;
  to: string = null;
  from: string = null;
  errorMessage: string = null;
  progressMessage:string = null;
  completeMessage:string = null;
  loadingOptions: AnimationOptions = {
    path: '/assets/animations/cloud_loading.json'
  };
  options: AnimationOptions = {
    path: '/assets/animations/cloud_transfer.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader = false;
  balanceLoader = false;
  showNormal = true;
  showError = false;
  complete = false;
  public balance = 0;
  public balanceString = '0';
  balanceBreakup: string = null;
  opinions = 0;
  public balances: any = {};
  loadingMessage = '';
  skyvaultAddress: string = null;
  doRecord:boolean = true;
  payRoute:any = null;
  watch:any;
  watchIndicator:any;
  processing:boolean;
  syncCount = 0;
  lowestUnsync:number = 0;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private changeDetectorRef: ChangeDetectorRef, private activatedRoute:ActivatedRoute, private indc: IndicatorService, private http: HttpClient) {
    this.doRecord = JSON.parse(localStorage.getItem('statements'));
    this.processing = false;
    localStorage.setItem('merchantPay', 'null');
    localStorage.removeItem('merchantPay');

    this.activatedRoute.queryParams.subscribe(params => {
      this.amount = params['amount'] ? params['amount'] : 0;
      this.memo = params['memo'] ? params['memo'] : null;
      this.to = params['receiver_address'] ? params['receiver_address'] : null;
    });

    const merchantPay = {
      amount: this.amount,
      receiver_address: this.to,
      memo: this.memo
    }

    if (!this.auth.getLoggedIn()) {
      localStorage.setItem("merchantPay", JSON.stringify(merchantPay));
      this.router.navigate(['/auth/drop-image']);
    }
  }

  ngOnInit(): void {
    this.showLoading(true);
    localStorage.setItem('job', '0');
    this.watch = this.auth.watch().subscribe((value) => {
      if (!value) {
        this.router.navigate(['/welcome']);
      }
    });

    let checked=0;

    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      if(Object.keys(value).length == 0) {
        this.showLoading(true);
        this.progressMessage = 'Contacting RAIDA...';
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
      this.skyvaultAddress = localStorage.getItem('skyvault');
      this.from = this.skyvaultAddress;
    }
  }

  ngOnDestroy(): void {
    if(this.watch) {
      this.watch.unsubscribe();
    }
    if(this.watchIndicator) {
      this.watch.unsubscribe();
    }
  }

  onAmountChange() {
    if(this.amount){
      this.amount = round(this.amount);
    }
  }

  async checkBalance() {
    this.progressMessage = 'Checking current balance';
    this.showLoading(true);
    if (!this.auth.getLoggedIn()) {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    } else {
      const token = this.auth.getToken();

      const params = {
        sn: token.sn,
        an: token.an
      };

      let response = await this.skyvault.showBalance(params);
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

  async payment() {
    if(!this.to){
      this.showErrorMessage('Receiver\'s SkyVault Address is required');
      return;
    }

    if(!this.from){
      this.showErrorMessage('Return SkyVault Address is required');
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

    if(!this.memo){
      this.memo = 'Payment of $' + this.amount + ' towards Merchant Address: ' + this.to;
    }

    this.processing = true;
    localStorage.setItem('job', '1');
    if (!this.auth.getLoggedIn())
    {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    }
    else {
      this.progressMessage = 'Transferring Cloudcoins...';
      const token = this.auth.getToken();

      const coin = {
        sn: token.sn,
        an: token.an
      };

      let guid = this.skyvault.generateSeed();

      this.amount = round(this.amount);
      const params = {
        an: coin.an,
        sender_name: this.from,
        from: this.from,
        to: this.to,
        amount: this.amount,
        memo : this.memo,
        guid: guid
      };

      this.showLoading(true);
      let response = await this.skyvault.payment(params);
      localStorage.setItem('job', '0');

      if(response){
          localStorage.setItem('job', '0');
        if (response.status === 'error') {
          if ('errorText' in response) {
            if (response.errorText.indexOf('Failed to resolve') !== -1) {
              this.showErrorMessage('Invalid Recipient SkyVault Address: ' + this.to);
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

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
  }

  showLoading(state): void {
    if (state) {
      this.showNormal = false;
      this.showLoader = true;
      this.showError = false;
    }
    else {
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

  showCompleteMessage(message): void {
    this.completeMessage = message;
    this.complete = true;
    this.showError = false;
    this.showNormal = false;
    this.showLoader = false;
  }

}
