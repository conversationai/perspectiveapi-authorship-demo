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
  Component,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  TestBed,
  async,
} from '@angular/core/testing';
import {
  MockBackend,
  MockConnection
} from '@angular/http/testing';
import {
  BaseRequestOptions,
  Http,
  Response,
  ResponseOptions,
  XHRBackend
} from '@angular/http';
import { By } from '@angular/platform-browser';
import { PerspectiveStatus, CommentFeedback } from './perspective-status.component';
import { ConvaiChecker, DEFAULT_DEMO_SETTINGS, DemoSettings } from './convai-checker.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { AnalyzeCommentResponse } from './perspectiveapi-types';
import 'gsap';

@Component({
  selector: 'my-comp',
  template: `
        <convai-checker
           id="checker"
           [inputId]="checkerInputId"
           [demoSettings]="demoSettings"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
class ConvaiCheckerTestComponentExternalConfig implements OnInit {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  demoSettings = getCopyOfDefaultDemoSettings();
  constructor() {
    this.demoSettings.configuration = 'external';
  }

  ngOnInit() {
    this.textArea = document.getElementById('checkerTextarea') as HTMLTextAreaElement;
  }
}

@Component({
  selector: 'my-comp',
  template: `
        <convai-checker
           id="checker"
           [inputId]="checkerInputId"
           [demoSettings]="demoSettings"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
class ConvaiCheckerTestComponentDemoConfig implements OnInit {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  demoSettings = getCopyOfDefaultDemoSettings();
  constructor() {
    this.demoSettings.configuration = 'default';
  }

  ngOnInit() {
    this.textArea = document.getElementById('checkerTextarea') as HTMLTextAreaElement;
  }
}

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
class ConvaiCheckerNoInputTestComponent {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  serverUrl: string = 'test-url';
}

@Component({
  selector: 'checker-no-configuration-specified',
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
class ConvaiCheckerNoConfigurationTestComponent {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  constructor() {
  }
}

@Component({
  selector: 'checker-invalid-configuration-specified',
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
class ConvaiCheckerInvalidConfigurationTestComponent {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  demoSettings = getCopyOfDefaultDemoSettings();
  constructor() {
    this.demoSettings.configuration = 'foo';
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
class ConvaiCheckerInvalidInputTestComponent {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  serverUrl: string = 'test-url';
}

@Component({
  selector: 'my-comp-attribute-input',
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
class ConvaiCheckerWithAttributeInputTestComponent {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  demoSettings = getCopyOfDefaultDemoSettings();
  constructor() {
    this.demoSettings.configuration = 'external';
  }
}

@Component({
  selector: 'my-comp-hide-loading-icon-after-load-setting',
  template: `
        <convai-checker
           id="checker"
           [inputId]="checkerInputId"
           [demoSettings]="demoSettings"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
class ConvaiCheckerTestComponentHideLoadingIconAfterLoadSetting implements OnInit {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  demoSettings = getCopyOfDefaultDemoSettings();
  constructor() {
    this.demoSettings.hideLoadingIconAfterLoad = true;
  }

  ngOnInit() {
    this.textArea = document.getElementById('checkerTextarea') as HTMLTextAreaElement;
  }
}

@Component({
  selector: 'my-comp-hide-loading-icon-for-scores-below-threshold-setting',
  template: `
        <convai-checker
           id="checker"
           [inputId]="checkerInputId"
           [demoSettings]="demoSettings"
           [serverUrl]="serverUrl">
          Loading...
        </convai-checker>
        <textarea id="checkerTextarea"
                  placeholder="type something here and see how the dot above reacts.">
        </textarea>`,
})
class ConvaiCheckerTestComponentHideLoadingIconForScoresBelowThresholdSetting
    implements OnInit {
  @ViewChild(ConvaiChecker) checker: ConvaiChecker;
  textArea: HTMLTextAreaElement;
  checkerInputId: string = 'checkerTextarea';
  serverUrl: string = 'test-url';
  demoSettings = getCopyOfDefaultDemoSettings();
  constructor() {
    this.demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    this.demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
  }

  ngOnInit() {
    this.textArea = document.getElementById('checkerTextarea') as HTMLTextAreaElement;
  }
}

let getIsElementWithIdVisible = function(id: string): boolean {
  let element = document.getElementById(id);
  return element != null && element.offsetWidth > 0 && element.offsetHeight > 0
      && window.getComputedStyle(element).display !== 'none';
}

let getMockCheckerResponseWithScore = function(score: number, token: string):
  AnalyzeCommentResponse {
  return {
    attributeScores: {
      'TOXICITY_ATTRIBUTE': {
        spanScores: [
            {
              begin: 0,
              end: 25,
              score: {
                value: score,
                type: "PROBABILITY"
              }
            }
          ]
      },
      'OTHER_ATTRIBUTE': {
        spanScores: [
          {
            begin: 0,
            end: 25,
            score: {
              value: score,
              type: "PROBABILITY"
            }
          }
        ]
      }
    },
    languages: ["en"],
    clientToken: token,
  }
}

let getMockCheckerResponse = function(token: string): AnalyzeCommentResponse {
  return getMockCheckerResponseWithScore(0.5, token);
}

let setTextAndFireInputEvent = function(text: string,
    textArea: HTMLTextAreaElement): void {
  textArea.value = text;
  textArea.dispatchEvent(new Event('input', {
    'bubbles': true,
    'cancelable': false
  }));
}

// TODO(rachelrosen): Add variations of this for accessibility testing (enter
// key and spacebar instead of click events) to make sure things work correctly
// when a user navigates through the app using the keyboard.
let sendClickEvent = function(item: HTMLElement): void {
  let event = document.createEvent('HTMLEvents');
  event.initEvent('click', false, true);
  item.dispatchEvent(event);
}

function getCopyOfDefaultDemoSettings(): DemoSettings {
  return {
    configuration: DEFAULT_DEMO_SETTINGS.configuration,
    gradientColors: DEFAULT_DEMO_SETTINGS.gradientColors,
    apiKey: DEFAULT_DEMO_SETTINGS.apiKey,
    useGapi: DEFAULT_DEMO_SETTINGS.useGapi,
    showPercentage: DEFAULT_DEMO_SETTINGS.showPercentage,
    showMoreInfoLink: DEFAULT_DEMO_SETTINGS.showMoreInfoLink,
    feedbackText: DEFAULT_DEMO_SETTINGS.feedbackText.slice() as [string, string, string],
    scoreThresholds: DEFAULT_DEMO_SETTINGS.scoreThresholds.slice() as [number, number, number],
    hideLoadingIconAfterLoad: DEFAULT_DEMO_SETTINGS.hideLoadingIconAfterLoad,
    hideLoadingIconForScoresBelowMinThreshold:
      DEFAULT_DEMO_SETTINGS.hideLoadingIconForScoresBelowMinThreshold,
    userFeedbackPromptText: DEFAULT_DEMO_SETTINGS.userFeedbackPromptText
  };
}

function getNormalizedInnerText(element: HTMLElement) {
  return element.innerText.replace(/\s+/g, ' ');
}

describe('Convai checker test', () => {
  let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  let increasedTimeout = 20000;

  /** Set up the test bed */
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PerspectiveStatus,
        ConvaiCheckerInvalidInputTestComponent,
        ConvaiCheckerInvalidConfigurationTestComponent,
        ConvaiCheckerNoConfigurationTestComponent,
        ConvaiCheckerNoInputTestComponent,
        ConvaiCheckerTestComponentDemoConfig,
        ConvaiCheckerTestComponentExternalConfig,
        ConvaiCheckerTestComponentHideLoadingIconAfterLoadSetting,
        ConvaiCheckerTestComponentHideLoadingIconForScoresBelowThresholdSetting,
        ConvaiCheckerWithAttributeInputTestComponent,
        ConvaiChecker
      ],
      // Configure mock HTTP
      providers: [
        {
          provide: Http,
          deps: [MockBackend, BaseRequestOptions],
          useFactory: (backend: XHRBackend, options: BaseRequestOptions) => {
            return new Http(backend, options);
          },
        },
        MockBackend,
        BaseRequestOptions,
        PerspectiveApiService,
      ]
    });

    TestBed.compileComponents();

    jasmine.DEFAULT_TIMEOUT_INTERVAL = increasedTimeout;
  }));

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should recognize inputs from attributes', () => {
    let fixture = TestBed.createComponent(
      ConvaiCheckerWithAttributeInputTestComponent);

    let checker = fixture.componentInstance.checker;
    fixture.detectChanges();

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.demoSettings.configuration).toEqual('external');
  });

  it('should recognize inputs from angular input bindings', () => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentExternalConfig);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.demoSettings.configuration).toEqual('external');
  });

  it('should default to demo configuration when no configuration is specified', () => {
    let fixture = TestBed.createComponent(ConvaiCheckerNoConfigurationTestComponent);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.statusWidget.configuration).toEqual(
      checker.statusWidget.configurationEnum.DEMO_SITE);

  });

  it('should default to demo configuration when an invalid configuration is specified', () => {
    let fixture = TestBed.createComponent(ConvaiCheckerInvalidConfigurationTestComponent);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.statusWidget.configuration).toEqual(
      checker.statusWidget.configurationEnum.DEMO_SITE);

  });

  it('should show an error if no textarea id is specified', () => {
    let fixture = TestBed.createComponent(ConvaiCheckerNoInputTestComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error');
  });

  it('should show an error if an invalid textarea id is specified', () => {
    let fixture = TestBed.createComponent(ConvaiCheckerInvalidInputTestComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error');
  });

  it('Should analyze comment and store and emit response', async(() => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentDemoConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let mockScore = 0.3;
    let mockResponse: AnalyzeCommentResponse =
      getMockCheckerResponseWithScore(mockScore, checker.getToken(queryText));

    let lastEmittedResponse: AnalyzeCommentResponse|null = null;
    let lastEmittedScore: number = -1;
    let emittedResponseCount = 0;
    let emittedScoreCount = 0;

    // Records when the response is emitted.
    checker.analyzeCommentResponseChanged.subscribe(
      (emittedItem: AnalyzeCommentResponse|null) => {
        lastEmittedResponse = emittedItem;
        emittedResponseCount++;
    });

    checker.scoreChanged.subscribe((emittedScore: number) => {
      lastEmittedScore = emittedScore;
      emittedScoreCount++;
    });

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       expect(checker.analyzeCommentResponse).toBe(null);
       expect(checker.statusWidget.isLoading).toBe(true);
       connection.mockRespond(
         new Response(
           new ResponseOptions({
              body: mockResponse
           })
         )
       );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         // Checks that the response is received and stored.
         expect(checker.analyzeCommentResponse).not.toBe(null);
         expect(checker.analyzeCommentResponse).toEqual(mockResponse);

         // Checks that the response was emitted.
         expect(lastEmittedResponse).toEqual(mockResponse);
         expect(emittedResponseCount).toEqual(1);

         // Checks that the score was emitted.
         expect(lastEmittedScore).toEqual(mockScore);
         expect(emittedScoreCount).toEqual(1);

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
  }));

  it('Should handle analyze comment error, external config', async(() => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentExternalConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       expect(checker.analyzeCommentResponse).toBe(null);
       expect(checker.statusWidget.isLoading).toBe(true);

       connection.mockError(new Error('error'));

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();
         // Checks that the error message is displayed.
         expect(checker.analyzeCommentResponse).toBe(null);
         expect(fixture.nativeElement.textContent).toContain('Error');

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
  }));

  it('Should handle analyze comment error, demo config', async(() => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentDemoConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       expect(checker.analyzeCommentResponse).toBe(null);
       expect(checker.statusWidget.isLoading).toBe(true);

       connection.mockError(new Error('error'));

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();
         // Checks that the error message is displayed.
         expect(checker.analyzeCommentResponse).toBe(null);
         expect(fixture.nativeElement.textContent).toContain('Error');

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
  }));

  it('Should not make duplicate analyze comment requests', async(() => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentDemoConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let mockResponse: AnalyzeCommentResponse =
      getMockCheckerResponse(checker.getToken(queryText));

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    let requestCounter = 0;

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       expect(checker.analyzeCommentResponse).toBe(null);
       expect(checker.statusWidget.isLoading).toBe(true);

       requestCounter++;

       if (requestCounter > 1) {
         fail('A duplicate analyze request was made');
       }

       connection.mockRespond(
         new Response(
           new ResponseOptions({
              body: mockResponse
           })
         )
       );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         // Checks that the response is received and stored.
         expect(checker.analyzeCommentResponse).not.toBe(null);
         expect(checker.analyzeCommentResponse).toEqual(mockResponse);

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);

         // Send another input event. This should not trigger another analyze
         // call since the text is the same.
         setTextAndFireInputEvent(queryText, textArea);
       });
    });

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
  }));

  it('Should update UI for sending score feedback, external config', (done: Function) => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentExternalConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;

    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    let queryText = 'Your mother was a hamster';

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] =
      getMockCheckerResponse(checker.getToken(queryText));
    mockResponses[suggestScoreUrl] = {
      clientToken: "token"
    };

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       lastRequestUrl = connection.request.url;
       if (lastRequestUrl === suggestScoreUrl) {
         fixture.detectChanges();
         expect(fixture.nativeElement.textContent).toContain('Sending');
       } else if (lastRequestUrl === checkUrl) {
         expect(checker.statusWidget.isLoading).toBe(true);
       }
       connection.mockRespond(
          new Response(
            new ResponseOptions({
              body: mockResponses[connection.request.url]
            })
          )
        );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();
         if (lastRequestUrl === checkUrl) {
           // Checks that loading has stopped.
           expect(checker.statusWidget.isLoading).toBe(false);

           // Submit feedback after the check has completed.

           // Open the info details.
           let infoButtonDetailsHidden = document.getElementById('infoButton');
           sendClickEvent(infoButtonDetailsHidden);
           // Wait for UI update after click event.
           fixture.whenStable().then(() => {
             fixture.detectChanges();
             expect(fixture.nativeElement.textContent).toContain('Seem wrong?');

             // Click the 'Seem wrong?' button
             sendClickEvent(document.getElementById('seemWrongButton'));

             // Wait for the UI to update, then click the 'Yes' button
             fixture.whenStable().then(() => {
               fixture.detectChanges();
               expect(fixture.nativeElement.textContent).toContain('Is this text toxic?');
               sendClickEvent(document.getElementById('yesButtonExternalConfig'));
             });
           });
         }
         if (lastRequestUrl === suggestScoreUrl) {
           // Confirm the UI state after feedback is submitted.
           fixture.detectChanges();
           expect(fixture.nativeElement.textContent).not.toContain('Sending');
           expect(fixture.nativeElement.textContent).toContain('Thanks');
           mockBackend.verifyNoPendingRequests();
           // Use done in this test case to make sure the suggestScoreUrl gets
           // called and the test gest to this point.
           done();
         }
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
  });

  it('Should update UI for sending score feedback, demo config ', (done: Function) => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentDemoConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;

    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    let queryText = 'Your mother was a hamster';

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] =
      getMockCheckerResponse(checker.getToken(queryText));
    mockResponses[suggestScoreUrl] = {
      clientToken: "token"
    };

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       lastRequestUrl = connection.request.url;
       if (lastRequestUrl === suggestScoreUrl) {
         fixture.detectChanges();
         // The yes and no buttons should have disappeared while the request is
         // in progress.
         expect(fixture.nativeElement.textContent).not.toContain('Yes');
         expect(fixture.nativeElement.textContent).not.toContain('No');
       } else if (lastRequestUrl === checkUrl) {
         expect(checker.statusWidget.isLoading).toBe(true);
       }
       connection.mockRespond(
          new Response(
            new ResponseOptions({
              body: mockResponses[connection.request.url]
            })
          )
        );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();
         if (lastRequestUrl === checkUrl) {
           // Checks that loading has stopped.
           expect(checker.statusWidget.isLoading).toBe(false);

           // Submit feedback after the check has completed.

           // Open the info details.
           let seemWrongButton = document.getElementById('seemWrongButtonDemoConfig');
           sendClickEvent(seemWrongButton);

           // Wait for UI update after clicking the seems wrong button.
           fixture.whenStable().then(() => {
             fixture.detectChanges();
             // Press the yes button
             sendClickEvent(document.getElementById('yesButtonDemoConfig'));
           });
         }
         if (lastRequestUrl === suggestScoreUrl) {
           // Confirm the UI state after feedback is submitted.
           fixture.detectChanges();
           expect(fixture.nativeElement.textContent).not.toContain('Sending');
           expect(fixture.nativeElement.textContent).toContain('Thanks');
           mockBackend.verifyNoPendingRequests();
           // Use done in this test case to make sure the suggestScoreUrl gets
           // called and the test gets to this point.
           done();
         }
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
  });

  it('Should not make suggest score request after text has been cleared, external config',
     async(() => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentExternalConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;

    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    let queryText = 'Your mother was a hamster';
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] =
      getMockCheckerResponse(checker.getToken(queryText));
    mockResponses[suggestScoreUrl] = {
      clientToken: "token"
    };

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       lastRequestUrl = connection.request.url;
       if (lastRequestUrl === suggestScoreUrl) {
         fail('A suggest score request was made');
       } else if (lastRequestUrl === checkUrl) {
         expect(checker.statusWidget.isLoading).toBe(true);
       }
       connection.mockRespond(
          new Response(
            new ResponseOptions({
              body: mockResponses[connection.request.url]
            })
          )
        );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);

         if (lastRequestUrl === checkUrl) {
           if (textArea.value === queryText) {
             // 2) After the first check completes, send an event that the
             // textbox has been cleared.

             // Open the info details.
             let infoButtonDetailsHidden = document.getElementById('infoButton');
             sendClickEvent(infoButtonDetailsHidden);
             fixture.whenStable().then(() => {
               fixture.detectChanges();
               // Seem wrong button should be displayed.
               expect(fixture.nativeElement.textContent).toContain('Seem wrong?');

               // Clear the text box.
               setTextAndFireInputEvent('', textArea);

             });
           } else if (textArea.value === '') {
             // 3) Try to leave feedback for the empty string.

             // Open the info details.
             let infoButtonDetailsHidden = document.getElementById('infoButton');
             sendClickEvent(infoButtonDetailsHidden);
             fixture.whenStable().then(() => {
               fixture.detectChanges();
               // Sanity check -- seems wrong button should not be displayed.
               expect(fixture.nativeElement.textContent).not.toContain('Seem wrong?');

               // Try to submit feedback anyway, to make sure it does not go
               // through. This state should not be possible but we want to
               // guard against it.
               let commentFeedback: CommentFeedback = {
                 commentMarkedAsToxic: true
               };
               checker.onCommentFeedbackReceived(commentFeedback);
             });
           }
         }
       });
     });

    // 1) Fire an event to trigger a check request.
    setTextAndFireInputEvent(queryText, textArea);
  }));

  it('Should not make suggest score request after text has been cleared, demo config',
     async(() => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentDemoConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;

    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    let queryText = 'Your mother was a hamster';
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] =
      getMockCheckerResponse(checker.getToken(queryText));
    mockResponses[suggestScoreUrl] = {
      clientToken: "token"
    };

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       lastRequestUrl = connection.request.url;
       if (lastRequestUrl === suggestScoreUrl) {
         fail('A suggest score request was made');
       } else if (lastRequestUrl === checkUrl) {
         expect(checker.statusWidget.isLoading).toBe(true);
       }
       connection.mockRespond(
          new Response(
            new ResponseOptions({
              body: mockResponses[connection.request.url]
            })
          )
        );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);

         if (lastRequestUrl === checkUrl) {
           if (textArea.value === queryText) {
             fixture.whenStable().then(() => {
               fixture.detectChanges();

               // Seem wrong button should be displayed.
               expect(fixture.nativeElement.textContent).toContain('Seem wrong?');

               // 2) After the first check completes, send an event that the
               // textbox has been cleared.
               setTextAndFireInputEvent('', textArea);
             });
           } else if (textArea.value === '') {
             fixture.detectChanges();
             // Sanity check -- seems wrong button should not be displayed.
             expect(fixture.nativeElement.textContent).not.toContain('Seem wrong?');

             // 3) Try to leave feedback for the empty string anyway, to make sure it
             // does not go through. This state should not be possible but we
             // want to guard against it.
             let commentFeedback: CommentFeedback = {
               commentMarkedAsToxic: true
             };
             checker.onCommentFeedbackReceived(commentFeedback);
           }
         }
       });
     });

    // 1) Fire an event to trigger a check request.
    setTextAndFireInputEvent(queryText, textArea);
  }));

  it('Handles feedback error', ((done: Function) => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentExternalConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;

    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    let queryText = 'Your mother was a hamster';

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] =
      getMockCheckerResponse(checker.getToken(queryText));

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       lastRequestUrl = connection.request.url;
       if (lastRequestUrl === suggestScoreUrl) {
         fixture.detectChanges();
         expect(fixture.nativeElement.textContent).toContain('Sending');
         connection.mockError(new Error('error'));
       } else if (lastRequestUrl === checkUrl) {
         expect(checker.statusWidget.isLoading).toBe(true);
         connection.mockRespond(
            new Response(
              new ResponseOptions({
                body: mockResponses[connection.request.url]
              })
            )
          );
       }

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();
         if (lastRequestUrl === checkUrl) {
           // Checks that loading has stopped.
           expect(checker.statusWidget.isLoading).toBe(false);

           // Submit feedback after the check has completed.

           // Open the info details.
           let infoButtonDetailsHidden = document.getElementById('infoButton');
           sendClickEvent(infoButtonDetailsHidden);
           fixture.whenStable().then(() => {
             fixture.detectChanges();
             let commentFeedback: CommentFeedback = {
               commentMarkedAsToxic: true
             };
             checker.onCommentFeedbackReceived(commentFeedback);
           });
         } else if (lastRequestUrl === suggestScoreUrl) {
           // Confirm the UI state after feedback is submitted.
           expect(fixture.nativeElement.textContent).not.toContain('Sending');
           expect(fixture.nativeElement.textContent).not.toContain('?');
           expect(fixture.nativeElement.textContent).not.toContain('Yes');
           expect(fixture.nativeElement.textContent).not.toContain('No');
           expect(fixture.nativeElement.textContent).not.toContain('Thanks');
           expect(fixture.nativeElement.textContent).toContain('Error');
           done();
         }
       });
     });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
  }));

  xit('Should handle manual check', async(() => {
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentExternalConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let mockResponse: AnalyzeCommentResponse =
      getMockCheckerResponse(checker.getToken(queryText));

    // Checks that the response is emitted.
    checker.analyzeCommentResponseChanged.subscribe(
      (emittedItem: AnalyzeCommentResponse|null) => {
        expect(emittedItem).toEqual(mockResponse);
    });

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       expect(checker.analyzeCommentResponse).toBe(null);
       expect(checker.statusWidget.isLoading).toBe(true);
       connection.mockRespond(
         new Response(
           new ResponseOptions({
              body: mockResponse
           })
         )
       );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         // Checks that the response is received and stored.
         expect(checker.analyzeCommentResponse).not.toBe(null);
         expect(checker.analyzeCommentResponse).toEqual(mockResponse);

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);
       });
    });

    checker.checkText(queryText);
  }));

  it('Should handle UI layer changes, external config', (done: Function) => {
    // Note: This test doesn't test error case UI, since that is handled in
    // other tests.
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentExternalConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';
    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    // Set a flag to make sure the check request happens before the suggest
    // score request in the test, since we call done() in the suggest score
    // request handling.
    let checkRequestUICheckFinished = false;

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] = getMockCheckerResponse(checker.getToken(queryText));
    mockResponses[suggestScoreUrl] = {
      clientToken: "token"
    };

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       lastRequestUrl = connection.request.url;
       if (lastRequestUrl === suggestScoreUrl) {
         fixture.detectChanges();
         expect(fixture.nativeElement.textContent).toContain('Sending');
       } else if (lastRequestUrl === checkUrl) {
         expect(checker.statusWidget.isLoading).toBe(true);
       }
       connection.mockRespond(
         new Response(
            new ResponseOptions({
              body: mockResponses[connection.request.url]
            })
         )
       );

       fixture.whenStable().then(() => {
         fixture.detectChanges();
         let layer1TextElements = ['perceived as toxic'];
         let layer1VisibleElementIds = ['infoButton'];
         let layer1HiddenElementIds = ['cancelButton'];
         let layer2TextElements = [
           'Scored',
           '%',
           'by the Perspective "Toxicity" analyzer',
           'Seem wrong?',
         ];
         let layer2VisibleElementIds = ['cancelButton'];
         let layer2HiddenElementIds = ['infoButton'];
         if (lastRequestUrl === checkUrl) {
           // Step 2: Check layer 1 UI.
           for (let text of layer1TextElements) {
             expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
           }
           for (let elementId of layer1VisibleElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(true);
           }
           for (let elementId of layer1HiddenElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(false);
           }

           // Step 3: Click on the more info button.
           let infoButton = document.getElementById('infoButton');
           sendClickEvent(infoButton);

           fixture.whenStable().then(() => {
             // Step 4: Check layer 2 UI.
             fixture.detectChanges();
             for (let text of layer2TextElements) {
               expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
             }

             for (let elementId of layer2VisibleElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(true);
             }
             for (let elementId of layer2HiddenElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(false);
             }

             // Step 5: Click the cancel button to return to layer 1.
             let cancelButton = document.getElementById('cancelButton');
             sendClickEvent(cancelButton);

             // Step 6: Check layer 1 UI again.
             fixture.whenStable().then(() => {
               fixture.detectChanges();
               for (let text of layer1TextElements) {
                 expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
               }
               for (let elementId of layer1VisibleElementIds) {
                 expect(getIsElementWithIdVisible(elementId)).toBe(true);
               }
               for (let elementId of layer1HiddenElementIds) {
                 expect(getIsElementWithIdVisible(elementId)).toBe(false);
               }

               // Step 7: Click the info button to move to layer 2 again.
               let infoButton = document.getElementById('infoButton');
               sendClickEvent(infoButton);

               // Step 8: Click the 'Seem wrong?' button.
               fixture.whenStable().then(() => {
                 fixture.detectChanges();
                 sendClickEvent(document.getElementById('seemWrongButton'));

                 // Step 9: Click the yes button to send feedback.
                 fixture.whenStable().then(() => {
                   fixture.detectChanges();
                   checkRequestUICheckFinished = true;
                   sendClickEvent(document.getElementById('yesButtonExternalConfig'));

                 });
               });
             });
           });
         }
         if (lastRequestUrl === suggestScoreUrl) {
           // Step 9: Check the updated layer 2 UI after feedback submission is
           // complete.
           layer2TextElements.splice(layer2TextElements.indexOf('Seem wrong?'), 1);
           layer2TextElements.push('Thanks for the feedback!');
           for (let text of layer2TextElements) {
             expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
           }
           for (let elementId of layer2VisibleElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(true);
           }
           for (let elementId of layer2HiddenElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(false);
           }

           // Step 10: Press the cancel button to return to layer 1.
           let cancelButton = document.getElementById('cancelButton');
           sendClickEvent(cancelButton);

           // Step 11: Check the layer 1 UI again.
           fixture.whenStable().then(() => {
             fixture.detectChanges();
             for (let text of layer1TextElements) {
               expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
             }
             for (let elementId of layer1VisibleElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(true);
             }
             for (let elementId of layer1HiddenElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(false);
             }
             expect(checkRequestUICheckFinished).toBe(true);
             done();
           });
         }
       });
     });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Step 1: Send an input event to trigger the check call.
    setTextAndFireInputEvent(queryText, textArea);
  });

  it('Should handle UI layer changes, demo config', (done: Function) => {
    // Note: This test doesn't test error case UI, since that is handled in
    // other tests.
    let fixture = TestBed.createComponent(ConvaiCheckerTestComponentDemoConfig);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';
    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    // Set a flag to make sure the check request happens before the suggest
    // score request in the test, since we call done() in the suggest score
    // request handling.
    let checkRequestUICheckFinished = false;

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] = getMockCheckerResponse(checker.getToken(queryText));
    mockResponses[suggestScoreUrl] = {
      clientToken: "token"
    };

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       lastRequestUrl = connection.request.url;
       if (lastRequestUrl === suggestScoreUrl) {
         fixture.detectChanges();
         expect(fixture.nativeElement.textContent).not.toContain('Yes');
         expect(fixture.nativeElement.textContent).not.toContain('No');
       } else if (lastRequestUrl === checkUrl) {
         expect(checker.statusWidget.isLoading).toBe(true);
       }
       connection.mockRespond(
         new Response(
            new ResponseOptions({
              body: mockResponses[connection.request.url]
            })
         )
       );

       fixture.whenStable().then(() => {
         fixture.detectChanges();
         let layer1TextElements = [
           'perceived as toxic',
           'SEEM WRONG?'
         ];
         let layer1VisibleElementIds = ['layer1', 'seemWrongButtonDemoConfig'];
         let layer1HiddenElementIds = ['layer2', 'layer3'];
         let layer2TextElements = [
           'Is this comment toxic?',
           'YES',
           'NO',
         ];
         let layer2VisibleElementIds = ['layer2', 'yesButtonDemoConfig', 'noButtonDemoConfig'];
         let layer2HiddenElementIds = ['layer1', 'layer3'];
         let layer3TextElements = [
           'Thanks for your feedback!',
         ];
         let layer3VisibleElementIds = ['layer3', 'feedbackThanksDemoConfig'];
         let layer3HiddenElementIds = ['layer1', 'layer2'];

         if (lastRequestUrl === checkUrl) {
           // Step 2: Check layer 1 UI.
           for (let text of layer1TextElements) {
             expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
           }
           for (let elementId of layer1VisibleElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(true);
           }
           for (let elementId of layer1HiddenElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(false);
           }

           // Step 3: Click the seem wrong button.
           let seemWrongButton = document.getElementById('seemWrongButtonDemoConfig');
           sendClickEvent(seemWrongButton);

           fixture.whenStable().then(() => {
             // Step 4: Check layer 2 UI.
             fixture.detectChanges();
             for (let text of layer2TextElements) {
               expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
             }
             for (let elementId of layer2VisibleElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(true);
             }
             for (let elementId of layer2HiddenElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(false);
             }

             checkRequestUICheckFinished = true;

             // Step 5: Send feedback by pressing the yes button to move to layer 3.
             sendClickEvent(document.getElementById('yesButtonDemoConfig'));
           });
         }
         if (lastRequestUrl === suggestScoreUrl) {
           // Step 6: Check layer 3 UI.
           for (let text of layer3TextElements) {
             expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
           }
           for (let elementId of layer3VisibleElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(true);
           }
           for (let elementId of layer3HiddenElementIds) {
             expect(getIsElementWithIdVisible(elementId)).toBe(false);
           }

           // Step 7: Return to layer 1 and check UI again.
           let thanksButton = document.getElementById('thanksForFeedbackButtonDemoConfig');
           sendClickEvent(thanksButton);

           fixture.whenStable().then(() => {
             fixture.detectChanges();
             for (let text of layer1TextElements) {
               expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
             }
             for (let elementId of layer1VisibleElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(true);
             }
             for (let elementId of layer1HiddenElementIds) {
               expect(getIsElementWithIdVisible(elementId)).toBe(false);
             }

             expect(checkRequestUICheckFinished).toBe(true);
             done();
           });
         }
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Step 1: Send an input event to trigger the check call.
    setTextAndFireInputEvent(queryText, textArea);
  });

  it('Test loading icon visibility with setting hideLoadingIconAfterLoad', async(() => {
    let fixture = TestBed.createComponent(
      ConvaiCheckerTestComponentHideLoadingIconAfterLoadSetting);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let mockResponses = [
      getMockCheckerResponseWithScore(0.2, checker.getToken(queryTexts[0])),
      getMockCheckerResponseWithScore(0.5, checker.getToken(queryTexts[1])),
      getMockCheckerResponseWithScore(0.2, checker.getToken(queryTexts[2]))
    ];

    let callCount = 0;

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       fixture.detectChanges();
       expect(getIsElementWithIdVisible('statusWidget')).toBe(true);
       expect(checker.statusWidget.isLoading).toBe(true);
       connection.mockRespond(
         new Response(
           new ResponseOptions({
              body: mockResponses[callCount]
           })
         )
       );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);
         expect(getIsElementWithIdVisible('statusWidget')).toBe(false);
         if (callCount < 2) {
           callCount++;

           setTextAndFireInputEvent('', textArea);

           // Checks that clearing the textbox hides the status widget.
           fixture.whenStable().then(() => {
             fixture.detectChanges();
             expect(getIsElementWithIdVisible('statusWidget')).toBe(false);

             // Fire another request.
             setTextAndFireInputEvent(queryTexts[callCount], textArea);
           });
         }
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryTexts[callCount], textArea);
  }));

  it('Test loading icon visibility with setting hideLoadingIconForScoresBelowMinThreshold',
     async(() => {
    let fixture = TestBed.createComponent(
      ConvaiCheckerTestComponentHideLoadingIconForScoresBelowThresholdSetting);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let callCount = 0;
    let mockResponses = [
      getMockCheckerResponseWithScore(0.2, checker.getToken(queryTexts[0])),
      getMockCheckerResponseWithScore(0.5, checker.getToken(queryTexts[1])),
      getMockCheckerResponseWithScore(0.2, checker.getToken(queryTexts[2]))
    ];

    let mockBackend = TestBed.get(MockBackend);
    mockBackend.connections
     .subscribe((connection: MockConnection) => {
       fixture.detectChanges();
       expect(getIsElementWithIdVisible('statusWidget')).toBe(false);
       expect(checker.statusWidget.isLoading).toBe(true);
       connection.mockRespond(
         new Response(
           new ResponseOptions({
              body: mockResponses[callCount]
           })
         )
       );

       // Wait for async code to complete.
       fixture.whenStable().then(() => {
         fixture.detectChanges();

         // Checks that loading has stopped.
         expect(checker.statusWidget.isLoading).toBe(false);

         let statusWidgetVisible = getIsElementWithIdVisible('statusWidget');
         // The first and fourth responses (indices 0 and 2) have a score below
         // the min threshold, so the loading widget should only be visible for
         // the second one (index 1).
         expect(statusWidgetVisible).toBe(callCount === 1);

         if (callCount < 2) {
           callCount++;

           setTextAndFireInputEvent('', textArea);

           // Checks that clearing the textbox hides the status widget.
           fixture.whenStable().then(() => {
             console.log('Checking clearing');
             fixture.detectChanges();
             statusWidgetVisible = getIsElementWithIdVisible('statusWidget');
             console.log('Callcount=', callCount);
             console.log('statusWidgetVisible=', statusWidgetVisible);
             expect(statusWidgetVisible).toBe(false);

             // Fire another request.
             setTextAndFireInputEvent(queryTexts[callCount], textArea);
           });
         }
       });
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryTexts[callCount], textArea);
  }));
});
