import { NgModule, Injector } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { createCustomElement } from '@angular/elements';

import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { ConvaiCheckerComponent } from './convai-checker.component';
import { PerspectiveStatusComponent } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';

@NgModule({
  imports: [BrowserModule, HttpModule],
  declarations: [ConvaiCheckerComponent, PerspectiveStatusComponent],
  entryComponents: [ConvaiCheckerComponent],
  providers: [PerspectiveApiService, {provide: APP_BASE_HREF, useValue: '/'}],
})
export class ElementDemoModule {
  constructor(private injector: Injector) {
    const checkerElement = createCustomElement(ConvaiCheckerComponent, { injector });
    customElements.define('convai-checker', checkerElement);
  }

  ngDoBootstrap() {}
}
