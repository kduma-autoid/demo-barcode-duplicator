import { TestBed } from '@angular/core/testing';

import { UsbScaleService } from './usb-scale.service';

describe('UsbScaleService', () => {
  let service: UsbScaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsbScaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
