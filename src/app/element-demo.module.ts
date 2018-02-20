import { NgModule } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

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
  ngDoBootstrap() {}
}
