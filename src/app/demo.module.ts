import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatInputModule,
  MatSlideToggleModule,
  MatSliderModule,
} from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule, Routes } from '@angular/router';
import { ColorPickerModule } from 'ngx-color-picker';

import { CustomizableDemoForm } from './customizable-demo-form.component';
import { WrapperApp } from './demo.component';
import { ConvaiCheckerModule } from './modules/convai-checker/convai-checker.module';

const appRoutes: Routes = [
  {
    path: 'customize',
    component: CustomizableDemoForm
  },
  {
    path: 'customize/:uiSettings/:encodedDemoSettings',
    component: CustomizableDemoForm
  },
  {
    path: '',
    redirectTo: '/customize',
    pathMatch: 'full'
  },
];


@NgModule({
  declarations: [
    CustomizableDemoForm,
    WrapperApp
  ],
  imports: [
    ConvaiCheckerModule,
    BrowserAnimationsModule,
    BrowserModule,
    ColorPickerModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    RouterModule.forRoot(appRoutes, {useHash: true})
  ],
  bootstrap: [WrapperApp]
})
export class DemoModule { }
