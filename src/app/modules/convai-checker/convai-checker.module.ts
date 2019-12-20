import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  MatButtonModule,
  MatInputModule,
} from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { PerspectiveStatusComponent } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { ConvaiCheckerComponent } from './convai-checker.component';

@NgModule({
  declarations: [
    ConvaiCheckerComponent,
    PerspectiveStatusComponent,
  ],
  exports: [
    ConvaiCheckerComponent,
    PerspectiveStatusComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  providers: [PerspectiveApiService, {provide: APP_BASE_HREF, useValue: '/'}],
  entryComponents: [ConvaiCheckerComponent]
})
export class ConvaiCheckerModule {
  constructor(private injector: Injector) {}

  ngDoBootstrap() {
    // Create custom element to use as a webcomponent.
    const checkerElement = createCustomElement(ConvaiCheckerComponent, { injector: this.injector });
    customElements.define('convai-checker', checkerElement);
  }
}
