import {Component, computed, effect, NgZone, Signal, signal} from '@angular/core';
import {IonicModule} from '@ionic/angular';
import {
  AlignmentModeEnum,
  Barcode2DSymbologyEnum, BarcodeSymbologyEnum,
  BarcodeTextPositionEnum,
  SunmiPrinter
} from "@kduma-autoid/capacitor-sunmi-printer";
import {NgIf} from "@angular/common";
import {OutputMode, ScanMode, ScanResultCodeIDEnum, SunmiScanHead} from "@kduma-autoid/capacitor-sunmi-scanhead";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, NgIf],
})
export class HomePage {
  constructor(
    private ngZone: NgZone,
  ) {

  }

  async ngOnInit() {
    SunmiScanHead.addListener('onScanResult', this.onScanResultListener.bind(this));

    try {
      await SunmiScanHead.createWriteContext();
    } catch (e) {}
    try {
      await SunmiScanHead.setBroadcastConfiguration({start_intent: false, end_intent: false});
    } catch (e) {}
    try {
      await SunmiScanHead.setOutputType({mode: OutputMode.Disabled});
    } catch (e) {}
    try {
      await SunmiScanHead.setOutputBroadcastEnabled({enabled: true});
    } catch (e) {}
    try {
      await SunmiScanHead.setScanResultCodeID({type: ScanResultCodeIDEnum.None});
    } catch (e) {}
    try {
      await SunmiScanHead.setAdvancedFormatEnabled({enabled: false});
    } catch (e) {}
    try {
      await SunmiScanHead.setBeep({enabled: true});
    } catch (e) {}
    try {
      await SunmiScanHead.setVibrate({enabled: true});
    } catch (e) {}
    try {
      await SunmiScanHead.setTriggerMethod({mode: ScanMode.Trigger});
    } catch (e) {}
    try {
      await SunmiScanHead.commitWriteContext();
    } catch (e) {}
  }


  private async onScanResultListener(scan: { data: string; source_bytes: string; }) {
    this.ngZone.run(() => {
      this.printWeight(scan.data);
    });
  }

  async printWeight(barcode: string) {
    try {
      let now = new Date();
        SunmiPrinter.enterPrinterBuffer({clean: true});
        SunmiPrinter.labelLocate();
        SunmiPrinter.setBoldPrintStyle({enable: true});
        SunmiPrinter.setAlignment({alignment: AlignmentModeEnum.CENTER});
        SunmiPrinter.lineWrap({lines: 1});
        SunmiPrinter.setFontSize({size: 30});
        SunmiPrinter.printText({text: barcode});
        SunmiPrinter.lineWrap({lines: 1});
        SunmiPrinter.printBarCode({
          content: barcode,
          symbology: BarcodeSymbologyEnum.CODE_128,
          height: 75,
          width: 2,
          text_position: BarcodeTextPositionEnum.NO_TEXT
        });
        SunmiPrinter.lineWrap({lines: 2});
        SunmiPrinter.labelOutput();
        SunmiPrinter.exitPrinterBuffer({commit: true});
    } catch (e) {
      console.log(e);
    }
  }
}
