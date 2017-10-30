/** Test module for webcomponentizing convai angular component. */
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  MdButtonModule,
  MdCheckboxModule,
  MdInputModule,
  MdSelectModule,
  MdSlideToggleModule,
  MdSliderModule,
} from '@angular/material';
import {ColorPickerModule} from 'ngx-color-picker';

import { PerspectiveStatus } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { ConvaiChecker } from './convai-checker.component';
import { NgDirectivesModule } from '../webcomponent-util-code/angular-elements/src/directives/ng_directives';

@NgModule({
  declarations: [
    ConvaiChecker,
    PerspectiveStatus,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    ColorPickerModule,
    FormsModule,
    HttpModule,
    MdButtonModule,
    MdCheckboxModule,
    MdInputModule,
    MdSelectModule,
    MdSlideToggleModule,
    MdSliderModule,
    NgDirectivesModule
  ],
  providers: [PerspectiveApiService],
  // bootstrap: [ConvaiChecker]
})
export class DemoWcModule { }
