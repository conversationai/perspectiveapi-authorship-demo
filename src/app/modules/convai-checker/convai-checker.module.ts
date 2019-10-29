import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {APP_BASE_HREF} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {
  MatButtonModule,
  MatInputModule,
} from '@angular/material';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';

import {PerspectiveStatusComponent} from './perspective-status.component';
import {PerspectiveApiService} from './perspectiveapi.service';
import {ConvaiCheckerComponent} from './convai-checker.component';
import {RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module, RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings} from 'ng-recaptcha';

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
    RecaptchaModule,

  ],
  providers: [PerspectiveApiService, {provide: APP_BASE_HREF, useValue: '/'}],
  bootstrap: [ConvaiCheckerComponent]
})
export class ConvaiCheckerModule {}
