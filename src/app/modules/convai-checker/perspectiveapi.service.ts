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
import { Injectable } from '@angular/core';
// import { Http, Headers } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AnalyzeCommentData,
  AnalyzeCommentRequest,
  AnalyzeCommentResponse,
  AttributeScores,
  PerspectiveGapiClient,
  RequestedAttributes,
  SuggestCommentScoreData,
  SuggestCommentScoreRequest,
  SuggestCommentScoreResponse,
} from './perspectiveapi-types'

// TODO: Make this configurable for dev vs prod.
const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery'
    + '/rest?version=v1alpha1';
const TOXICITY_ATTRIBUTE = 'TOXICITY';

@Injectable()
export class PerspectiveApiService {

  private gapiClient: PerspectiveGapiClient = null;

  constructor(private httpClient: HttpClient) {}

  initGapiClient(apiKey: string) {
    if (!apiKey) {
      this.gapiClient = null;
    }
    gapi.load('client', () => {
      console.log('Starting to load gapi client');
      (gapi.client as any).init({
        'apiKey': apiKey,
        'discoveryDocs': [ DISCOVERY_URL ],
      }).then(() => {
        console.log('Finished loading gapi client');
        console.log(gapi.client);
        this.gapiClient = (gapi.client as any) as PerspectiveGapiClient;
      }, (error: Error) => {
        console.error('Error loading gapi client:', error);
      })});
  }

  // TODO: this should be a Single observable, not a general observable because
  // any call to checkText will only give a single result.
  checkText(data: AnalyzeCommentData, makeDirectApiCall: boolean, serverUrl?: string)
      : Observable<AnalyzeCommentResponse> {
    if (makeDirectApiCall && this.gapiClient === null) {
      console.error('No gapi client found; call initGapiClient with your API'
                    + 'key to make a direct API call. Using server instead');
      makeDirectApiCall = false;
    }
    if (makeDirectApiCall) {
      console.debug('Making a direct API call with gapi');

      let requestedAttributes: RequestedAttributes = {};
      const attribute = data.modelName || TOXICITY_ATTRIBUTE;
      requestedAttributes[attribute] = {};

      let request: AnalyzeCommentRequest = {
        comment: {text: data.comment},
        requested_attributes: requestedAttributes,
        session_id: data.sessionId,
        community_id: data.communityId
      };
      return from(
         this.gapiClient.commentanalyzer.comments.analyze(request))
         .pipe(map(response => response.result));
    } else {
      if (serverUrl === undefined) {
        serverUrl = '';
        console.error('No server url specified for a non-direct API call.'
                      + ' Defaulting to current hosted address');
      }

      let headers = new HttpHeaders();
      headers.append('Content-Type', 'application/json');

      // TODO: why are we appending the '/check' string? Nearly always better to
      // do  have this provided as input; appending here will make it much less
      // flexible.
      return this.httpClient.post(
        serverUrl + '/check', JSON.stringify(data), {headers});
    }
  }

  suggestScore(data: SuggestCommentScoreData, makeDirectApiCall: boolean, serverUrl?: string)
      : Observable<SuggestCommentScoreResponse> {
    if (makeDirectApiCall && this.gapiClient === null) {
      console.error('No gapi client found; call initGapiClient with your API'
                    + 'key to make a direct API call. Using server instead');
      makeDirectApiCall = false;
    }
    if (makeDirectApiCall) {
      let attributeScores: AttributeScores  = {};

      const attribute = data.modelName || TOXICITY_ATTRIBUTE;
      attributeScores[attribute] = {
        summaryScore: { value: data.commentMarkedAsToxic ? 1 : 0 }
      };
      let request: SuggestCommentScoreRequest = {
        comment: {text: data.comment},
        attribute_scores: attributeScores,
        client_token: data.sessionId,
      };
      console.debug('Making a direct API call with gapi');
      return from(
         this.gapiClient.commentanalyzer.comments.suggestscore(request))
         .pipe(map(response => response.result));
    } else {
      if (serverUrl === undefined) {
        serverUrl = '';
        console.error('No server url specified for a non-direct API call.'
                      + ' Defaulting to current hosted address');
      }
      let headers = new HttpHeaders();
      headers.append('Content-Type', 'application/json');

      // TODO: why are we appending the '/suggest_score' string? Nearly always
      // better to do  have this provided as input; appending here will make it
      // much less flexible.
      return this.httpClient.post(
        serverUrl + '/suggest_score', JSON.stringify(data), {headers});
    }
  }
}
