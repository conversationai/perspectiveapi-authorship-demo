import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { PerspectiveStatus } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { ConvaiChecker } from './convai-checker.component';

@NgModule({
  declarations: [
    ConvaiChecker,
    PerspectiveStatus,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
  ],
  providers: [PerspectiveApiService],
  bootstrap: [ConvaiChecker]
})
export class AppModule { }
