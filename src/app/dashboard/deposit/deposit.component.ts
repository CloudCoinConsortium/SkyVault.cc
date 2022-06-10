import { Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { faInfoCircle, faCoins, faCheck, faExclamationCircle, faExclamationTriangle, faBug } from '@fortawesome/free-solid-svg-icons';
import { IndicatorService } from 'src/app/services/indicator.service';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit, OnDestroy {
  faInfoCircle = faInfoCircle;
  faCoins = faCoins;
  faCheck = faCheck;
  faExclamationCircle = faExclamationCircle;
  faExclamationTriangle = faExclamationTriangle;
  faBug = faBug;
  files: File[] = [];
  private token: any = null;
  errorMessage: string = null;
  options: AnimationOptions = {
    path: '/assets/animations/cloud_upload.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader = false;
  showNormal = true;
  showError = false;
  complete = false;
  completeMessage: string = null;
  progressMessage:string = null;
  queueLength = 0;
  queueIndexStart = 0;
  queueIndexEnd = 0;
  requestCounter = 0;
  responsecounter = 0;
  completeCallBack = false;
  private responseArray = [];
  private ccCheck = [];
  doRecord:boolean = true;
  showReceiptModal:boolean = false;
  receiptDetails:any = [];
  showResult:boolean = true;
  counterfeit:any = 0;
  error:any = 0;
  authentic:any = 0;
  total:any = 0;
  fracked:any = 0;
  watch:any;
  watchIndicator:any;
  depositSuccess:boolean = false;
  processing:boolean;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private changeDetectorRef: ChangeDetectorRef, private indc: IndicatorService) {
    this.doRecord = JSON.parse(localStorage.getItem('statements'));
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.progressMessage = 'Depositing..';
    this.processing = false;
  }

  ngOnInit(): void {
    localStorage.setItem('job', '0');
    if (!this.auth.getLoggedIn())
    {
      this.auth.checkLoginStatus();
      this.router.navigate(['/welcome']);
    }
    this.watch = this.auth.watch().subscribe((value) => {
      if (!value) {
        this.router.navigate(['/welcome']);
      }
    });
    this.watchIndicator = this.indc.currentRStatus.subscribe((value) => {
      if(Object.keys(value).length == 0) {
        this.options = {
          path: '/assets/animations/cloud_loading.json'
        };
        this.showLoading(true);
        this.progressMessage = 'Contacting RAIDA...';
      }
      else{
        this.options = {
          path: '/assets/animations/cloud_upload.json'
        };
        if(!this.processing)
          this.showLoading(false);
      }
    });
  }

  ngOnDestroy(): void {
    if(this.watch) {
      this.watch.unsubscribe();
    }
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  onSelect(event: any) {
		this.files.push(...event.addedFiles);
    if (!this.auth.getLoggedIn())
    {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    }
    else {
      this.token = this.auth.getToken();
      this.checkFileDenominations();
    }
	}

	onRemove(event: any) {
		this.files.splice(this.files.indexOf(event), 1);
	}

  async checkFileDenominations() {
    const me = this;
    let total = 0;
    let depositStack = [];
    let checked = 0;

    this.showLoading(true);
    this.processing = true;
    localStorage.setItem('job', '1');
    for (const thisFile of Object.values( this.files))
    {

      let ext =  thisFile.name.split('.').pop();

      if(ext == 'png' || ext == 'PNG'){
        const reader = new FileReader();
        reader.readAsDataURL(thisFile);
        reader.onload = async function() {

          const params = {
            template: reader.result
          };

          // console.log("SKYVAULT: params", params);
          let extractResponse = await me.skyvault.extractPng(params);
          // console.log("SKYVAULT: extractStack", extractResponse);

          let coin = null;
          checked ++;
          try {
            let stack = extractResponse.cloudcoin;

            for (let i = 0; i < stack.length; i++) {
              const cc = stack[i];
              if (me.ccCheck.indexOf(cc.sn) !== -1)
              {
                total = 0;
                depositStack = [];
                checked = 0;
                me.ccCheck = [];
                me.files = [];
                me.showErrorMessage('Duplicate coin with serial number: ' + cc.sn + ' within selected files. Please ' +
                're-attach coins, and attach a coin only once.');
                localStorage.setItem('job', '0');
                return;
              }
              else
              {
                me.ccCheck.push(cc.sn);
              }
              depositStack.push(cc);
              total += me.skyvault.getDenomination(cc.sn);
            }
            if (checked >= me.files.length)
            {
              me.processCoins(total, depositStack);
            }
          } catch (e) {
            console.log(e);
            me.showErrorMessage('Failed to parse CloudCoin');
            me.files = [];
            localStorage.setItem('job', '0');
            return;
          }
        }

        reader.onerror = function(error) {
          console.log('Error: ', error);
          checked ++;
          me.showErrorMessage('Unable to parse CloudCoin File');
        };
      }
      else if(ext == 'cc' || ext == 'CC' || ext == 'bin' || ext == 'BIN'){

        const reader = new FileReader();
        reader.readAsArrayBuffer(thisFile);

        reader.onload = async function() {
          let base64 = reader.result;
          let extractResponse = await me.skyvault.extractCC(base64);
          // console.log("SKYVAULT: readCCFile", extractResponse);

          let coin = null;
          checked ++;
          try {
            let stack = extractResponse.cc;

            for (let i = 0; i < stack.length; i++) {
              const cc = stack[i];
              if (me.ccCheck.indexOf(cc.sn) !== -1)
              {
                total = 0;
                depositStack = [];
                checked = 0;
                me.ccCheck = [];
                me.files = [];
                me.showErrorMessage('Duplicate coin with serial number: ' + cc.sn + ' within selected files. Please ' +
                're-attach coins, and attach a coin only once.');
                localStorage.setItem('job', '0');
                return;
              }
              else
              {
                me.ccCheck.push(cc.sn);
              }
              depositStack.push(cc);
              total += me.skyvault.getDenomination(cc.sn);
            }
            if (checked >= me.files.length)
            {
              me.processCoins(total, depositStack);
            }
          } catch (e) {
            console.log(e);
            me.showErrorMessage('Failed to parse CloudCoin');
            me.files = [];
            localStorage.setItem('job', '0');
            return;
          }
        }

        reader.onerror = function(error) {
          console.log('Error: ', error);
          checked ++;
          me.showErrorMessage('Unable to parse CloudCoin File');
        };

      }
      else if(ext == 'stack'){
        me.showErrorMessage('Oops! This is an old coin. Please convert it to our new version from your Cloudcoin Manager.');
        total = 0;
        depositStack = [];
        checked = 0;
        me.ccCheck = [];
        me.files = [];
        localStorage.setItem('job', '0');
        return;
      }
      else{
        me.showErrorMessage('File not supported!!');
        total = 0;
        depositStack = [];
        checked = 0;
        me.ccCheck = [];
        me.files = [];
        localStorage.setItem('job', '0');
        return;
      }
    }
  }

  async processCoins(total, depositStack): Promise<void> {
    this.completeCallBack = false; // to ensure final callback is called once.
    if (total === 0 || depositStack.length === 0) {
      this.showErrorMessage('Denomination not found');
      this.files = [];
      localStorage.setItem('job', '0');
      return;
    }

    let depositStackParam = [];
    depositStackParam = depositStack;

    this.requestCounter = 0;
    this.responsecounter = 0;
    this.responseArray = [];
    this.ccCheck = [];
    this.showLoading(true);

    const params = {
      to: this.token.sn,
      memo: 'Deposit by #' + this.token.sn,
      coins: depositStackParam

    };

    this.responseArray[0] = {
      authentic: 0,
      counterfeit: 0,
      error: 0,
      fracked: 0,
      total: depositStackParam.length,
      coins: depositStackParam,
      errorMessage: ''
    };

    let response = await this.skyvault.detect(params.coins);

    if(response){
      this.responsecounter++;
      // console.log("SKYVAULT: apiDetect: ",response);

      if (response.status !== 'done') {
        this.responseArray[0].errorMessage = 'Failed to Detect Authenticity of  Coins';
        this.responseArray[0].counterfeit = params.coins.length;
        localStorage.setItem('job', '0');
        return;
      }
      this.progressMessage = 'Depositing coins. Detecting Authenticity - Do not close your browser or browse away';

      if(response.frackedNotes > 0 || response.errorNotes > 0) {
        this.progressMessage = 'Depositing coins. Fixing Fracked Coins - Do not close your browser or browse away';
        let frackedResponse = await this.skyvault.fixFracked(response.result);
        // console.log("SKYVAULT: fixFracked response: ",frackedResponse);
        // console.log('Finished fixing fracked files now going to deposit');
        if (frackedResponse.fixedNotes > 0) {
          this.progressMessage = 'Depositing coins. Fixed ' + frackedResponse.fixedNotes + ' Fracked Coins - Do not close your browser or browse away ';
        }
        // console.log('Fixing finished. Total coins fixed: ' + frackedResponse.fixedNotes);
      }

      this.performDeposit(params);
    }

  }

  async performDeposit(params) {
    let depositResponse = await this.skyvault.deposit(params);
    console.log('SKYVAULT: deposit (apiSend) response', depositResponse);
    if(depositResponse) {
      this.progressMessage = 'Depositing coins. Do not close your browser or browse away';
      const validCoins = depositResponse.authenticNotes + depositResponse.frackedNotes;
      this.responseArray[0].authentic = depositResponse.authenticNotes;
      this.responseArray[0].fracked = depositResponse.frackedNotes;
      this.responseArray[0].counterfeit = depositResponse.counterfeitNotes;
      this.responseArray[0].error = depositResponse.errorNotes;
      this.responsecounter++;
      const mapped = Object.keys(depositResponse.result).map(key => ({type: key, value: depositResponse.result[key]}));
      this.receiptDetails = mapped;

      if(!this.doRecord) {
        const token = this.auth.getToken();
        const coin = {
          sn: token.sn,
          an: token.an
        };

        const param = {
          "coin" : coin
        }
        await this.skyvault.deleteRecords(param);
      }

      if(this.responsecounter >= this.requestCounter && !this.completeCallBack)
      {
        this.completeCallBack = true;
        this.completedProcessing();
      }
    }
  }

  completedProcessing(): void{
    let hasError = false;
    let authentic = 0;
    let total = 0;
    let error = 0;
    let counterfeit = 0;
    let fracked = 0;
    for (const response of this.responseArray) {
      if(response.error > 0 || response.counterfeit > 0) {
        hasError = true;
      }
      this.authentic = authentic + response.authentic;
      this.error = error + response.error;
      this.fracked = fracked + response.fracked;
      this.total = total + response.total;
      this.counterfeit = counterfeit + response.counterfeit;
    }

    if (this.authentic + this.fracked === 0 ){
      this.depositSuccess = false;
    }else{
      this.depositSuccess = true;
      this.showResult = true;
    }

    this.showCompleteMessage('');
    this.completeCallBack = false;
    localStorage.setItem('job', '0');
  }

  showReceipt() {
    this.showReceiptModal = !this.showReceiptModal;
  }

  sleep(ms): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
  }

  showCompleteMessage(message): void {
    this.completeMessage = message;
    this.complete = true;
    this.showError = false;
    this.showNormal = false;
    this.showLoader = false;
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

}
