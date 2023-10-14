import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import {UsbScaleService} from "../services/usb-scale.service";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class HomePage {
  constructor(
    private usbScaleService: UsbScaleService,
  ) {}
}
