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
import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { ReCaptchaV3Service } from 'ng-recaptcha';

import {
  AnalyzeCommentData,
  AnalyzeCommentRequest,
  AnalyzeCommentResponse,
  AttributeScoresMap,
  PerspectiveGapiClient,
  RequestedAttributes,
  SuggestCommentScoreData,
  SuggestCommentScoreRequest,
  SuggestCommentScoreResponse,
} from './perspectiveapi-types';

// TODO: Make this configurable for dev vs prod.
const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery'
    + '/rest?version=v1alpha1';
export const TOXICITY_ATTRIBUTE = 'TOXICITY';

@Injectable()
export class PerspectiveApiService {

  constructor(
    private httpClient: HttpClient,
    @Optional() private recaptchaV3Service: ReCaptchaV3Service) {}

  // TODO: this should be a Single observable, not a general observable because
  // any call to checkText will only give a single result.
  checkText(data: AnalyzeCommentData, serverUrl?: string)
      : Observable<AnalyzeCommentResponse> {
    if (serverUrl === undefined) {
      serverUrl = '';
      console.error('No server url specified for a non-direct API call.'
                    + ' Defaulting to current hosted address');
    }

    return this.sendRequest<AnalyzeCommentData, AnalyzeCommentResponse>(
      data, `${serverUrl}/check`, 'checkText');
  }

  suggestScore(data: SuggestCommentScoreData, serverUrl?: string)
      : Observable<SuggestCommentScoreResponse> {
    if (serverUrl === undefined) {
      serverUrl = '';
      console.error('No server url specified for a non-direct API call.'
                    + ' Defaulting to current hosted address');
    }

    return this
      .sendRequest<SuggestCommentScoreData, SuggestCommentScoreResponse>(
        data, `${serverUrl}/suggest_score`, 'suggestScore');
  }

  /**
   * Issues a POST request to an endpoint.
   *
   * This fetches and attaches a reCAPTCHA token if RecaptchaV3Service is
   * provided in the module.
   *
   * @param data The data to send in the POST request body.
   * @param endpoint The endpoint to issue the POST request against.
   * @param action The action name to attach to the reCATPCHA request for
   * verification. This is used if the RecaptchaV3Service is provided. See
   * https://developers.google.com/recaptcha/docs/v3#actions for more details.
   */
  private sendRequest<T, R>(data: T, endpoint: string, action: string):
    Observable<R> {
    if (this.recaptchaV3Service === null) {
      return this.post<T, R>(endpoint, data);
    } else {
      return this.recaptchaV3Service.execute(action).pipe(
        flatMap(recaptchaToken =>
          this.post<T, R>(endpoint, { ...{ action, recaptchaToken }, ...data })
        )
      );
    }
  }

  private post<T, R>(endpoint: string, data: T): Observable<R> {
    const headers =
      new HttpHeaders().append('Content-Type', 'application/json');

    return this.httpClient.post<R>(endpoint, data, {headers});
  }
}
