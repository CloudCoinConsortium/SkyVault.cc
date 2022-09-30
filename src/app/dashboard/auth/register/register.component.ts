import { Router } from '@angular/router';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import * as CryptoJS from 'crypto-js';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { LoginService } from 'src/app/services/login.service';
import { IndicatorService } from 'src/app/services/indicator.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy, AfterViewInit {

  faInfoCircle = faInfoCircle;
  selectedFile: File;
  selectedData: any = null;
  wallet: any;
  walletName: any;
  walletEmail: any;
  walletPin: string;
  confirmWalletPin: string;
  agreed = false;
  registerTapped = false;
  registerParams: any = null;
  complete = false;
  cardImage: string = null;
  cardImageBlank: string = null;
  cardImageTest: string = null;

  errorMessage: string = '';
  progressMessage: string = '';
  completeMessage: string = '';
  showLoader:boolean;
  showNormal:boolean;
  showError:boolean;
  buttonText = 'Select CloudCoin';

  options: AnimationOptions = {
    path: '/assets/animations/cloud_login.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };

  picturePassword:any = [];
  public SetPictureModal: boolean;

  generatedANS:any = [];
  cardData:any;
  showLogin:boolean = false;
  loadingMessage:string = null;
  watchIndicator:any;

  constructor(private auth: LoginService, private router: Router, private changeDetectorRef: ChangeDetectorRef, private skyvault: SkyvaultService, private indc: IndicatorService) {
    this.SetPictureModal = false;
    this.showLoader = false;
    this.showNormal = true;
    this.showError = false;
  }

  ngOnInit(): void {
    localStorage.setItem('job', '0');
    if (this.auth.getLoggedIn()) {
      this.router.navigate(['/balance']);
    }
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
          path: '/assets/animations/cloud_login.json'
        };
        this.progressMessage = '';
        this.showLoading(false);
      }
    });
  }

  ngOnDestroy(): void {
    if(this.watchIndicator) {
      this.watchIndicator.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
  }

  animationCreated(animationItem: AnimationItem): void {
    // console.log(animationItem);
  }

  showLoading(state): void {
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

  showCompleteMessage(message): void {
    this.errorMessage = '';
    this.showNormal = false;
    this.showError = false;
    this.showLoader = false;
    this.completeMessage = message;
    this.complete = true;
  }

  validateEmail(email): boolean {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  async register() {
    this.showLoading(true);
    if (this.registerTapped) {
      this.showLoading(false);
      return;
    }
    else {
      this.registerTapped = true;
    }

    if (!this.wallet || this.wallet === '') {
      this.showErrorMessage('Please enter a valid wallet name');
      this.registerTapped = false;
      return;
    }
    else{
      if (!this.wallet.match(/[a-zA-Z0-9]{2,63}/)) {
        this.showErrorMessage('Invalid wallet address. Only alphanumeric characters are allowed. Min length 2, Max length 63');
        this.registerTapped = false;
        return;
      }
      if(!this.wallet.charAt(0).match(/[a-zA-Z0-9]/)){
        this.showErrorMessage('Invalid wallet address. The first character must be Number or Letter');
        this.wallet = '';
        this.registerTapped = false;
        return;
      }
      if(this.wallet.charAt(this.wallet.length-1)  == '-' || this.wallet.charAt(0)  == '-'){
        this.showErrorMessage('Invalid wallet address. The last character cannot be a minus(-) sign');
        this.wallet = '';
        this.registerTapped = false;
        return;
      }

      this.walletName = this.wallet + '.skyvault.cc';

      if(this.walletName) {
        let hostname = await this.skyvault.hostnameCheck(this.walletName);
        if(hostname.status !== 'error') {
          this.showErrorMessage('Skyvault already exists!!');
          this.registerTapped = false;
          return;
        }
      }
    }

    localStorage.setItem('job', '1');

    let new_sn = this._getRandom(26000, 100000);
    let cd = this.getCardData(new_sn);
    let new_an = cd.pans;
    this.generatedANS = new_an;

    let coinData = await this.skyvault.getFreeCoin(new_sn, new_an);

    if('status' in coinData && coinData.status === 'done') {
      this.selectedData = { cloudcoin: [coinData] };
      this.selectedData = JSON.stringify(this.selectedData);
      this.preRegister();
    }else {
      this.showErrorMessage('Registration failed!! Please try again.');
      console.log('Registration failed because ID coin could not be fetched');
      this.registerTapped = false;
      localStorage.setItem('job', '0');
      return;
    }
  }

  async preRegister() {
    if (!this.selectedData || JSON.parse(this.selectedData).cloudcoin == null) {
      this.showErrorMessage('Free coin could not be fetched, please try again');
      this.registerTapped = false;
      localStorage.setItem('job', '0');
      return;
    }

    if (this.selectedData != null) {
      let snString = '';
      let anArray = [];
      let nnString = 1;

      JSON.parse(this.selectedData).cloudcoin.forEach((element, index) => {
        if (index === 0) {
          snString = element.cc.sn;
          anArray = element.cc.an;
        }
      });

      if (snString !== '' && anArray.length>0) {
        // generate a new card number

        // gennerating random number and random pin
        let ccCardData = this.getCardData(snString);

        if ((ccCardData as any).status === 'done') {
          const cardGenerated = this.makeCard((ccCardData as any).rand);
          const cardNumber = cardGenerated.number;
          const cvv = (ccCardData as any).cvv;
          const pans = (ccCardData as any).pans;

          this.showLoading(true);
          this.progressMessage = 'Registering Skyvault..';
          this.prepareCard(cardNumber, cardGenerated, cvv, pans, snString, nnString);
        }
        else {
          this.showErrorMessage('Error generating card from info');
          localStorage.setItem('job', '0');
          return;
        }
      } else {
        this.showErrorMessage('Registration failed!! Please try again.');
        this.registerTapped = false;
        localStorage.setItem('job', '0');
        return;
      }
    } else {
      this.showErrorMessage('Something went wrong!! Please try again.');
      this.registerTapped = false;
      localStorage.setItem('job', '0');
    }
  }

  makeCard(rand): any {
    const precardNumber = '401' + rand;
    const reverse = precardNumber.split('').reverse().join('');

    let total = 0;
    for (let i = 0; i < reverse.length; i++) {
      let num = parseInt(reverse.charAt(i));
      if ((i + 3) % 2) {
        num *= 2;
        if (num > 9) {
          num -= 9;
        }
      }
      total += num;
    }

    let remainder = 10 - (total % 10);
    if (remainder === 10) {
      remainder = 0;
    }

    const cardNumber = precardNumber + remainder;
    const fiveYearsFromNow = new Date();
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);

    const month = fiveYearsFromNow.getMonth() + 1;
    const year = fiveYearsFromNow.getFullYear().toString().substr(-2);
    return { number: cardNumber, expiry: month + '-' + year };
  }

  prepareCard(cardNumber, cardGenerated, cvv, pans, snString, nnString): void {
    this.progressMessage = 'Generating Pass Key..';

    const ip = '1.' + ((parseInt(snString) >> 16) & 0xff) + '.' + ((parseInt(snString) >> 8) & 0xff) + '.'
      + ((parseInt(snString)) & 0xff);
    this.cardData = {
      name: this.walletName,
      number: cardNumber,
      expiry: cardGenerated.expiry,
      pin: cvv,
      ip
    };
    this.registerParams = {
      name: this.walletName,
      coin: {
        sn: snString,
        an: pans
      }
    };
    this.addTextToImage('assets/images/passkey.png', this.cardData, this.registerParams, this.doRegister);
  }

  async doRegister(me, registerParams) {
    me.progressMessage = 'Creating SkyVault Account..';
    try {
      let registerResponse = await me.skyvault.register(registerParams);
      if (registerResponse.status === 'done') {
        me.generateCard(registerParams);
      }
      else {
        this.showErrorMessage(registerResponse.errorText);
        this.registerTapped = false;
        localStorage.setItem('job', '0');
      }
    }
    catch(e) {
      console.log(e);
      localStorage.setItem('job', '0');
    }

  }

  async generateCard(registerParams) {
    // if correct coin
    this.progressMessage = 'SkyVault account created';
    const coinParam = {
      coins: [{
        sn: parseInt(registerParams.coin.sn),
        nn: 1,
        an: registerParams.coin.an
      }],
      template: this.cardImageBlank,
      isid: true
    };

    try {
      let coinResponse = await this.skyvault.embedInImage(coinParam);

      if (coinResponse.status && coinResponse.status === 'error') {
        this.showErrorMessage(coinResponse.errorText);
        this.registerTapped = false;
        localStorage.setItem('job', '0');
      }
      else {
        this.showCompleteMessage('Registration Successful!');
        this.cardImage = 'data:image/png;base64,' + coinResponse;
      }
    } catch (e) {
      console.log(e);
    }
  }

  addTextToImage(imagePath, cardData, registerParams, callback) {
    const card_canvas = document.createElement('canvas');
    card_canvas.setAttribute('width', '700');
    card_canvas.setAttribute('height', '906');
    const context = card_canvas.getContext('2d');
    const me = this;
    // Draw Image function
    const img = new Image();
    img.src = imagePath;
    img.onload = function() {
      context.drawImage(img, 0, 0);
      context.lineWidth = 0;
      context.fillStyle = '#FFFFFF';
      context.font = '30px sans-serif';
      context.fillText(cardData.name, 50, 400);
      context.font = '40px sans-serif';
      context.fillText(cardData.number.replace(/(.{4})/g, '$1 '), 50, 300);
      context.font = '18px sans-serif';
      context.fillText('Keep these numbers secret, do not give to merchants', 50, 325);
      context.font = '18px sans-serif';
      context.fillText('Share this name with others for receiving payments', 50, 425);

      context.font = '25px sans-serif';
      context.fillText(cardData.expiry, 450, 355);
      context.fillStyle = '#000000';
      context.fillText('CVV (keep secret): ' + cardData.pin, 50, 675);
      context.fillStyle = '#ffffff';
      context.fillText( 'IP ' + String(cardData.ip), 230, 738);


      me.cardImageBlank = card_canvas.toDataURL(); // 'data:image/png;base64,' + coinResponse;
      callback(me, registerParams);
    };
  }

  downloadImage(): void {
    const a = document.createElement('a'); // Create <a>
    a.href = this.cardImage; // Image Base64 Goes here
    a.download = this.walletName + '.png'; // File name Here
    a.click();
    this.showLogin = true;
  }

  generateAN() {
    let ans = [];
    let seed = this.skyvault.generateSeed();

    for (let i = 0; i < 25; i++) {
      ans[i] = CryptoJS.MD5(i.toString() + seed).toString(CryptoJS.enc.Hex);
    }
    return ans;
  }

  _getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
  }

  getCardData(sn) {
    let finalStr = "";
    let tStr = "" + CryptoJS.MD5(this.walletName);
    let tChars = tStr.split('');

    for (let c = 0; c < tChars.length; c++) {
      let cs = parseInt(tChars[c], 16);
      finalStr += cs;
    }

    // Generating rand and pin from the walletName
    let rand = finalStr.slice(0, 12);
    let pin = finalStr.slice(12, 16);

    let data = this.makeCard(rand);       //{ "number": "4011109610821355", "expiry": "2-27" }
    let num = data.number;                // 4011109610821355

    let part = num.substring(3, num.length - 1);     // 110961082135

    let pans = [];
    for (let i = 0; i < 25; i++) {
      let seed = "" + i + sn + part + pin;
      pans[i] = "" + CryptoJS.MD5(seed);
    }

    let grv = {
      "status": "done",
      "pans" : pans,
      "rand" : rand,
      "cvv" : pin
    };
    return grv;
  }

  async login() {
    const params = {
      username : this.cardData.name,
      cardnumber : this.cardData.number.toString(),
      cvv: this.cardData.pin.toString()
    };
    this.complete = false;
    this.progressMessage = 'Logging ' + this.walletName + ' to SkyVault';
    this.showLoading(true);
    localStorage.setItem('job', '1');

    let response = await this.skyvault.loginWithCard(params);
    if(response) {
      localStorage.setItem('job', '0');
      if (response.status === 'error')
      {
        if (response.errorText.indexOf('Failed to resolve DNS name') !== -1) {
          console.log('Failed to resolve DNS name');
          this.showErrorMessage('Authentication failure');
        }
        else
        {
          this.showErrorMessage(response.errorText);
        }
      }
      else {
        if (response.status === 'done')
        {
          const cloudcoin = response.cc;
          if (!cloudcoin.an && cloudcoin.ans) {
            cloudcoin.an = cloudcoin.ans;
          }

          localStorage.setItem('cc', JSON.stringify(cloudcoin));
          localStorage.setItem('skyvault', this.walletName);
          localStorage.setItem('statements', "true");
          this.auth.checkLoginStatus();
          setTimeout(() => {
            this.router.navigate(['/balance']);
          }, 2500);
        }
      }
    }
  }
}
