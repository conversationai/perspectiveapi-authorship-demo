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
import { CustomizableDemoForm } from './customizable-demo-form.component';

@NgModule({
  declarations: [
    ConvaiChecker,
    CustomizableDemoForm,
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
  ],
  providers: [PerspectiveApiService],
  bootstrap: [CustomizableDemoForm]
})
export class AppModule { }
