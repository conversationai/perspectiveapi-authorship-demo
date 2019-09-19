import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

import { CustomizableDemoFormComponent } from './customizable-demo-form.component';
import { WrapperAppComponent } from './demo.component';
import { ConvaiCheckerModule } from './modules/convai-checker/convai-checker.module';

const appRoutes: Routes = [
  {
    path: 'customize',
    component: CustomizableDemoFormComponent
  },
  {
    path: 'customize/:uiSettings/:encodedDemoSettings',
    component: CustomizableDemoFormComponent
  },
  {
    path: '',
    redirectTo: '/customize',
    pathMatch: 'full'
  },
];


@NgModule({
  declarations: [
    CustomizableDemoFormComponent,
    WrapperAppComponent
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
  bootstrap: [WrapperAppComponent]
})
export class DemoModule { }
