// import 'hammerjs';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

// import { AppComponent } from './app.component';
import { PerspectiveStatus } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { ConvaiChecker } from './convai-checker.component';
// import { MaterialModule } from '@angular/material';

@NgModule({
  declarations: [
    ConvaiChecker,
    PerspectiveStatus,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    // MaterialModule,
  ],
  providers: [PerspectiveApiService],
  bootstrap: [ConvaiChecker]
})
export class AppModule { }
