import { NgModule } from '@angular/core';
import { PdfSelectorComponent } from './pdf-selector.component';
import { NgxExtendedPdfViewerModule } from "ngx-extended-pdf-viewer";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [
    PdfSelectorComponent
  ],
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    FormsModule
  ],
  exports: [
    PdfSelectorComponent
  ]
})
export class PdfSelectorModule { }
