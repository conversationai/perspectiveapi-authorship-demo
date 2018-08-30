import { NgModule, Injector } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { createCustomElement } from '@angular/elements';

import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { ConvaiChecker } from './convai-checker.component';
import { PerspectiveStatus } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';

@NgModule({
  imports: [BrowserModule, HttpModule],
  declarations: [ConvaiChecker, PerspectiveStatus],
  entryComponents: [ConvaiChecker],
  providers: [PerspectiveApiService, {provide: APP_BASE_HREF, useValue: '/'},],
})
export class ElementDemoModule {
  constructor(private injector: Injector) {
    const checkerElement = createCustomElement(ConvaiChecker, { injector });
    customElements.define('convai-checker', checkerElement);
  }

  ngDoBootstrap() {}
}
