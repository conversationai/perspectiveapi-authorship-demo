import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import {APP_BASE_HREF} from '@angular/common';
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
import {RouterModule, Routes} from '@angular/router';
import {ColorPickerModule} from 'ngx-color-picker';

import { PerspectiveStatus } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { ConvaiChecker } from './convai-checker.component';
import { CustomizableDemoForm } from './customizable-demo-form.component';
import { WrapperApp } from './app.component';

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
    ConvaiChecker,
    CustomizableDemoForm,
    PerspectiveStatus,
    WrapperApp
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
    RouterModule.forRoot(appRoutes, {useHash: true})
  ],
  providers: [PerspectiveApiService, {provide: APP_BASE_HREF, useValue: '/'},],
  bootstrap: [WrapperApp]
})
export class AppModule { }
