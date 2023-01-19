import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { PdfSelectorModule } from 'pdf-selector';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    PdfSelectorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
