/*
Copyright 2017 Google Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/finally';

@Component({
  selector: 'customizable-demo-form',
  templateUrl: './customizable-demo-form.component.html',
  styleUrls: ['./customizable-demo-form.component.css'],
})
export class CustomizableDemoForm implements OnInit {
  configurations = ['default', 'external'];
  defaultColors = ["#25C1F9", "#7C4DFF", "#D400F9"];
  selectedConfiguration: string = 'default';
  @Input() colors = this.defaultColors.slice();

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {}

  resetToDefaultColors() {
    this.colors = this.defaultColors.slice();
  }
}
