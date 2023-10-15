import {Component, computed, effect, NgZone, Signal, signal} from '@angular/core';
import {IonicModule} from '@ionic/angular';
import {UsbScaleService} from "../services/usb-scale.service";
import {ScaleStatus} from "@kduma-autoid/capacitor-usb-scale";
import {AlignmentModeEnum, Barcode2DSymbologyEnum, SunmiPrinter} from "@kduma-autoid/capacitor-sunmi-printer";
import {HandleableKey, SunmiKeyboardHandler} from "@kduma-autoid/capacitor-sunmi-keyboard-handler";
import {NgIf} from "@angular/common";
import {KeyEvent, ModifierKey} from "@kduma-autoid/capacitor-sunmi-keyboard-handler/dist/esm/definitions";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf],
})
export class HomePage {
  weight = signal<number>(0)
  weightString: Signal<string> = computed(() => {
    if (!this.correct()) {
      return '~ g';
    }

    if (this.weight() < 1000) {
      return (Math.round(this.weight() * 100) / 100) + ' g';
    }

    let kg = this.weight() / 1000;
    return (Math.round(kg * 1000) / 1000) + ' kg';
  });
  status = signal<ScaleStatus|null>(null);
  correct = signal<boolean>(false);
  connected = signal<boolean>(false);
  priced = signal<boolean>(false);
  priceString = signal<string>("");
  price = computed(() => {
    if(!this.priced()) {
      return 0;
    }

    let val = parseFloat(this.priceString());

    if(isNaN(val)) {
      return 0;
    }

    return val;
  });
  total = computed(() => {
    if(!this.priced() || !this.correct()) {
      return 0;
    }

    return Math.round(this.price() * this.weight() / 1000 * 100) / 100;
  });
  totalString = computed(() => {
    if (!this.correct()) {
      return '~';
    }

    return this.total().toFixed(2);
  });

  constructor(
    private ngZone: NgZone,
    private usbScaleService: UsbScaleService,
  ) {
    effect(async () => {
      await SunmiPrinter.sendLCDString({text: this.weightString()});
    });
  }

  async ngOnInit() {
    this.usbScaleService.onReadCallback = this.usbScaleOnRead.bind(this);
    this.usbScaleService.onConnectionStatusChanged = this.usbScaleOnConnectionStatusChanged.bind(this);

    SunmiKeyboardHandler.enableHandler({key: HandleableKey.Sunmi89KeyKeyboard_Cash});
    SunmiKeyboardHandler.addListener('onKeyPressed', this.keyboardOnPress.bind(this));
    SunmiKeyboardHandler.addListener('onKeyboardInput', this.keyboardOnInput.bind(this));
  }

  private async keyboardOnPress(data: {
    key: HandleableKey;
    modifiers: ModifierKey[];
    type: KeyEvent;
  }) {
    await this.ngZone.run(async () => {
      if(data.key == HandleableKey.Sunmi89KeyKeyboard_Cash && data.type == KeyEvent.KeyDown && data.modifiers.includes(ModifierKey.Ctrl)) {
        await this.printWeight();
      } else if(data.key == HandleableKey.Sunmi89KeyKeyboard_Cash && data.type == KeyEvent.KeyDown && !data.modifiers.includes(ModifierKey.Ctrl)) {

        this.priced.set(!this.priced());
        if(this.priced()) {
          await SunmiKeyboardHandler.enableHandler({key: HandleableKey.Sunmi89KeyKeyboard_NumPad});
        } else {
          this.priceString.set("");
          await SunmiKeyboardHandler.disableHandler({key: HandleableKey.Sunmi89KeyKeyboard_NumPad});
        }
      }
    });
  }

  private async keyboardOnInput(data: {
    groupKey: HandleableKey;
    key: HandleableKey;
    value: string;
    isWhiteChar: boolean;
  }) {
    if(data.groupKey != HandleableKey.Sunmi89KeyKeyboard_NumPad) return;

    if(data.key == HandleableKey.Sunmi89KeyKeyboard_NumPadMultiply) return;
    if(data.key == HandleableKey.Sunmi89KeyKeyboard_NumPadSubtract) return;
    if(data.key == HandleableKey.Sunmi89KeyKeyboard_NumPadAdd) return;
    if(data.key == HandleableKey.Sunmi89KeyKeyboard_NumPadEnter) return;

    await this.ngZone.run(async () => {
      this.priceString.update(value => {
        if(data.key == HandleableKey.Sunmi89KeyKeyboard_NumPadDivide) {
          return "";
        }

        if(data.key == HandleableKey.Sunmi89KeyKeyboard_NumPadDot) {
          if(value.includes("."))
            return value;
        }

        return value += data.value;
      })
    });
  }

  private async usbScaleOnRead(correct: boolean, status: ScaleStatus|null, weight: number) {
    await this.ngZone.run(async () => {
      this.weight.set(weight);
      this.status.set(status);
      this.correct.set(correct);
    });
  }

  private async usbScaleOnConnectionStatusChanged(connected: boolean) {
    await this.ngZone.run(async () => {
      this.connected.set(connected);

      if(!connected) {
        this.weight.set(0);
        this.status.set(null);
        this.correct.set(false);
      }

      if(connected) {
        await SunmiPrinter.sendLCDWakeUpCommand();
      } else {
        await SunmiPrinter.sendLCDClearCommand();
        await SunmiPrinter.sendLCDString({text: "~"});
        await SunmiPrinter.sendLCDHibernateCommand();
      }
    });
  }

  async printWeight() {
    let number = Math.round(this.weight());
    try {
      let now = new Date();
        SunmiPrinter.enterPrinterBuffer({clean: true});
        SunmiPrinter.setBoldPrintStyle({enable: true});
        SunmiPrinter.setAlignment({alignment: AlignmentModeEnum.CENTER});
        SunmiPrinter.setFontSize({size: 25});
        SunmiPrinter.printText({text: now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds()});
        SunmiPrinter.lineWrap({lines: 1});
        SunmiPrinter.setFontSize({size: 50});
        SunmiPrinter.printText({text: "Weighting Result"});
        SunmiPrinter.lineWrap({lines: 1});
        SunmiPrinter.setFontSize({size: 125});
        SunmiPrinter.printText({text: this.weightString() + "\n"});
        SunmiPrinter.lineWrap({lines: 1});

        if(this.priced()) {
          SunmiPrinter.setFontSize({size: 35});
          SunmiPrinter.printText({text: "Price per kg"});
          SunmiPrinter.lineWrap({lines: 1});
          SunmiPrinter.setFontSize({size: 90});
          SunmiPrinter.printText({text: this.priceString() + "$\n"});
          SunmiPrinter.lineWrap({lines: 1});

          SunmiPrinter.setFontSize({size: 45});
          SunmiPrinter.printText({text: "Total"});
          SunmiPrinter.lineWrap({lines: 1});
          SunmiPrinter.setFontSize({size: 150});
          SunmiPrinter.printText({text: this.totalString() + "$\n"});
          SunmiPrinter.lineWrap({lines: 1});
        }

        SunmiPrinter.print2DCode({content: JSON.stringify({
            weight: number,
            date: now,
            price: this.price(),
            total: this.total(),
          }), size: 3, symbology: Barcode2DSymbologyEnum.PDF417, error_correction: 2});
        SunmiPrinter.lineWrap({lines: 2});
        SunmiPrinter.cutPaper();
        SunmiPrinter.exitPrinterBuffer({commit: true});
    } catch (e) {
      console.log(e);
    }
  }
}
