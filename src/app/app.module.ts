import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatInputModule,
  MatSelectModule,
  MatSlideToggleModule,
  MatSliderModule,
} from '@angular/material';
import {MatFormFieldModule} from '@angular/material/form-field';
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
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
  ],
  providers: [PerspectiveApiService],
  bootstrap: [CustomizableDemoForm]
})
export class AppModule { }
