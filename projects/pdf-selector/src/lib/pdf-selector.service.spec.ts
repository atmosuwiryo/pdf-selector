import { TestBed } from '@angular/core/testing';

import { PdfSelectorService } from './pdf-selector.service';

describe('PdfSelectorService', () => {
  let service: PdfSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
