/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Injectable } from '@angular/core';
import { PerspectiveStatusComponent, CommentFeedback, LoadingIconStyle } from './perspective-status.component';
import { PerspectiveApiService, TOXICITY_ATTRIBUTE } from './perspectiveapi.service';
import {
  AnalyzeCommentData,
  AnalyzeCommentResponse,
  AttributeScoresMap,
  SuggestCommentScoreData,
  SuggestCommentScoreResponse,
} from './perspectiveapi-types';
import * as rxjs from 'rxjs';
import { Subscription, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface InputEvent {
  target: HTMLInputElement;
}

// TODO: Make more of these parameters optional, especially the ones we don't
// want to expose to users in the public launch.
export interface DemoSettings {
  // DEPRECATED. Value is ignored.
  configuration?: string;

  // An array of colors to use as the gradient for the animated loading widget.
  // Minimum length is two, but there is no maximum length.
  gradientColors: string[];

  // Whether to use the plugin endpoint.
  usePluginEndpoint: boolean;

  // Whether to show the model score in the UI.
  showPercentage: boolean;

  // Determines whether “More info” link is visible.
  showMoreInfoLink: boolean;

  // Three feedback messages to display to the user. These can contain emoji
  // unicode. This must be length 3.
  feedbackText: [string, string, string];

  // The numeric thresholds for showing each severity. Index 0 contains the
  // minimum threshold to show scores. Index 1 is the threshold for medium
  // severity, and index 2 is the threshold for high severity. Note that if you
  // want only scores with medium severity to be shown (and never scores for
  // low severity), indices 0 and 1 should have the same value.
  scoreThresholds: [number, number, number];

  // Whether to hide the loading icon after loading completes; this will allow
  // for loading animation to play, but no circle/square/diamond will be
  // present after the loading finishes.
  hideLoadingIconAfterLoad: boolean;

  // Whether to hide the loading icon when the score is below the minimum
  // threshold to show feedback (index 0 of scoreThresholds).
  hideLoadingIconForScoresBelowMinThreshold: boolean;

  // Whether to always hide the loading icon (results in only showing the text
  // feedback and never showing loading animation).
  alwaysHideLoadingIcon: boolean;

  // The loading icon style. See perspective-status.LoadingIconStyle for
  // options.
  loadingIconStyle: string;

  // The string to use to prompt users to submit feedback.
  userFeedbackPromptText: string;

  // An id for the community using the checker.
  communityId?: string;

  // The model to use for scoring. If not specified, uses TOXICITY as the
  // default model.
  modelName?: string;
}


export const REQUEST_LIMIT_MS = 500;
const LOCAL_STORAGE_SESSION_ID_KEY = 'sessionId';

export const DEFAULT_DEMO_SETTINGS = {
  gradientColors: ['#25C1F9', '#7C4DFF', '#D400F9'],
  usePluginEndpoint: false,
  showPercentage: true,
  showMoreInfoLink: true,
  feedbackText: [
    'Unlikely to be perceived as toxic',
    'Unsure if this will be perceived as toxic',
    'Likely to be perceived as toxic'
  ] as [string, string, string],
  scoreThresholds: [0, 0.4, 0.7] as [number, number, number],
  hideLoadingIconAfterLoad: false,
  hideLoadingIconForScoresBelowMinThreshold: false,
  alwaysHideLoadingIcon: false,
  loadingIconStyle: LoadingIconStyle.CIRCLE_SQUARE_DIAMOND,
  userFeedbackPromptText: 'Seem wrong?'
};

const GITHUB_PAGE_LINK =
  'https://github.com/conversationai/perspectiveapi/blob/master/api_reference.md#alpha';

@Component({
  selector: 'convai-checker',
  templateUrl: './convai-checker.component.html',
  styleUrls: ['./convai-checker.component.css'],
  providers: [PerspectiveApiService],
})
export class ConvaiCheckerComponent implements OnInit {
  @ViewChild(PerspectiveStatusComponent, {static: false})
  statusWidget: PerspectiveStatusComponent;
  @Input() inputId: string;
  @Input() serverUrl: string;
  @Input() fontSize = 12;
  @Input() demoSettings: DemoSettings = DEFAULT_DEMO_SETTINGS;
  // A JSON string representation of the DemoSettings. Expected to be static
  // over the course of the component's lifecycle, and should only be used from
  // a non-Angular context (when convai-checker is being used as a
  // webcomponent). If working from an Angular context, use |demoSettings|.
  @Input() demoSettingsJson: string|null = null;
  @Input() pluginEndpointUrl = 'http://perspectiveapi.com/plugin';
  @Output() scoreChangeAnimationCompleted: EventEmitter<void> = new EventEmitter<void>();
  @Output() scoreChanged: EventEmitter<number> = new EventEmitter<number>();
  @Output() modelInfoLinkClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() analyzeCommentResponseChanged: EventEmitter<AnalyzeCommentResponse|null> =
    new EventEmitter<AnalyzeCommentResponse|null>();
  analyzeCommentResponse: AnalyzeCommentResponse|null = null;
  private checkInProgress: boolean;
  private mostRecentRequestSubscription: Subscription;
  // Number is the return type of window.setTimeout(), which is used to update
  // the pending request when the user is continuously typing, to not send too
  // many requests that will be ignored.
  private pendingRequest: number;
  private lastRequestedText: string;
  private lastPendingRequestedText: string;
  private inputListener: EventListener;
  public initializeErrorMessage: string;
  public analyzeErrorMessage: string|null = null;
  public canAcceptFeedback = false;
  public feedbackRequestInProgress = false;
  private sessionId: string|null = null;
  private gradientColors: string[] = ['#25C1F9', '#7C4DFF', '#D400F9'];

  constructor(
      private elementRef: ElementRef,
      private analyzeApiService: PerspectiveApiService
  ) {
    // Extracts attribute fields from the element declaration. This
    // covers the case where this component is used as a root level
    // component outside an angular component tree and we cannot get
    // these values from data bindings.
    this.inputId = this.elementRef.nativeElement.getAttribute('inputId');

    // Default to '' to use same server as whatever's serving the webapp.
    this.serverUrl =
      this.elementRef.nativeElement.getAttribute('serverUrl') || '';
  }

  ngOnInit() {
    if (!this.inputId) {
      this.initializeErrorMessage = 'Error initializing: No input element id'
        + ' specified. Set inputId=<inputElementId> to use this component.';
      return;
    }

    if (this.demoSettingsJson) {
      this.demoSettings = JSON.parse(this.demoSettingsJson);
    }

    this.sessionId = window.localStorage.getItem(LOCAL_STORAGE_SESSION_ID_KEY);
    if (this.sessionId === null) {
      this.sessionId = Math.round(Date.now() * Math.random()).toString();
      window.localStorage.setItem(LOCAL_STORAGE_SESSION_ID_KEY, this.sessionId);
    }
  }

  // Public interface for manually checking text and updating the UI. Note that
  // this does NOT change the contents of the text box. This is intended to be
  // used for handling programmatic changes to the input box not caused by a
  // user typing.
  public checkText(text: string) {
    return this._handlePendingCheckRequest(text);
  }

  // Listens to input events from elements outside the component, and forwards
  // the ones from the element with the desired input id into our check request
  // handlers.
  // TODO: Consider using a CSS selector for this instead, for better
  // specificity.
  @HostListener('document:input', ['$event'])
  handleInputEvent(event: InputEvent) {
    if (event.target.id === this.inputId) {
      this._handlePendingCheckRequest(event.target.value);
    }
  }

  private _handlePendingCheckRequest(text: string) {
    // Don't make duplicate requests.
    if (text === this.lastRequestedText ||
        text === this.lastPendingRequestedText) {
      console.debug('Duplicate request text ' + text + '; returning');
      return;
    }

    // Clear any pending requests since data has changed.
    console.debug('Clearing this.pendingRequest');
    clearTimeout(this.pendingRequest);
    this.analyzeErrorMessage = null;

    // Text has been cleared, return to default state.
    if (!text) {
      this.analyzeCommentResponse = null;
      this.analyzeCommentResponseChanged.emit(this.analyzeCommentResponse);
      this.statusWidget.notifyScoreChange(0);
      this.scoreChanged.emit(0);
      this.canAcceptFeedback = false;
      this.statusWidget.resetFeedback();
      return;
    }

    this.lastPendingRequestedText = text;
    this.statusWidget.setLoading(true);

    // Use window.setTimeout() instead of just setTimeout() because
    // Typescript gets confused about the typings when compiling for
    // a development environment vs a testing environment (the former sees
    // NodeJS.Timer while the latter sees number). Using window.setTimeout
    // makes it consistently type number.
    console.debug('Updating this.pendingRequest for text: ', text);
    this.pendingRequest = window.setTimeout(() => {
      this._checkText(text);
    }, REQUEST_LIMIT_MS);
  }

  // TODO: better to take the text in here than use the implicit value. That way
  // you avoid having to have as many copies ofthe same data.
  onCommentFeedbackReceived(feedback: CommentFeedback) {
    if (this.analyzeCommentResponse === null) {
      // Don't send feedback for an empty input box.
      return;
    }

    this.suggestCommentScore(this.lastRequestedText, feedback);
  }

  handleScoreChangeAnimationCompleted() {
    // Allow the output event to bubble up from the child checker-status
    // component through this component.
    this.scoreChangeAnimationCompleted.emit();
    console.debug('Score animation completed! Emitting an event');
  }

  /**
   * This event callback can get triggered in two ways:
   *   1) when the user clicks 'Learn more'
   *   2) when the user clicks the 'toxic' link for the 'Is this toxic?'
   *      feedback question.
   */
  handleModelInfoLinkClicked() {
    // Allow the output event to bubble up from the child checker-status
    // component through this component.
    this.modelInfoLinkClicked.emit();

    if (this.demoSettings.usePluginEndpoint) {
      // Open a link to our github page.
      window.open(GITHUB_PAGE_LINK, '_blank');
    }
  }

  suggestCommentScore(text: string, feedback: CommentFeedback): void {
    this.feedbackRequestInProgress = true;

    const suggestCommentScoreData: SuggestCommentScoreData = {
      comment: text,
      sessionId: this.sessionId,
      commentMarkedAsToxic: feedback.commentMarkedAsToxic
    };
    if (this.demoSettings.modelName) {
      suggestCommentScoreData.modelName = this.demoSettings.modelName;
    }

    const suggestScoreObservable = this.analyzeApiService.suggestScore(
      suggestCommentScoreData,
      this.serverUrl
    ).pipe(
      take(1), // Prevents memory leaks.
      finalize(() => {
        console.debug('Feedback request done');
        this.statusWidget.hideFeedbackQuestion();
        this.feedbackRequestInProgress = false;
      })
    );

    suggestScoreObservable.subscribe(
      (response: SuggestCommentScoreResponse) => {
        this.statusWidget.feedbackCompleted(true);
        console.log(response);
      },
      (error: Error) => {
        console.error('Error', error);
        this.statusWidget.feedbackCompleted(false);
      }
    );
  }

  private _getErrorMessage(error: any): string {
    let msg =
      'We\'re sorry, we\'re having trouble at the moment. Please try again later.';
    // Look at detailed API error messages for more meaningful error to return.
    try {
      for (const api_err of error.error.errors) {
        // TODO(jetpack): a small hack to handle the language detection failure
        // case. we should instead change the API to return documented, typeful
        // errors.
        if (api_err.message.includes('does not support request languages')) {
          msg = 'We don\'t yet support that language, but we\'re working on it!';
          break;
        }
      }
    } catch (e) {
      console.warn('Failed to parse error. ', e);
    }
    return msg;
  }

  private _checkText(text: string) {
    // Cancel listening to callbacks of previous requests.
    if (this.mostRecentRequestSubscription) {
      this.mostRecentRequestSubscription.unsubscribe();
    }

    this.statusWidget.resetFeedback();

    console.log('Checking text ' + text);

    this.lastRequestedText = text;
    this.checkInProgress = true;

    const analyzeCommentData: AnalyzeCommentData = {
      comment: text,
      sessionId: this.sessionId,
      communityId: this.demoSettings.communityId,
    };
    if (this.demoSettings.modelName) {
      analyzeCommentData.modelName = this.demoSettings.modelName;
    }

    const analyzeCommentObservable = this.analyzeApiService.checkText(
        analyzeCommentData,
        this.demoSettings.usePluginEndpoint ? this.pluginEndpointUrl : this.serverUrl)
      .pipe(
        take(1), // Prevents memory leaks
        finalize(() => {
          console.log('Request done');
          // this.analyzeCommentResponse is updated in the subscribe, which
          // happens before the finalize() call here. It is either equal to the
          // last response or null if the last response was an error.
          const attribute = this.demoSettings.modelName || TOXICITY_ATTRIBUTE;
          const newScore = this.getSummaryScore(this.analyzeCommentResponse, attribute);
          // TODO: This will wait until animations finish before notifying any
          // listening parent containers (e.g. the Perspectiveapi.com website)
          // that there is a new score, which could cause a lag in some UI
          // elements that depend on this. Determine if we actually want to wait
          // for the animations here.
          this.statusWidget.notifyScoreChange(newScore).then(() => {
            this.scoreChanged.emit(newScore);
          });
          this.mostRecentRequestSubscription = null;
        })
      );

    this.mostRecentRequestSubscription = analyzeCommentObservable.subscribe(
      (response: AnalyzeCommentResponse) => {
        // Note: This gets called before the finalize();
        this.analyzeCommentResponse = response;
        this.analyzeCommentResponseChanged.emit(this.analyzeCommentResponse);
        console.log(this.analyzeCommentResponse);
        this.checkInProgress = false;
        this.canAcceptFeedback = true;
      },
      (error) => {
        console.error('Error', error);
        this.checkInProgress = false;
        this.canAcceptFeedback = false;
        this.analyzeErrorMessage = this._getErrorMessage(error);
        this.analyzeCommentResponse = null;
      }
    );
  }

  getSummaryScore(response: AnalyzeCommentResponse, attribute: string) {
    return response === null || response.attributeScores == null ? 0
      : response.attributeScores[attribute].summaryScore.value;
  }
}
