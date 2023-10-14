import {Component, computed, NgZone, Signal, signal} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {UsbScaleService} from "../services/usb-scale.service";
import {
  OnReadEvent,
  OnScaleConnectedEvent,
  OnScaleDisconnectedEvent,
  ScaleStatus, USBScale
} from "@kduma-autoid/capacitor-usb-scale";
import {App} from "@capacitor/app";

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
    return (Math.round(kg * 100) / 100) + ' kg';
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
    });
  }
}
