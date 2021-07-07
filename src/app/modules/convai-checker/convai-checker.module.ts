import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  MatButtonModule,
} from '@angular/material/button'
import {
  MatInputModule,
} from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReCaptchaV3Service, RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha';

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
  providers: [
    PerspectiveApiService, {provide: APP_BASE_HREF, useValue: '/'},
    // If using the convai-checker component in this module alongside a
    // perspectiveapi-simple-server backend with reCAPTCHA enabled, uncomment
    // these providers and add your site key under 'useValue'.
    ReCaptchaV3Service,
    {provide: RECAPTCHA_V3_SITE_KEY, useValue: '----' }
  ],
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
