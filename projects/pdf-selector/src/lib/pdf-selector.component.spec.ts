import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfSelectorComponent } from './pdf-selector.component';

describe('PdfSelectorComponent', () => {
  let component: PdfSelectorComponent;
  let fixture: ComponentFixture<PdfSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfSelectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
