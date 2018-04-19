import 'gsap';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import {ElementDemoModule} from './app/element-demo.module';
import { environment } from './environments/environment';
import { registerAsCustomElements } from '@angular/elements';
import {ConvaiChecker} from './app/convai-checker.component';

if (environment.production) {
  enableProdMode();
}

registerAsCustomElements([ConvaiChecker], () =>
  platformBrowserDynamic().bootstrapModule(ElementDemoModule),
);
