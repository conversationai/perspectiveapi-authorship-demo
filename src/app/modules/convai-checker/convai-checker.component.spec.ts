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

let getElementXTranslation = function(id: string): number|null {
  let element = document.getElementById(id);
  if (!element) {
    return null;
  }
  let transform = window.getComputedStyle(element).getPropertyValue("transform");
  if (transform === 'none') {
    // There is a bug where sometimes getComputedStyle doesn't recognize the
    // transform, so parse it manually with a regex if this happens.
    let transformIndex = element.outerHTML.search('matrix');
    if (transformIndex > 0) {
      transform = /matrix\(.+\)/g.exec(element.outerHTML)[0];
    } else {
      return 0;
    }
  }
  // A transform looks like matrix(a, b, c, d, tx, ty). We want tx.
  return parseFloat(transform.split(',')[4]);
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

function verifyLoadingWidgetHasShape(checker: ConvaiChecker, expectedShape: Shape) {
  let shape = checker.statusWidget.currentShape;
  expect(shape).toEqual(expectedShape);
}

function verifyLoadingWidgetHasEmoji(checker: ConvaiChecker, expectedEmoji: Emoji) {
  let smileEmojiVisible = getIsElementWithIdVisible('smileEmoji');
  let neutralEmojiVisible = getIsElementWithIdVisible('neutralEmoji');
  let sadEmojiVisible = getIsElementWithIdVisible('sadEmoji');
  expect(smileEmojiVisible).toBe(expectedEmoji === Emoji.SMILE);
  expect(neutralEmojiVisible).toBe(expectedEmoji === Emoji.NEUTRAL);
  expect(sadEmojiVisible).toBe(expectedEmoji === Emoji.SAD);
}

function verifyCircleSquareDiamondWidgetVisible() {
  // Checks visibility of the loading icons. The circle/square/diamond
  // loading icon should be visible, and the emoji one should not.
  let circleSquareDiamondWidgetVisible =
   getIsElementWithIdVisible('circleSquareDiamondWidget');
  let emojiWidgetVisible =
   getIsElementWithIdVisible('emojiStatusWidget');
  expect(circleSquareDiamondWidgetVisible).toBe(true);
  expect(emojiWidgetVisible).toBe(false);
}

function verifyEmojiWidgetVisible() {
  // Checks visibility of the loading icons. The emoji loading icon should be
  // visible, and the circle/square/diamond one should not.
  let circleSquareDiamondWidgetVisible =
   getIsElementWithIdVisible('circleSquareDiamondWidget');
  let emojiWidgetVisible =
   getIsElementWithIdVisible('emojiStatusWidget');
  expect(circleSquareDiamondWidgetVisible).toBe(false);
  expect(emojiWidgetVisible).toBe(true);
}

function getElementOpacity(id: string): number {
  let element = document.getElementById(id);
  return parseFloat(window.getComputedStyle(element).getPropertyValue("opacity"));
}

function verifyEmojiIconsInDomWithZeroOpacity() {
  expect(getElementOpacity('smileEmoji')).toEqual(0);
  expect(getElementOpacity('neutralEmoji')).toEqual(0);
  expect(getElementOpacity('sadEmoji')).toEqual(0);
}

function waitForTimeout(ms: number): Promise<void> {
  return new Promise((re, rj) => {
    setTimeout(() => { re(); }, ms);
  });
}


// Checks that the transitions between UI layers (score information, feedback
// prompt, and feedback thanks) behave correctly during user interaction with
// the demo.
// TODO(rachelrosen): Refactor this into smaller functions.
async function verifyLayerTransitionsWorkForDemoSiteConfig(
    fixture: ComponentFixture<test_components.ConvaiCheckerCustomDemoSettings>,
    httpMock: HttpTestingController) {
  // Note: This test doesn't test error case UI, since that is handled in
  // other tests.
  let checker = fixture.componentInstance.checker;
  let queryText = 'Your mother was a hamster';
  let checkUrl = 'test-url/check';
  let suggestScoreUrl = 'test-url/suggest_score';
  let lastRequestUrl = '';

  const layer1TextElements = [
    'perceived as toxic',
    'SEEM WRONG?'
  ];
  const layer1VisibleElementIds = ['layer1', 'seemWrongButtonDemoConfig'];
  const layer1HiddenElementIds = ['layer2', 'layer3'];
  const layer2TextElements = [
    'Is this comment toxic?',
    'YES',
    'NO',
  ];
  const layer2VisibleElementIds = ['layer2', 'yesButtonDemoConfig', 'noButtonDemoConfig'];
  const layer2HiddenElementIds = ['layer1', 'layer3'];
  const layer3TextElements = [
    'Thanks for your feedback!',
  ];
  const layer3VisibleElementIds = ['layer3', 'feedbackThanksDemoConfig'];
  const layer3HiddenElementIds = ['layer1', 'layer2'];

  const textArea = fixture.debugElement.query(
    By.css('#' + checker.inputId)).nativeElement;

  // Step 1: Send an input event to trigger the check call.
  setTextAndFireInputEvent(queryText, textArea);

  await waitForTimeout(REQUEST_LIMIT_MS);

  const mockReq = httpMock.expectOne('test-url/check');
  expect(checker.statusWidget.isLoading).toBe(true);

  mockReq.flush(getMockCheckerResponse(0.5, queryText));
  fixture.detectChanges();

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
  const seemWrongButton = document.getElementById('seemWrongButtonDemoConfig');
  sendClickEvent(seemWrongButton);
  await checker.statusWidget.animationPromise;
  fixture.detectChanges();

  // Step 4: Check layer 2 UI.
  for (let text of layer2TextElements) {
    expect(getNormalizedInnerText(fixture.nativeElement)).toContain(text);
  }
  for (let elementId of layer2VisibleElementIds) {
    expect(getIsElementWithIdVisible(elementId)).toBe(true);
  }
  for (let elementId of layer2HiddenElementIds) {
    expect(getIsElementWithIdVisible(elementId)).toBe(false);
  }

  // Step 5: Send feedback by pressing the yes button to move to layer 3.
  sendClickEvent(document.getElementById('yesButtonDemoConfig'));
  fixture.detectChanges();

  const mockSuggestReq = httpMock.expectOne('test-url/suggest_score');
  expect(fixture.nativeElement.textContent).not.toContain('Yes');
  expect(fixture.nativeElement.textContent).not.toContain('No');

  mockSuggestReq.flush({clientToken: "token"});
  await checker.statusWidget.animationPromise;
  fixture.detectChanges();

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
  await checker.statusWidget.animationPromise;
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
}

// Checks that colors are almost equal within some distance margin in the rgb
// colorspace to account for floating point calculation errors in the gradient
// calculation.
function verifyColorsAlmostEqual(color1: string, color2: string, maxDistance = 1) {
  let rgb1 = d3.rgb(color1);
  let rgb2 = d3.rgb(color2);
  expect(Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2)
                   + Math.pow(rgb1.g - rgb2.g, 2)
                   + Math.pow(rgb1.b - rgb2.b, 2)))
    .toBeLessThanOrEqual(maxDistance);
}

// Checks that the interpolateColors function provides the correct value at
// gradient control points.
function verifyInterpolateColorsForControlPointsAndGradientColors(
  checker: ConvaiChecker, controlPoints: number[],
  gradientColorsRgb: string[]) {
  console.log(controlPoints);
  console.log(gradientColorsRgb);
  for (let i = 0; i < controlPoints.length; i++) {
    verifyColorsAlmostEqual(
      checker.statusWidget.interpolateColors(controlPoints[i] / 100),
      gradientColorsRgb[i]);
  }
}

// Checks that the loading icon/widget visibility and feedback visibility are
// correct given the settings.
//
// TODO(rachelrosen): If this function is called more than once from within an
// individual test, we get an error: "Connection has already been resolved."
// Investigate why.
async function verifyWidgetVisibilityForDemoSettings(
    fixture: ComponentFixture<test_components.ConvaiCheckerCustomDemoSettings>,
    httpMock: HttpTestingController,
    demoSettings: DemoSettings,
    mockResponseScores: number[],
    expectedWidgetVisibilitiesBeforeLoading: boolean[],
    expectedWidgetVisibilitiesWhileLoading: boolean[],
    expectedWidgetVisibilitiesAfterLoading: boolean[],
    expectedFeedbackTextVisibilitiesAfterLoading: boolean[],
    widgetId = 'circleSquareDiamondWidget',
    textFeedbackElementId = 'layerText') {
  let checker = fixture.componentInstance.checker;
  let textArea = fixture.debugElement.query(
    By.css('#' + checker.inputId)).nativeElement;

  // Set up the mock responses for the series of three requests that will be
  // made in the test.
  let queryTexts = [
    'Your mother was a hamster',
    'Your father smelled of elderberries',
    'What is the air velocity of an unladen swallow?'
  ];
  let expectedFeedbackText = [
    checker.statusWidget.getFeedbackTextForScore(mockResponseScores[0]),
    checker.statusWidget.getFeedbackTextForScore(mockResponseScores[1]),
    checker.statusWidget.getFeedbackTextForScore(mockResponseScores[2]),
  ];

  // Test steps:
  // 1. Update settings
  fixture.componentInstance.setDemoSettings(demoSettings);
  console.log(demoSettings);
  console.log('before loading', expectedWidgetVisibilitiesBeforeLoading);
  console.log('while loading', expectedWidgetVisibilitiesWhileLoading);
  console.log('after loading', expectedWidgetVisibilitiesAfterLoading);
  fixture.detectChanges();
  console.log(checker.statusWidget.scoreThresholds);

  for (let callCount = 0; callCount < mockResponseScores.length; callCount++) {
    console.log('Callcount =', callCount);
    await fixture.whenStable();
    await checker.statusWidget.animationPromise;
    fixture.detectChanges();

    // Check visibility before loading.
    console.log('*********Expectation for visibilities before loading');
    expect(getIsElementWithIdVisible(widgetId))
      .toBe(expectedWidgetVisibilitiesBeforeLoading[callCount]);

    // Run query and check visibility.
    setTextAndFireInputEvent(queryTexts[callCount], textArea);

    await waitForTimeout(REQUEST_LIMIT_MS);

    let mockReq = httpMock.expectOne('test-url/check');
    console.log('*********Expectation for visibilities while loading');
    fixture.detectChanges();
    expect(checker.statusWidget.isLoading).toBe(true);
    expect(getIsElementWithIdVisible(widgetId))
      .toBe(expectedWidgetVisibilitiesWhileLoading[callCount]);

    console.log('Flush');
    mockReq.flush(
      getMockCheckerResponse(mockResponseScores[callCount], queryTexts[callCount]));

    console.log('Before fixture.whenStable');
    await fixture.whenStable();
    //fixture.detectChanges();
    // It is intentional that we wait twice; the animationPromise gets
    // reassigned so it doesn't wait for both animations.
    // TODO: Is there a way to continue the first promise such that this isn't
    // required?
    // Added for all tests:
    //
    // 'Test loading icon visibility, hideLoadingIconForScoresBelowMinThreshold = true, '
    // ' min threshold = 0',
    // Through
    //
    // 'Test loading icon visibility, hideLoadingIconAfterLoad = true, min threshold > 0, emoji icon',
    console.log('******Before animation promise');
    let promiseId = await checker.statusWidget.animationPromise; // Load animation completes
    console.log('******animation ended,****', promiseId);
    let promiseId2 = await checker.statusWidget.animationPromise;
    console.log('******animation ended,****', promiseId2);
    //await fixture.whenStable();
    fixture.detectChanges();

    // Checks that loading has stopped.
    console.log('*********Expectation for visibilities after loading');
    expect(checker.statusWidget.isLoading).toBe(false);
    expect(getIsElementWithIdVisible(widgetId))
      .toBe(expectedWidgetVisibilitiesAfterLoading[callCount]);

    // Checks that if the widget is hidden, its x value in the transform is
    // negative (it translated to the left), and that the text feedback
    // element also translated to the left.
    let widgetXTranslation = getElementXTranslation(widgetId);
    let feedbackTextXTranslation = getElementXTranslation(textFeedbackElementId);
    expect(widgetXTranslation).toEqual(feedbackTextXTranslation);
    if (!expectedWidgetVisibilitiesAfterLoading[callCount]) {
      expect(widgetXTranslation).toBeLessThan(0);
      expect(feedbackTextXTranslation).toBeLessThan(0);
    } else {
      expect(widgetXTranslation).toBe(0);
      expect(feedbackTextXTranslation).toBe(0);
    }

    if (expectedFeedbackTextVisibilitiesAfterLoading[callCount]) {
      expect(getNormalizedInnerText(fixture.nativeElement)).toContain(
        expectedFeedbackText[callCount])
    } else {
      expect(getNormalizedInnerText(fixture.nativeElement)).not.toContain(
        expectedFeedbackText[callCount])
    }
  }
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

  it('should recognize inputs from attributes', async(() => {
    let fixture = TestBed.createComponent(
      test_components.ConvaiCheckerWithAttributeInput);

    let checker = fixture.componentInstance.checker;
    fixture.detectChanges();

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.demoSettings.communityId).toEqual('testCommunityId');
  }));

  it('should recognize inputs from angular input bindings', async(() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.communityId = 'testCommunityId';
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.demoSettings.communityId).toEqual('testCommunityId');
  }));

  it('check default demo settings', async(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerNoDemoSettings);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.demoSettings).toEqual(DEFAULT_DEMO_SETTINGS);

  }));

  it('should default to demo configuration when an invalid configuration is specified', async(() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.configuration = 'foo';
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    expect(checker.serverUrl).toEqual('test-url');
    expect(checker.inputId).toEqual('checkerTextarea');
    expect(checker.statusWidget.configuration).toEqual(
      checker.statusWidget.configurationEnum.DEMO_SITE);

  }));

  it('should show an error if no textarea id is specified', async(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerNoInput);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error');
  }));

  it('should show an error if an invalid textarea id is specified', async(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerInvalidInput);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error');
  }));

  it('Should analyze comment and store and emit response', fakeAsync(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let mockScore = 0.3;
    let mockResponse: AnalyzeCommentResponse =
      getMockCheckerResponse(mockScore, queryText);

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

    // Records when the score is emitted.
    checker.scoreChanged.subscribe((emittedScore: number) => {
      lastEmittedScore = emittedScore;
      emittedScoreCount++;
    });

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);

    tick(REQUEST_LIMIT_MS);

    // Expect a request to have been sent.
    const mockReq = httpMock.expectOne('test-url/check');

    // Once a request is in flight, loading is set to true.
    tick();
    expect(checker.analyzeCommentResponse).toBe(null);
    expect(checker.statusWidget.isLoading).toBe(true);

    // Now we have checked the expectations before the response is sent, we
    // send back the response.
    mockReq.flush(mockResponse);
    tick();

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
  }));

  it('Should handle analyze comment error, demo config', fakeAsync(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
    tick(REQUEST_LIMIT_MS);

    const mockReq = httpMock.expectOne('test-url/check');
    expect(checker.analyzeCommentResponse).toBe(null);
    expect(checker.statusWidget.isLoading).toBe(true);

    mockReq.error(new ErrorEvent('Check failed!'));
    tick();

    fixture.detectChanges();
    // Checks that the error message is displayed.
    expect(checker.analyzeCommentResponse).toBe(null);
    expect(fixture.nativeElement.textContent).toContain('Error');

    // Checks that loading has stopped.
    expect(checker.statusWidget.isLoading).toBe(false);
  }));

  it('Should not make duplicate analyze comment requests', fakeAsync(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';

    let mockResponse: AnalyzeCommentResponse = getMockCheckerResponse(0.5, queryText);

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);

    tick(REQUEST_LIMIT_MS);

    // Expect a request to have been sent.
    const mockReq = httpMock.expectOne('test-url/check');

    // Once a request is in flight, loading is set to true.
    tick();
    expect(checker.analyzeCommentResponse).toBe(null);
    expect(checker.statusWidget.isLoading).toBe(true);

    // Now we have checked the expectations before the response is sent, we
    // send back the response.
    mockReq.flush(mockResponse);
    tick();

    // Checks that the response is received and stored.
    expect(checker.analyzeCommentResponse).not.toBe(null);
    expect(checker.analyzeCommentResponse).toEqual(mockResponse);
    expect(checker.statusWidget.isLoading).toBe(false);

    // Send another input event. This should not trigger another analyze
    // call since the text is the same.
    setTextAndFireInputEvent(queryText, textArea);
    tick(REQUEST_LIMIT_MS);
    httpMock.expectNone('test-url/check');
  }));

  it('Should update UI for sending score feedback, demo config ', fakeAsync(() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;
    let queryText = 'Your mother was a hamster';
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);

    tick(REQUEST_LIMIT_MS);

    // Expect a request to have been sent.
    const mockReq = httpMock.expectOne('test-url/check');

    // Once a request is in flight, loading is set to true.
    expect(checker.statusWidget.isLoading).toBe(true);

    // Now we have checked the expectations before the response is sent, we
    // send back the response.
    mockReq.flush(getMockCheckerResponse(0.5, queryText));
    tick();
    fixture.detectChanges();

    // Checks that loading has stopped.
    expect(checker.statusWidget.isLoading).toBe(false);

    // Click the 'Seem wrong?' button
    let seemWrongButton = document.getElementById('seemWrongButtonDemoConfig');
    sendClickEvent(seemWrongButton);

    // Wait for the UI to update, then click the 'Yes' button
    tick();
    fixture.detectChanges();
    sendClickEvent(document.getElementById('yesButtonDemoConfig'));

    const mockSuggestReq = httpMock.expectOne('test-url/suggest_score');

    tick();
    fixture.detectChanges();

    // The yes and no buttons should have disappeared while the request is
    // in progress.
    expect(fixture.nativeElement.textContent).not.toContain('Yes');
    expect(fixture.nativeElement.textContent).not.toContain('No');

    mockSuggestReq.flush({clientToken: "token"});

    tick();
    fixture.detectChanges();

    // Confirm the UI state after feedback is submitted.
    expect(fixture.nativeElement.textContent).toContain('Thanks');

    httpMock.verify();
  }));

  it('Should not make suggest score request after text has been cleared, demo config',
     fakeAsync(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;

    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    let queryText = 'Your mother was a hamster';
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // 1) Fire an event to trigger a check request.
    setTextAndFireInputEvent(queryText, textArea);

    tick(REQUEST_LIMIT_MS);

    const mockReq = httpMock.expectOne('test-url/check');

    expect(checker.statusWidget.isLoading).toBe(true);

    mockReq.flush(getMockCheckerResponse(0.5, queryText))
    tick();
    fixture.detectChanges();

    expect(checker.statusWidget.isLoading).toBe(false);

    // Seem wrong button should be displayed.
    expect(fixture.nativeElement.textContent).toContain('Seem wrong?');

    // 2) After the first check completes, send an event that the
    // textbox has been cleared.
    setTextAndFireInputEvent('', textArea);
    tick(REQUEST_LIMIT_MS);
    httpMock.expectNone('test-url/check');

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

    tick();
    httpMock.expectNone('test-url/suggest_score');
  }));

  it('Handles feedback error', async() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    let checkUrl = 'test-url/check';
    let suggestScoreUrl = 'test-url/suggest_score';
    let lastRequestUrl = '';
    let queryText = 'Your mother was a hamster';

    // Sets up mock responses for the check and suggest score calls.
    let mockResponses: { [key: string]: Object } = {};
    mockResponses[checkUrl] = getMockCheckerResponse(0.5, queryText);

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Send an input event to trigger the service call.
    setTextAndFireInputEvent(queryText, textArea);
    await waitForTimeout(REQUEST_LIMIT_MS);

    let mockReq = httpMock.expectOne('test-url/check');
    expect(checker.statusWidget.isLoading).toBe(true);

    mockReq.flush(getMockCheckerResponse(0.5, queryText));
    fixture.detectChanges();
    await checker.statusWidget.animationPromise;
    expect(checker.statusWidget.isLoading).toBe(false);

    const seemWrongButton = document.getElementById('seemWrongButtonDemoConfig');
    sendClickEvent(seemWrongButton);
    await checker.statusWidget.animationPromise;
    fixture.detectChanges();

    sendClickEvent(document.getElementById('yesButtonDemoConfig'));
    await checker.statusWidget.animationPromise;
    fixture.detectChanges();

    const mockSuggestReq = httpMock.expectOne('test-url/suggest_score');
    expect(fixture.nativeElement.textContent).not.toContain('Yes');
    expect(fixture.nativeElement.textContent).not.toContain('No');
    mockSuggestReq.error(new ErrorEvent('error'));

    fixture.detectChanges();
    await checker.statusWidget.animationPromise;
    expect(fixture.nativeElement.textContent).not.toContain('Thanks');
    expect(fixture.nativeElement.textContent).toContain('Error');
  });

  it('Should handle manual check', fakeAsync(() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    console.log('Should handle manual check');
    const queryText = 'Your mother was a hamster';
    const mockResponseBody = getMockCheckerResponse(0.5, queryText);

    // Keeps track of the emitted response.
    let lastEmittedResponse: AnalyzeCommentResponse|null = null;
    let emittedResponseCount = 0;
    checker.analyzeCommentResponseChanged.subscribe(
      (emittedItem: AnalyzeCommentResponse|null) => {
        lastEmittedResponse = emittedItem;
        emittedResponseCount++;
    });

    // Before a request is sent, isLoading is false.
    expect(checker.analyzeCommentResponse).toBe(null);
    expect(checker.statusWidget.isLoading).toBe(false);

    // Make a request.
    checker.checkText(queryText);
    tick(REQUEST_LIMIT_MS);
    // Expect a request to have been sent.
    const mockReq = httpMock.expectOne('test-url/check');

    // Once a request is in flight, loading is set to true.
    tick();
    expect(checker.analyzeCommentResponse).toBe(null);
    expect(checker.statusWidget.isLoading).toBe(true);

    // Now we have checked the expectations before the response is sent, we
    // send back the response.
    mockReq.flush(mockResponseBody);
    tick();

    // Checks that the response is received and stored.
    expect(checker.analyzeCommentResponse).toEqual(mockResponseBody);
    // Checks that exactly one response is emitted.
    expect(lastEmittedResponse).toEqual(mockResponseBody);
    expect(emittedResponseCount).toEqual(1);
    // make sure that loading has now ended.
    expect(checker.statusWidget.isLoading).toBe(false);
  }));

  it('Should handle UI layer changes, demo config, emoji loading icon style',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    // Configure settings.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();

    await verifyLayerTransitionsWorkForDemoSiteConfig(fixture, httpMock);
  });

  it('Should handle UI layer changes, demo config, circle/square/diamond loading',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;
    await checker.statusWidget.animationPromise;

    await verifyLayerTransitionsWorkForDemoSiteConfig(fixture, httpMock);
  });

  it('Test loading icon visibility with setting hideLoadingIconAfterLoad', async() => {
    let fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.hideLoadingIconAfterLoad = true;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let mockResponses = [
      getMockCheckerResponse(0.2, queryTexts[0]),
      getMockCheckerResponse(0.5, queryTexts[1]),
      getMockCheckerResponse(0.2, queryTexts[2])
    ];

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;


    for (let callCount = 0; callCount < mockResponses.length; callCount++) {
      // Send an input event to trigger the service call.
      setTextAndFireInputEvent(queryTexts[callCount], textArea);

      await waitForTimeout(REQUEST_LIMIT_MS);

      const mockReq = httpMock.expectOne('test-url/check');
      fixture.detectChanges();
      expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(true);
      expect(checker.statusWidget.isLoading).toBe(true);

      mockReq.flush(mockResponses[callCount]);

      // TODO: Again, two of these are needed here...why?
      await checker.statusWidget.animationPromise;
      await checker.statusWidget.animationPromise;

      await fixture.whenStable();
      fixture.detectChanges();

      // Checks that loading has stopped.
      expect(checker.statusWidget.isLoading).toBe(false);
      expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);

      setTextAndFireInputEvent('', textArea);

      await checker.statusWidget.animationPromise;
      // Checks that clearing the textbox hides the status widget.
      await fixture.whenStable();
      fixture.detectChanges();
      expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);

    }
  });

  it('Test loading icon visibility with setting hideLoadingIconForScoresBelowMinThreshold',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    // Configure settings.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let callCount = 0;
    let mockResponses = [
      getMockCheckerResponse(0.2, queryTexts[0]),
      getMockCheckerResponse(0.5, queryTexts[1]),
      getMockCheckerResponse(0.2, queryTexts[2])
    ];

    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    for (let callCount = 0; callCount < mockResponses.length; callCount++) {
      // Send an input event to trigger the service call.
      setTextAndFireInputEvent(queryTexts[callCount], textArea);

      await waitForTimeout(REQUEST_LIMIT_MS);

      let mockReq = httpMock.expectOne('test-url/check');
      fixture.detectChanges();
      expect(getIsElementWithIdVisible('circleSquareDiamondWidget')).toBe(false);
      expect(checker.statusWidget.isLoading).toBe(true);

      mockReq.flush(mockResponses[callCount]);

      // TODO: Again, two of these are needed here...why?
      await checker.statusWidget.animationPromise;
      await checker.statusWidget.animationPromise;
      fixture.detectChanges();

      // Checks that loading has stopped.
      expect(checker.statusWidget.isLoading).toBe(false);
      expect(checker.statusWidget.isPlayingLoadingAnimation).toBe(false);

      let statusWidgetVisible = getIsElementWithIdVisible('circleSquareDiamondWidget');
      // The first and fourth responses (indices 0 and 2) have a score below
      // the min threshold, so the loading widget should only be visible for
      // the second one (index 1).
      expect(statusWidgetVisible).toBe(callCount === 1);

      setTextAndFireInputEvent('', textArea);

      // Checks that clearing the textbox hides the status widget.
      console.log('Checking clearing');
      await checker.statusWidget.animationPromise;
      await fixture.whenStable();
      fixture.detectChanges();
      statusWidgetVisible = getIsElementWithIdVisible('circleSquareDiamondWidget');
      expect(statusWidgetVisible).toBe(false);
    }
  });

  it('Test circle square diamond change for score thresholds', async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    // Configure settings.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.loadingIconStyle = LoadingIconStyle.CIRCLE_SQUARE_DIAMOND;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Set up the mock responses for the series of three requests that will be
    // made in the test.
    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let callCount = 0;
    let mockResponses = [
      getMockCheckerResponse(0.9, queryTexts[0]),
      getMockCheckerResponse(0.7, queryTexts[1]),
      getMockCheckerResponse(0.2, queryTexts[2])
    ];
    // For each of the mock responses, the thresholds should indicate a
    // different loading icon shape.
    let expectedShapes = [
      Shape.DIAMOND,
      Shape.SQUARE,
      Shape.CIRCLE
    ];

    verifyCircleSquareDiamondWidgetVisible();

    for (let callCount = 0; callCount < mockResponses.length; callCount++) {
      // Send an input event to trigger the service call.
      setTextAndFireInputEvent(queryTexts[callCount], textArea);

      await waitForTimeout(REQUEST_LIMIT_MS);

      let mockReq = httpMock.expectOne('test-url/check');

      fixture.detectChanges();
      // Check the UI state before returning the repsonse.
      verifyCircleSquareDiamondWidgetVisible();
      expect(checker.statusWidget.isLoading).toBe(true);

      //console.log('********FLUSH******');
      mockReq.flush(mockResponses[callCount]);

      await fixture.whenStable();
      //console.log('******STABLE*******');
      //console.log('*******WAITING FOR ANIMATION*******');
      // TODO: Two awaits?
      await checker.statusWidget.animationPromise;
      await checker.statusWidget.animationPromise;
      //console.log('*******ANIMATION DONE**************');
      // Checks the UI state after the response has been received.

      // Checks that loading has stopped.
      expect(checker.statusWidget.isLoading).toBe(false);
      expect(checker.statusWidget.isPlayingLoadingAnimation).toBe(false);

      verifyCircleSquareDiamondWidgetVisible();
      verifyLoadingWidgetHasShape(checker, expectedShapes[callCount]);
    }
  });

  it('Test emoji change for score thresholds', async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    // Configure settings.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    // Set up the mock responses for the series of three requests that will be
    // made in the test.
    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let callCount = 0;
    let mockResponses = [
      getMockCheckerResponse(0.9, queryTexts[0]),
      getMockCheckerResponse(0.7, queryTexts[1]),
      getMockCheckerResponse(0.2, queryTexts[2])
    ];
    // For each of the mock responses, the thresholds should indicate a
    // different emoji.
    let expectedEmojis = [
      Emoji.SAD,
      Emoji.NEUTRAL,
      Emoji.SMILE,
    ];

    verifyEmojiWidgetVisible();

    for (let callCount = 0; callCount < mockResponses.length; callCount++) {
      // Send an input event to trigger the service call.
      setTextAndFireInputEvent(queryTexts[callCount], textArea);
      await waitForTimeout(REQUEST_LIMIT_MS);

      let mockReq = httpMock.expectOne('test-url/check');
      // Check the UI state before returning the repsonse.

      verifyEmojiWidgetVisible();

      // TODO(rachelrosen): Figure out how to "fast-forward" the state of the
      // animation in the test environment without messing up the other test
      // state, and then uncomment the code below to check the opacity of the
      // emoji icons here.
      // verifyEmojiIconsInDomWithZeroOpacity();

      expect(checker.statusWidget.isLoading).toBe(true);

      mockReq.flush(mockResponses[callCount]);

      // TODO: Two awaits?
      await checker.statusWidget.animationPromise;
      await checker.statusWidget.animationPromise;
      await fixture.whenStable();
      fixture.detectChanges();
      // Checks the UI state after the response has been received.

      // Checks that loading has stopped.
      expect(checker.statusWidget.isLoading).toBe(false);
      expect(checker.statusWidget.isPlayingLoadingAnimation).toBe(false);

      verifyEmojiWidgetVisible();
      verifyLoadingWidgetHasEmoji(checker, expectedEmojis[callCount]);
    }
  });

  it('Test loading icon style setting change. Circle square diamond to emoji',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    // Configure settings.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.loadingIconStyle = LoadingIconStyle.CIRCLE_SQUARE_DIAMOND;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let callCount = 0;
    let mockResponses = [
      getMockCheckerResponse(0.9, queryTexts[0]),
      getMockCheckerResponse(0.7, queryTexts[1]),
      getMockCheckerResponse(0.2, queryTexts[2])
    ];
    // For each of the mock responses, the thresholds should indicate a
    // different loading icon shape.
    let expectedShapes = [
      Shape.DIAMOND, Shape.SQUARE, Shape.CIRCLE
    ];
    // For each of the mock responses, the thresholds should indicate a
    // different emoji.
    let expectedEmojis = [
      Emoji.SAD, Emoji.NEUTRAL, Emoji.SMILE
    ];

    verifyCircleSquareDiamondWidgetVisible();

    for (let callCount = 0; callCount < mockResponses.length; callCount++) {
      // Send an input event to trigger the service call.
      setTextAndFireInputEvent(queryTexts[callCount], textArea);
      await waitForTimeout(REQUEST_LIMIT_MS);

      let mockReq = httpMock.expectOne('test-url/check');

      fixture.detectChanges();
      // Check the UI state before returning the repsonse.
      verifyCircleSquareDiamondWidgetVisible();
      expect(checker.statusWidget.isLoading).toBe(true);
      mockReq.flush(mockResponses[callCount]);

      // Wait for async code to complete.
      await checker.statusWidget.animationPromise;
      await checker.statusWidget.animationPromise;
      await fixture.whenStable();
      fixture.detectChanges();
      // Checks the UI state after the response has been received.

      // Checks that loading has stopped.
      expect(checker.statusWidget.isLoading).toBe(false);
      expect(checker.statusWidget.isPlayingLoadingAnimation).toBe(false);

      verifyCircleSquareDiamondWidgetVisible();
      verifyLoadingWidgetHasShape(checker, expectedShapes[callCount]);

      // Change to the emoji style, and verify the loading icon visibility
      // change.
      demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
      fixture.componentInstance.setDemoSettings(demoSettings);
      fixture.detectChanges();
      // TODO: Two awaits?
      await checker.statusWidget.animationPromise;

      // We need another fixture.whenStable() after the detectChanges()
      // call above because animations get started in ngAfterViewChecked
      // which is triggered from ngOnChanges().
      await checker.statusWidget.animationPromise;
      verifyEmojiWidgetVisible();
      verifyLoadingWidgetHasEmoji(checker, expectedEmojis[callCount]);

      // Set demo settings back to circle/square/diamond.
      demoSettings.loadingIconStyle = LoadingIconStyle.CIRCLE_SQUARE_DIAMOND;
      fixture.componentInstance.setDemoSettings(demoSettings);
      fixture.detectChanges();
    }
  });

  it('Test loading icon style setting change. Emoji to circle square diamond',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);

    // Configure settings.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    fixture.componentInstance.setDemoSettings(demoSettings);

    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;
    let textArea = fixture.debugElement.query(
      By.css('#' + checker.inputId)).nativeElement;

    let queryTexts = [
      'Your mother was a hamster',
      'Your father smelled of elderberries',
      'What is the air velocity of an unladen swallow?'
    ];

    let callCount = 0;
    let mockResponses = [
      getMockCheckerResponse(0.9, queryTexts[0]),
      getMockCheckerResponse(0.7, queryTexts[1]),
      getMockCheckerResponse(0.2, queryTexts[2])
    ];
    // For each of the mock responses, the thresholds should indicate a
    // different emoji.
    let expectedEmojis = [
      Emoji.SAD, Emoji.NEUTRAL, Emoji.SMILE
    ];
    // For each of the mock responses, the thresholds should indicate a
    // different loading icon shape.
    let expectedShapes = [
      Shape.DIAMOND, Shape.SQUARE, Shape.CIRCLE
    ];

    verifyEmojiWidgetVisible();

    for (let callCount = 0; callCount < mockResponses.length; callCount++) {
      // Send an input event to trigger the service call.
      setTextAndFireInputEvent(queryTexts[callCount], textArea);

      await waitForTimeout(REQUEST_LIMIT_MS);

      let mockReq = httpMock.expectOne('test-url/check');

      fixture.detectChanges();
      // Check the UI state before returning the repsonse.
      verifyEmojiWidgetVisible();
      expect(checker.statusWidget.isLoading).toBe(true);
      mockReq.flush(mockResponses[callCount]);

      // Wait for async code to complete.
      await checker.statusWidget.animationPromise;
      await checker.statusWidget.animationPromise;
      fixture.detectChanges();
      // Checks the UI state after the response has been received.

      // Checks that loading has stopped.
      expect(checker.statusWidget.isLoading).toBe(false);
      expect(checker.statusWidget.isPlayingLoadingAnimation).toBe(false);

      verifyEmojiWidgetVisible();
      verifyLoadingWidgetHasEmoji(checker, expectedEmojis[callCount]);

      // Change to the shape style, and verify the loading icon visibility
      // change.
      demoSettings.loadingIconStyle = LoadingIconStyle.CIRCLE_SQUARE_DIAMOND;
      fixture.componentInstance.setDemoSettings(demoSettings);
      fixture.detectChanges();
      // TODO: Two awaits?
      await checker.statusWidget.animationPromise;
      await checker.statusWidget.animationPromise;
      fixture.detectChanges();

      verifyCircleSquareDiamondWidgetVisible();
      verifyLoadingWidgetHasShape(checker, expectedShapes[callCount]);

      // Set loading icon back to EMOJI style.
      demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
      fixture.componentInstance.setDemoSettings(demoSettings);
      fixture.detectChanges();
    }
  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, min threshold of 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    // Always show feedback, but never show the loading icon.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, true, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, min threshold of 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    // Always show feedback, but never show the loading icon.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, true, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, min threshold > 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, but never show the loading icon.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, min threshold > 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, but never show the loading icon.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test loading icon visibility, hideLoadingIconForScoresBelowMinThreshold = true, '
     +' min threshold = 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Always show feedback, and only show loading icon above the min threshold
    // (Implied that the loading icon should always display).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [true, true, true];
    // TODO(rachelrosen): This reflects the current behavior (loading icon is
    // invisible during loading when hideLoadingIconForScoresBelowMinThreshold =
    // true), but is this really the correct behavior?
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [true, true, true];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, true, true];
    let widgetId = 'circleSquareDiamondWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, hideLoadingIconForScoresBelowMinThreshold = true, '
     +' min threshold = 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Always show feedback, and only show loading icon above the min threshold
    // (Implied that the loading icon should always display).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [true, true, true];
    // TODO(rachelrosen): This reflects the current behavior (loading icon is
    // invisible during loading when hideLoadingIconForScoresBelowMinThreshold =
    // true), but is this really the correct behavior?
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [true, true, true];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, true, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test loading icon visibility, hideLoadingIconForScoresBelowMinThreshold = true, '
     + 'min threshold > 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, and only show loading
    // icon above the min threshold.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [
      false, // The default score is 0, so at the start it will be hidden.
      true,
      false
    ];
    // TODO(rachelrosen): This reflects the current behavior (loading icon is
    // invisible during loading when hideLoadingIconForScoresBelowMinThreshold =
    // true), but is this really the correct behavior?
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [true, false, true];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, hideLoadingIconForScoresBelowMinThreshold = true, '
     + 'min threshold > 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, and only show loading
    // icon above the min threshold.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = false;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [
      false, // The default score is 0, so at the start it will be hidden.
      true,
      false
    ];
    // TODO(rachelrosen): This reflects the current behavior (loading icon is
    // invisible during loading when hideLoadingIconForScoresBelowMinThreshold =
    // true), but is this really the correct behavior?
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [true, false, true];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test loading icon visibility, hideLoadingIconAfterLoad = true, min threshold = 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    // Always show feedback, but hide the loading icon after load.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [true, true, true];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, true, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, hideLoadingIconAfterLoad = true, min threshold = 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();

    // Always show feedback, but hide the loading icon after load.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [true, true, true];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, true, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test loading icon visibility, hideLoadingIconAfterLoad = true, min threshold > 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, and hide the loading
    // icon after load.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [true, true, true];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, hideLoadingIconAfterLoad = true, min threshold > 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, and hide the loading
    // icon after load.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [true, true, true];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test loading icon visibility, hideLoadingIconAfterLoad = true, '
     + 'hideLoadingIconForScoresBelowMinThreshold = true, min threshold > 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, hide the loading icon
    // after loading completes, and hide the loading icon for scores below the
    // minimum threshold. (hideLoadingIconAfterLoad should override
    // hideLoadingIconForScoresBelowMinThreshold).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    // TODO(rachelrosen): This reflects the current behavior (loading icon is
    // invisible during loading when hideLoadingIconForScoresBelowMinThreshold =
    // true), but is this really the correct behavior?
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, hideLoadingIconAfterLoad = true, '
     + 'hideLoadingIconForScoresBelowMinThreshold = true, min threshold > 0 '
     + 'emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, hide the loading icon
    // after loading completes, and hide the loading icon for scores below the
    // minimum threshold. (hideLoadingIconAfterLoad should override
    // hideLoadingIconForScoresBelowMinThreshold).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = false;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;

    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    // TODO(rachelrosen): This reflects the current behavior (loading icon is
    // invisible during loading when hideLoadingIconForScoresBelowMinThreshold =
    // true), but is this really the correct behavior?
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, '
     + ' hideLoadingIconAfterLoad = true, min threshold > 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, hide the loading icon
    // after loading completes, and always hide the loading icon.
    // (alwaysHideLoadingIcon should override hideLoadingIconAfterLoad).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, '
     + ' hideLoadingIconAfterLoad = true, min threshold > 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, hide the loading icon
    // after loading completes, and always hide the loading icon.
    // (alwaysHideLoadingIcon should override hideLoadingIconAfterLoad).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = false;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);

  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, hideLoadingIconAfterLoad = true, '
     + 'and hideLoadingIconForScoresBelowMinThreshold = true, min threshold > 0',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, hide the loading icon
    // after loading completes, hide the loading icon for scores below the
    // minimum threshold, and always hide the loading icon.
    // (alwaysHideLoadingIcon should override hideLoadingIconAfterLoad and
    // hideLoadingIconForScoresBelowMinThreshold).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading);
  });

  it('Test loading icon visibility, alwaysHideLoadingIcon = true, hideLoadingIconAfterLoad = true, '
     + 'and hideLoadingIconForScoresBelowMinThreshold = true, min threshold > 0, emoji icon',
     async() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    fixture.detectChanges();
    // Show feedback above a minimum threshold, hide the loading icon
    // after loading completes, hide the loading icon for scores below the
    // minimum threshold, and always hide the loading icon.
    // (alwaysHideLoadingIcon should override hideLoadingIconAfterLoad and
    // hideLoadingIconForScoresBelowMinThreshold).
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.scoreThresholds = [0.4, 0.6, 0.8];
    demoSettings.alwaysHideLoadingIcon = true;
    demoSettings.hideLoadingIconAfterLoad = true;
    demoSettings.hideLoadingIconForScoresBelowMinThreshold = true;
    demoSettings.loadingIconStyle = LoadingIconStyle.EMOJI;
    let mockResponseScores = [0.6, 0, 0.9];
    let expectedWidgetVisibilitiesBeforeLoading = [false, false, false];
    let expectedWidgetVisibilitiesWhileLoading = [false, false, false];
    let expectedWidgetVisibilitiesAfterLoading = [false, false, false];
    let expectedFeedbackTextVisibilitiesAfterLoading = [true, false, true];
    let widgetId = 'emojiStatusWidget';

    await verifyWidgetVisibilityForDemoSettings(
      fixture,
      httpMock,
      demoSettings,
      mockResponseScores,
      expectedWidgetVisibilitiesBeforeLoading,
      expectedWidgetVisibilitiesWhileLoading,
      expectedWidgetVisibilitiesAfterLoading,
      expectedFeedbackTextVisibilitiesAfterLoading,
      widgetId);
  });

  it('Test gradient colors', async(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    let testGradientColorsRgb = [
      "rgb(130, 224, 170)",
      "rgb(136, 78, 160)",
      "rgb(244, 208, 63)"
    ];
    let testGradientColorsHex = [
      "#82E0AA", // RGB 130, 224, 170
      "#884EA0", // RGB 136, 78, 160
      "#F4D03F"  // RGB 244, 208, 63
    ];
    // Test different low, mid, and high thresholds.
    let demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.2, 0.6, 0.8];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();

    let checker = fixture.componentInstance.checker;

    let expectedGradientControlPoints = [Math.floor(20 + (checker.statusWidget.getFirstGradientRatio() * 40)), 60, 80];
    let actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);

    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // TODO(rachelrosen): Figure out why ngOnChanges in PerspectiveStatus
    // doesn't get called between calls to setDemoSettings in this test (and why
    // it does in the above tests for 'Test loading icon style setting change'.
    // When this is fixed, remove calls to updateGradient() in this test.

    // Test different low, mid, and high score thresholds with several decimal
    // places.
    demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.23456, 0.6789, 0.89990];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();

    expectedGradientControlPoints = [
      Math.floor(23.456 + checker.statusWidget.getFirstGradientRatio() * 44.434), 67, 89];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // Test equal low and mid score thresholds.
    demoSettings.scoreThresholds = [0.5, 0.5, 0.8];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();
    fixture.detectChanges();

    expectedGradientControlPoints = [49, 50, 80];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // Test equal low and mid score thresholds with several decimal places.
    demoSettings.scoreThresholds = [0.56789, 0.56789, 0.8];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();
    fixture.detectChanges();

    expectedGradientControlPoints = [55, 56, 80];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // Test equal mid and high score thresholds.
    demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.5, 0.75, 0.75];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();

    expectedGradientControlPoints = [Math.floor(50 + checker.statusWidget.getFirstGradientRatio() * 25), 74, 75];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // Test equal mid and high score thresholds with several decimal places.
    demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.5, 0.7511111, 0.7511111];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();

    expectedGradientControlPoints = [Math.floor(50 + checker.statusWidget.getFirstGradientRatio() * 25.11111), 74, 75];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // Test equal low, mid, and high score thresholds.
    demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.75, 0.75, 0.75];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();

    expectedGradientControlPoints = [73, 74, 75];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // Test almost equal low, mid, and high score thresholds.
    demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.751, 0.752, 0.753];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();

    expectedGradientControlPoints = [73, 74, 75];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[0]);
    verifyInterpolateColorsForControlPointsAndGradientColors(
      checker, actualGradientControlPoints, testGradientColorsRgb);

    // Test equal low and mid thresholds of 0.
    demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.0, 0.0, 0.75];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();

    expectedGradientControlPoints = [-1, 0, 75];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    // First control point is below zero, so the value at 0 is the second color.
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[1]);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(.75),
                            testGradientColorsRgb[2]);

    // Test equal low, mid, and high thresholds of 0.
    demoSettings = getCopyOfDefaultDemoSettings();
    demoSettings.gradientColors = testGradientColorsHex;
    demoSettings.scoreThresholds = [0.0, 0.0, 0.0];
    fixture.componentInstance.setDemoSettings(demoSettings);
    fixture.detectChanges();
    checker.statusWidget.updateGradient();

    expectedGradientControlPoints = [-2, -1, 0];
    actualGradientControlPoints = checker.statusWidget.getAdjustedGradientControlPoints(100);
    expect(actualGradientControlPoints).toEqual(expectedGradientControlPoints);
    // First and second control points are below zero, so the value at 0 is the third color.
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(0),
                            testGradientColorsRgb[2]);
    verifyColorsAlmostEqual(checker.statusWidget.interpolateColors(1),
                            testGradientColorsRgb[2]);
  }));

  it('Test JSON DemoSettings', async(() => {
    let fixture = TestBed.createComponent(test_components.ConvaiCheckerJsonDemoSettings);
    fixture.detectChanges();
    let checker = fixture.componentInstance.checker;

    let expectedDemoSettings = JSON.parse(fixture.componentInstance.getDemoSettingsJson());
    expect(checker.demoSettings).toEqual(expectedDemoSettings);
    expect(checker.demoSettings).not.toEqual(getCopyOfDefaultDemoSettings());
  }));
});
