import { Component } from '@angular/core';
import { PdfDocument, TextSelection } from 'pdf-selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'pdf-selector-example';
  selection?: TextSelection;
  pdfDocuments: PdfDocument[] = [
    {
      url: 'assets/sample.pdf',
      name: 'sample file 1'
    },{
      url: 'assets/bofh_ep_1.pdf',
      name: 'sample file 2'
    }
  ]

  textSelection(ev: TextSelection ): void{
    this.selection = ev;
  }

}
