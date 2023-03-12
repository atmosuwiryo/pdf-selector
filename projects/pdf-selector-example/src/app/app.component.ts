import { Component } from '@angular/core';
import { TextSelection } from 'pdf-selector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'pdf-selector-example';
  selection?: TextSelection;

  textSelection(ev: TextSelection ): void{
    this.selection = ev;
  }

}
