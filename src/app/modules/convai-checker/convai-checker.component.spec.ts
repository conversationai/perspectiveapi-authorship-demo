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
  getTestBed,
} from '@angular/core/testing';

import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import * as test_components from './test-components';
import { PerspectiveStatus, CommentFeedback, Emoji, LoadingIconStyle, Shape } from './perspective-status.component';
import { ConvaiChecker, DEFAULT_DEMO_SETTINGS, DemoSettings } from './convai-checker.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import { AnalyzeCommentResponse } from './perspectiveapi-types';

let getMockCheckerResponse = function(score: number, token: string):
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

function configureFixtureForExternalFeedbackStyleConfiguration(
    fixture: ComponentFixture<test_components.ConvaiCheckerCustomDemoSettings>) {
  let demoSettings = JSON.parse(JSON.stringify(DEFAULT_DEMO_SETTINGS));
  demoSettings.configuration = 'external';
  fixture.componentInstance.setDemoSettings(demoSettings);
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

    fixture =
      TestBed.createComponent(test_components.ConvaiCheckerCustomDemoSettings);
    configureFixtureForExternalFeedbackStyleConfiguration(fixture);
    fixture.detectChanges();

    checker = fixture.componentInstance.checker;

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

  it('Should handle manual check', fakeAsync(() => {
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

});
