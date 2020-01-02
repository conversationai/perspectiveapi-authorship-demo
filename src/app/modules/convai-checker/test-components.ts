import { Component, NgModule, OnInit, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PerspectiveStatusComponent, CommentFeedback, Emoji, LoadingIconStyle, Shape } from './perspective-status.component';
import { ConvaiCheckerComponent, DEFAULT_DEMO_SETTINGS, DemoSettings } from './convai-checker.component';
import { ConvaiCheckerModule } from './convai-checker.module';
import { PerspectiveApiService } from './perspectiveapi.service';
import { AnalyzeCommentResponse } from './perspectiveapi-types';
import * as d3 from 'd3-color';

@Component({
  selector: 'checker-no-input-id-specified',
  template: `
        <convai-checker
           id="checker"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
export class ConvaiCheckerNoInputComponent {
  @ViewChild(ConvaiCheckerComponent, {static: false}) checker: ConvaiCheckerComponent;
  textArea: HTMLTextAreaElement;
  serverUrl = 'test-url';
}

@Component({
  selector: 'checker-no-demo-settings-specified',
  template: `
        <convai-checker
           id="checker"
           [inputId]="checkerInputId"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
export class ConvaiCheckerNoDemoSettingsComponent {
  @ViewChild(ConvaiCheckerComponent, {static: false}) checker: ConvaiCheckerComponent;
  textArea: HTMLTextAreaElement;
  checkerInputId = 'checkerTextarea';
  serverUrl = 'test-url';
  constructor() {
  }
}

@Component({
  selector: 'checker-missing-input-id',
  template: `
        <convai-checker
           id="checker"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
export class ConvaiCheckerMissingInputIdComponent {
  @ViewChild(ConvaiCheckerComponent, {static: false}) checker: ConvaiCheckerComponent;
  textArea: HTMLTextAreaElement;
  serverUrl = 'test-url';
}

@Component({
  selector: 'test-comp-attribute-input',
  template: `
        <convai-checker
           id="checker"
           inputId="checkerTextarea"
           [demoSettings]="demoSettings"
           serverUrl="test-url">
          Loading...
        </convai-checker>
        <textarea class="checkerInputBox"
                  id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
export class ConvaiCheckerWithAttributeInputComponent {
  @ViewChild(ConvaiCheckerComponent, {static: false}) checker: ConvaiCheckerComponent;
  demoSettings = JSON.parse(JSON.stringify(DEFAULT_DEMO_SETTINGS));
  constructor() {
    this.demoSettings.communityId = 'testCommunityId';
  }
}

/** Test component with customizable DemoSettings. */
@Component({
  selector: 'checker-custom-demo-settings',
  template: `
        <convai-checker
           id="checker"
           [inputId]="checkerInputId"
           [serverUrl]="serverUrl"
           [demoSettings]="demoSettings">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
export class ConvaiCheckerCustomDemoSettingsComponent implements OnInit {
  @ViewChild(ConvaiCheckerComponent, {static: false}) checker: ConvaiCheckerComponent;
  textArea: HTMLTextAreaElement;
  checkerInputId = 'checkerTextarea';
  serverUrl = 'test-url';
  demoSettings = JSON.parse(JSON.stringify(DEFAULT_DEMO_SETTINGS));

  ngOnInit() {
    this.textArea = document.getElementById('checkerTextarea') as HTMLTextAreaElement;
  }

  setDemoSettings(demoSettings: DemoSettings) {
    this.demoSettings = demoSettings;
  }
}

/** Test component with JSON DemoSettings. */
@Component({
  selector: 'checker-json-demo-settings',
  template: `
        <convai-checker
           id="checker"
           [inputId]="checkerInputId"
           [serverUrl]="serverUrl"
           [demoSettingsJson]="demoSettingsJson">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
export class ConvaiCheckerJsonDemoSettingsComponent implements OnInit {
  @ViewChild(ConvaiCheckerComponent, {static: false}) checker: ConvaiCheckerComponent;
  textArea: HTMLTextAreaElement;
  checkerInputId = 'checkerTextarea';
  serverUrl = 'test-url';
  demoSettingsJson = '';

  ngOnInit() {
    const demoSettings = JSON.parse(JSON.stringify(DEFAULT_DEMO_SETTINGS));
    demoSettings.scoreThresholds = [0.2, 0.5, 0.8];
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    demoSettings.feedbackText = ['foo', 'bar', 'test'];
    this.demoSettingsJson = JSON.stringify(demoSettings);
    this.textArea = document.getElementById('checkerTextarea') as HTMLTextAreaElement;
  }

  // Allows unit tests access to the custom demo settings specified by this
  // test class.
  getDemoSettingsJson() {
    return this.demoSettingsJson;
  }
}
@NgModule({
  declarations: [
    ConvaiCheckerNoInputComponent,
    ConvaiCheckerNoDemoSettingsComponent,
    ConvaiCheckerMissingInputIdComponent,
    ConvaiCheckerWithAttributeInputComponent,
    ConvaiCheckerCustomDemoSettingsComponent,
    ConvaiCheckerJsonDemoSettingsComponent
  ],
  imports: [
    ConvaiCheckerModule
  ]
})
export class TestComponentsModule {}

