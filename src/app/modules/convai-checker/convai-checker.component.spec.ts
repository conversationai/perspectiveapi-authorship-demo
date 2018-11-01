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
  ComponentFixture,
  TestBed,
  async,
  fakeAsync,
  tick,
  flush,
  flushMicrotasks,
  getTestBed,
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
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import * as test_components from './test-components';
import { PerspectiveStatus, CommentFeedback, Emoji, LoadingIconStyle, Shape, LAYER_TRANSITION_TIME_SECONDS, FADE_WIDGET_TIME_SECONDS } from './perspective-status.component';
import { ConvaiChecker, REQUEST_LIMIT_MS, DEFAULT_DEMO_SETTINGS, DemoSettings } from './convai-checker.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { AnalyzeCommentResponse } from './perspectiveapi-types';
import { take } from 'rxjs/operators'; 
import * as d3 from 'd3-color';

let getMockCheckerResponse = function(score: number, token?: string):
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

let getIsElementWithIdVisible = function(id: string): boolean {
  let element = document.getElementById(id);
  return element != null && element.offsetWidth > 0 && element.offsetHeight > 0
      && window.getComputedStyle(element).display !== 'none'
      && getElementOpacity(id) > 0;
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
  return JSON.parse(JSON.stringify(DEFAULT_DEMO_SETTINGS));
}

function getNormalizedInnerText(element: HTMLElement) {
  return element.innerText.replace(/\s+/g, ' ');
}

function getElementOpacity(id: string): number {
  let element = document.getElementById(id);
  return parseFloat(window.getComputedStyle(element).getPropertyValue("opacity"));
}

function waitForTimeout(ms: number): Promise<void> {
  return new Promise((re, rj) => {
    setTimeout(() => { re(); }, ms);
  });
}

describe('Convai checker test', () => {
  const ORIGINAL_TIMEOUT = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  const INCREASED_TIMEOUT_IN_MS = 25000;

  let injector: TestBed;
  let service: PerspectiveApiService;
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<test_components.ConvaiCheckerCustomDemoSettings>;
  let checker: ConvaiChecker;

  /** Set up the test bed */
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PerspectiveStatus,
        test_components.ConvaiCheckerInvalidInput,
        test_components.ConvaiCheckerNoDemoSettings,
        test_components.ConvaiCheckerNoInput,
        test_components.ConvaiCheckerCustomDemoSettings,
        test_components.ConvaiCheckerWithAttributeInput,
        test_components.ConvaiCheckerCustomDemoSettings,
        test_components.ConvaiCheckerJsonDemoSettings,
        ConvaiChecker
      ],
      imports: [HttpClientTestingModule],
      providers: [PerspectiveApiService],
    });

    injector = getTestBed();
    service = injector.get(PerspectiveApiService);
    httpMock = injector.get(HttpTestingController);

    TestBed.compileComponents();

    // Because of the animation involved, many tests take longer than usual. So
    // we increase the timeout.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = INCREASED_TIMEOUT_IN_MS;
  }));

  afterEach(() => {
    // Make sure there are no more outstanding HTTP requests.
    httpMock.verify();
    // Return to normal timeout.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = ORIGINAL_TIMEOUT;
  });

  it('Test loading icon visibility with setting hideLoadingIconAfterLoad, js async', async () => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.hideLoadingIconAfterLoad = true;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
    ];

    let mockResponses = [
      getMockCheckerResponse(0.2, queryTexts[0]),
    ];

    let textArea = fixture.debugElement.query(
    By.css('#' + checker.inputId)).nativeElement;


    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryTexts[0], textArea);

    await waitForTimeout(REQUEST_LIMIT_MS);

    const mockReq = httpMock.expectOne('test-url/check');
    fixture.detectChanges();
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(true);
    expect(checker.statusWidget.isLoading).toBe(true);

    mockReq.flush(mockResponses[0]);

    // TODO: This test passes, but it requires awaiting two sequential
    // promises...the nice thing about the async wrapper is that it waits for
    // all async tasks for you.
    await checker.statusWidget.animationPromise;
    await checker.statusWidget.animationPromise;

    fixture.detectChanges();

    // Checks that loading has stopped.
    expect(checker.statusWidget.isLoading).toBe(false);
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);

    setTextAndFireInputEvent('', textArea);

    await checker.statusWidget.animationPromise;
    // Checks that clearing the textbox hides the status widget.
    fixture.detectChanges();
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);
  });

  it('Test loading icon visibility with setting hideLoadingIconAfterLoad, js async and angular async', async(async () => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.hideLoadingIconAfterLoad = true;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
    ];

    let mockResponses = [
      getMockCheckerResponse(0.2, queryTexts[0]),
    ];

    let textArea = fixture.debugElement.query(
    By.css('#' + checker.inputId)).nativeElement;


    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryTexts[0], textArea);

    await fixture.whenStable();
    fixture.detectChanges();

    const mockReq = httpMock.expectOne('test-url/check');
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(true);
    expect(checker.statusWidget.isLoading).toBe(true);

    mockReq.flush(mockResponses[0]);

    await checker.statusWidget.animationPromise;
    await checker.statusWidget.animationPromise;

    // TODO: This test appears to pass, but the test actually completes before
    // we get to the expect below--see console logs.
    // Checks that loading has stopped.
    expect(checker.statusWidget.isLoading).toBe(false);
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);

    setTextAndFireInputEvent('', textArea);

    await checker.statusWidget.animationPromise;
    // Checks that clearing the textbox hides the status widget.
    fixture.detectChanges();
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);
  }));

  it('Test loading icon visibility with setting hideLoadingIconAfterLoad, angular async', async(() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.hideLoadingIconAfterLoad = true;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
    ];

    let mockResponses = [
      getMockCheckerResponse(0.2, queryTexts[0]),
    ];

    let textArea = fixture.debugElement.query(
    By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryTexts[0], textArea);

    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const mockReq = httpMock.expectOne('test-url/check');
      expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(true);
      expect(checker.statusWidget.isLoading).toBe(true);

      mockReq.flush(mockResponses[0]);

      fixture.whenStable().then(() => {
        fixture.detectChanges();

        // Checks that loading has stopped.
        expect(checker.statusWidget.isLoading).toBe(false);

        // TODO: This fails here, where it didn't in the version of the test
        // with MockBackend. It looks like fixture.whenStable() no longer waits
        // correctly? Or maybe there was a coincidence that was causing it to
        // wait previously.
        expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);

        setTextAndFireInputEvent('', textArea);

        fixture.whenStable().then(() => {
          fixture.detectChanges();
          // Checks that clearing the textbox hides the status widget.
          expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);
        });
      });
    });
  }));

  it('Test loading icon visibility with setting hideLoadingIconAfterLoad, fake async', fakeAsync(() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.hideLoadingIconAfterLoad = true;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
    ];

    let mockResponses = [
      getMockCheckerResponse(0.2, queryTexts[0]),
    ];

    let textArea = fixture.debugElement.query(
    By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryTexts[0], textArea);
    tick(REQUEST_LIMIT_MS);

    const mockReq = httpMock.expectOne('test-url/check');
    fixture.detectChanges();
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(true);
    expect(checker.statusWidget.isLoading).toBe(true);

    mockReq.flush(mockResponses[0]);
    // This fails even if I tick ahead the amount of time for the animation,
    // because zone.js doesn't know about the greensock animation library.
    tick();
    tick(5000);

    fixture.detectChanges();

    // Checks that loading has stopped.
    expect(checker.statusWidget.isLoading).toBe(false);
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);

    setTextAndFireInputEvent('', textArea);

    tick();
    // Checks that clearing the textbox hides the status widget.
    fixture.detectChanges();
    expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);
  }));
});
