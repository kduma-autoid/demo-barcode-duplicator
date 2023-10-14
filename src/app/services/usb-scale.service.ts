import { Injectable } from '@angular/core';
import {
  OnReadEvent,
  OnScaleConnectedEvent,
  OnScaleDisconnectedEvent,
  ScaleStatus,
  USBScale
} from "@kduma-autoid/capacitor-usb-scale";
import {App} from "@capacitor/app";

type UsbScaleServiceCallback = (event: OnReadEvent|null) => void;

@Injectable({
  providedIn: 'root'
})
export class UsbScaleService {
  private _connected: boolean = false;

  private _lastStatus: ScaleStatus|null = null;
  private _lastWeight: number = 0;
  private _isCorrectStatus: boolean = false;

  private _callback: UsbScaleServiceCallback | undefined;

  constructor() {
    USBScale.addListener('onRead', (data) => this.onRead(data));
    USBScale.addListener('onScaleDisconnected', (data) => this.onScaleDisconnected(data));
    USBScale.addListener('onScaleConnected', (data) => this.onScaleConnected(data));
  }

  get lastStatus(): ScaleStatus|null {
    return this._lastStatus;
  }

  get lastWeight(): number {
    return this._lastWeight;
  }

  get isCorrectStatus(): boolean {
    return this._isCorrectStatus;
  }

  get callback(): UsbScaleServiceCallback | undefined {
    return this._callback;
  }

  set callback(value: UsbScaleServiceCallback | undefined) {
    this._callback = value;
  }

  get connected(): boolean {
    return this._connected;
  }

  private onRead(data: OnReadEvent) {
    this._lastStatus = data.status;
    this._lastWeight = data.weight;
    this._isCorrectStatus = data.status !== ScaleStatus.Zero && data.status !== ScaleStatus.InMotion && data.status !== ScaleStatus.Stable;
  }

  private onScaleDisconnected(data: OnScaleDisconnectedEvent) {
    this._lastStatus = null;
    this._lastWeight = 0;
    this._connected = false;
  }

  private async onScaleConnected(data: OnScaleConnectedEvent) {
    let p = await USBScale.hasPermission({ device_id: data.device.id });
    if (!p.permission) {
      try {
        await USBScale.open();
        this._connected = true;
      } catch (err) {
        console.log(err)
      }
      return;
    }

    let listener = App.addListener('resume', async () => {
      await listener.remove();

      let p = await USBScale.hasPermission();
      if (!p.permission) {
        console.log("No permissions given.");
        return;
      }

      try {
        await USBScale.open();
        this._connected = true;
      } catch (err) {
        console.log(err)
      }
    });
  }
}
