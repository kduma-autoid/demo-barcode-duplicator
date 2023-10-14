import {Component, computed, effect, NgZone, Signal, signal} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {UsbScaleService} from "../services/usb-scale.service";
import {
  OnReadEvent,
  OnScaleConnectedEvent,
  OnScaleDisconnectedEvent,
  ScaleStatus, USBScale
} from "@kduma-autoid/capacitor-usb-scale";
import {App} from "@capacitor/app";
import {SunmiPrinter} from "@kduma-autoid/capacitor-sunmi-printer";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule],
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

  constructor(
    private ngZone: NgZone,
    private usbScaleService: UsbScaleService,
  ) {
    this.usbScaleService.onReadCallback = this.usbScaleOnRead.bind(this);
    this.usbScaleService.onConnectionStatusChanged = this.usbScaleOnConnectionStatusChanged.bind(this);

    effect(async () => {
      await SunmiPrinter.sendLCDString({text: this.weightString()});
    });
  }

  async ngOnInit() {

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
        await SunmiPrinter.sendLCDHibernateCommand();
      }
    });
  }
}
