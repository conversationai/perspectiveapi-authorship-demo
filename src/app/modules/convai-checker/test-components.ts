import { Component, OnInit, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PerspectiveStatus, CommentFeedback, Emoji, LoadingIconStyle, Shape } from './perspective-status.component';
import { ConvaiChecker, DEFAULT_DEMO_SETTINGS, DemoSettings } from './convai-checker.component';
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
export class ConvaiCheckerNoInput {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  serverUrl: string = 'test-url';
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
export class ConvaiCheckerNoDemoSettings {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  constructor() {
  }
}

@Component({
  selector: 'checker-invalid-input-id-specified',
  template: `
        <convai-checker
           id="checker"
           [inputId]="thereIsNoTextAreaWithThisId"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
export class ConvaiCheckerInvalidInput {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  serverUrl: string = 'test-url';
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
export class ConvaiCheckerWithAttributeInput {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  demoSettings = JSON.parse(JSON.stringify(DEFAULT_DEMO_SETTINGS));
  constructor() {
    this.demoSettings.configuration = 'external';
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
export class ConvaiCheckerCustomDemoSettings implements OnInit {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
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
export class ConvaiCheckerJsonDemoSettings implements OnInit {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  demoSettingsJson: string = '';

  ngOnInit() {
    let demoSettings = JSON.parse(JSON.stringify(DEFAULT_DEMO_SETTINGS));
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
