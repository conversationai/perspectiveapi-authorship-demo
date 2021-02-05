import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
//import {DemoModuleNgFactory} from './app/demo.module.ngfactory';

import { DemoModule } from './app/demo.module';
import { environment } from './environments/environment';

//if (environment.production) {
//  enableProdMode();
//}

platformBrowserDynamic().bootstrapModule(DemoModule).catch(err => console.log(err));
