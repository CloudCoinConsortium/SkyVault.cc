import { Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';
import { LoginService } from 'src/app/services/login.service';
import { SkyvaultService } from 'src/app/services/skyvault.service';
import { DatePipe } from '@angular/common';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { IndicatorService } from 'src/app/services/indicator.service';
import { round } from 'mathjs'

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss'],
  providers: [DatePipe]
})
export class WithdrawComponent implements OnInit, OnDestroy {

  faInfoCircle = faInfoCircle;
  amount:number = 0;
  errorMessage: string = null;
  progressMessage:string = null;
  options: AnimationOptions = {
    path: '/assets/animations/cloud_download.json'
  };
  errorOptions: AnimationOptions = {
    path: '/assets/animations/error.json'
  };
  showLoader = false;
  showNormal = true;
  showError = false;
  localCoin = false;

  cardImageBlank: string = null;
  cardImage: string = null;
  loaded:boolean = false;
  // System for American Numbering
  th_val:any = [];
  dg_val:any = [];
  tn_val:any = [];
  tw_val:any = [];
  seed:any = '';
  doRecord:boolean = true;
  complete = false;
  completeMessage: string = null;
  watch:any;
  watchIndicator:any;
  processing:boolean;

  constructor(private auth: LoginService, private router: Router, private skyvault: SkyvaultService, private datePipe: DatePipe, private changeDetectorRef: ChangeDetectorRef, private indc: IndicatorService) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.th_val = ['', 'thousand', 'million', 'billion', 'trillion'];
    this.dg_val = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    this.tn_val = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    this.tw_val = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    this.getseed();

    this.doRecord = JSON.parse(localStorage.getItem('statements'));
    this.processing = false;
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
          path: '/assets/animations/cloud_download.json'
        };

        if(!this.processing){
          this.progressMessage = null;
          this.showLoading(false);
        }
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

  getseed(){
    this.seed = this.skyvault.generateSeed();
  }

  onAmountChange(amt) {
    if(this.amount){
      this.amount = round(this.amount);
    }
  }

  async withdraw() {
    this.processing = true;
    if (isNaN(this.amount) ||  this.amount < 1)
    {
      this.showErrorMessage('Please enter a valid amount');
      return;
    }
    if (!this.auth.getLoggedIn())
    {
      this.auth.checkLoginStatus();
      this.router.navigate(['welcome']);
    }
    else {
      const token = this.auth.getToken();
      const coin = {
        sn: token.sn,
        an: token.an,
        pan: token.an
      };

      this.amount = round(this.amount);
      let amt: number = +this.amount;
      const params = { ...coin, amount :amt, seed: this.seed };
      this.showLoading(true);
      localStorage.setItem('job', '1');

      let response = await this.skyvault.receive(params);
      console.log("SKYVAULT: apireceive response:", response);

      if(response) {
        if (response.status === 'error') {
          if ('errorText' in response) {
            this.showErrorMessage(response.errorText);
          }
          else {
            this.showErrorMessage('Your login session is not valid. Please logout and try again');
          }
          return;
        }

        if (!('result' in response)) {
          this.showErrorMessage('Invalid response received');
          return;
        }

        const coinArray = Object.keys(response.result).map(index => {
          let coin = response.result[index];
          return coin;
        });

        this.addTextoImage(response.totalNotes, coinArray);

        this.changeDetectorRef.detectChanges();
        if(!this.doRecord && response.transaction_id) {
          const token = this.auth.getToken();
          const coin = {
            sn: token.sn,
            an: token.an
          };

          let param = {
            "coin" : coin,
            "guid" : response.transaction_id
          }

          let del = await this.skyvault.deleteRecords(param);
        }

        this.changeDetectorRef.detectChanges();
        this.showLoading(false);
        localStorage.setItem('job', '0');
        this.showCompleteMessage('<fa-icon icon="check"></fa-icon>  Withdrawal Complete. ' + this.amount + ' coin(s) withdrawn');

      }
    }
  }

  toWords(s) {
    s = s.toString();
    s = s.replace(/[\, ]/g, '');
    if (s != parseFloat(s))
        return 'not a number ';
    let x_val = s.indexOf('.');
    if (x_val == -1)
        x_val = s.length;
    if (x_val > 15)
        return 'too big';
    let n_val = s.split('');
    let str_val = '';
    let sk_val = 0;
    for (let i = 0; i < x_val; i++) {
        if ((x_val - i) % 3 == 2) {
            if (n_val[i] == '1') {
                str_val += this.tn_val[Number(n_val[i + 1])] + ' ';
                i++;
                sk_val = 1;
            } else if (n_val[i] != 0) {
                str_val += this.tw_val[n_val[i] - 2] + ' ';
                sk_val = 1;
            }
        } else if (n_val[i] != 0) {
            str_val += this.dg_val[n_val[i]] + ' ';
            if ((x_val - i) % 3 == 0)
                str_val += 'hundred ';
            sk_val = 1;
        }
        if ((x_val - i) % 3 == 1) {
            if (sk_val)
                str_val += this.th_val[(x_val - i - 1) / 3] + ' ';
            sk_val = 0;
        }
    }
    if (x_val != s.length) {
        let y_val = s.length;
        str_val += 'point ';
        for (let i = x_val + 1; i < y_val; i++)
            str_val += this.dg_val[n_val[i]] + ' ';
    }
    return str_val.replace(/\s+/g, ' ');
  }

  formatNum(number) {
    let formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',

        // These options are needed to round to whole numbers if that's what you want.
        //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
        //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
    });
    return formatter.format(number).replace("$", "").replace(".00","");
  }

  addTextoImage(totalNotes, cloudcoins) {
    this.loaded = true;
    const me = this;

    const d = new Date();
    let latest_date = this.datePipe.transform(d, 'yyyy-MM-dd h:mm a');

    let words:any = "";
    let fontString = "";
    if (totalNotes < 11) {
        words = this.toWords(totalNotes).toUpperCase();
    } else if (totalNotes < 1000) {
        words = totalNotes;
    } else if (totalNotes < 1000000) {
        if (totalNotes % 100 === 0) {
            totalNotes = totalNotes / 1000;
            words = totalNotes + "K";
        } else {
            words = me.formatNum(totalNotes)
        }

    } else if (totalNotes < 1000000000) {
        if (totalNotes % 100000 === 0) {
            totalNotes = totalNotes / 1000000;
            words = totalNotes + "M";
        } else {
            words = me.formatNum(totalNotes)
        }
    } else {
        if (totalNotes % 100000 === 0) {
            totalNotes = totalNotes / 1000000;
            words = totalNotes + "B";
        } else {
            words = me.formatNum(totalNotes)
        }

    }

    let num = words.toString().length;
    if (num <= 4) {
      fontString = "bold 122px Barlow";
    } else if (num <= 5) {
        fontString = "bold 98px Barlow";
    } else if (num <= 6) {
        fontString = "bold 83px Barlow";
    } else if (num <= 7) {
        fontString = "bold 68px Barlow";
    } else if (num <= 8) {
        fontString = "bold 60px Barlow";
    } else if (num <= 9) {
        fontString = "bold 54px Barlow";
    } else if (num <= 10) {
        fontString = "bold 46px Barlow";
    }

    const card_canvas = document.createElement('canvas');
    card_canvas.setAttribute('width', '375');
    card_canvas.setAttribute('height', '667');
    const ctx = card_canvas.getContext('2d');

    // Draw Image function
    const bgImg = new Image();
    bgImg.src = 'assets/images/bgImg.png';
    const iconOne = new Image();
    iconOne.src = 'assets/images/listIcon.svg'
    const iconTwo = new Image();
    iconTwo.src = 'assets/images/unionIcon.svg'
    bgImg.onload = async function () {
      ctx.fillStyle = "#02203D";
      ctx.fillRect(0, 0, 375, 667);
      ctx.drawImage(bgImg, 0, 0);
      ctx.fillStyle = "#7FA8FF";
      ctx.font = "600 24px Barlow";
      ctx.fillText("CloudCoin", 230, 40);
      ctx.drawImage(iconOne, 24, 325);
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px Barlow";
      ctx.fillText(words, 55, 338);
      ctx.drawImage(iconTwo, 24, 360);

      ctx.font = "400 18px Barlow";
      ctx.fillText(latest_date, 55, 375);
      ctx.font = fontString;
      ctx.fillText(words, 24, 520);
      ctx.font = "16px Barlow";
      ctx.fillText("Upload this file to your Skyvault", 24, 595);
      ctx.fillText("or POWN it and keep it wherever you want", 24, 615);
      ctx.fillStyle = "#7FA8FF";
      ctx.font = "14px Barlow";
      ctx.fillText("More info on Cloudcoin.global", 24, 645);

      ctx.rotate(90 * Math.PI / 180);
      ctx.font = "600 40px Barlow";
      ctx.fillStyle = "#7FA8FF";
      ctx.fillText("CC", 24, -30);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(me.formatNum(totalNotes), 100, -30);

      me.cardImageBlank = card_canvas.toDataURL(); // 'data:image/png;base64,' + coinResponse;
      await me.makePng(totalNotes, cloudcoins);
    }
  }

  async makePng(totalNotes, cloudcoins){

    const coinParam = {
      // array of coins
      coins: cloudcoins,
      // PNG URL. Must be the compatible with CORS policy
      // The URL can be specified in Base64 format if you prepend 'data:application/octet-binary;base64,' to it
      template: this.cardImageBlank
    };

    try {
      let coinResponse = await this.skyvault.embedInImage(coinParam);

      if (coinResponse.status && coinResponse.status === 'error') {
        this.showErrorMessage(coinResponse.errorText);
        localStorage.setItem('job', '0');
      }
      else {
        this.cardImage = 'data:image/png;base64,' + coinResponse;
        this.downloadPng(totalNotes);
      }

    } catch (e) {
      console.log(e);
    }
  }

  downloadPng(totalNotes) {
    const a = document.createElement('a'); // Create <a>
    a.href = this.cardImage; // Image Base64 Goes here
    const filename = totalNotes + '.CloudCoin.' + Date.now() + '.png';
    a.download =  filename; //'coin.png'; // File name Here
    a.click();
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
