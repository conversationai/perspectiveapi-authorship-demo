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
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Injectable } from '@angular/core';
import { PerspectiveStatus, CommentFeedback, LoadingIconStyle } from './perspective-status.component';
import { PerspectiveApiService } from './perspectiveapi.service';
import {
  AnalyzeCommentData,
  AnalyzeCommentResponse,
  SpanScores,
  SuggestCommentScoreData,
  SuggestCommentScoreResponse,
} from './perspectiveapi-types'
import * as rxjs from 'rxjs';
import { Subscription, Observable, Subject } from 'rxjs';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface InputEvent {
  target: HTMLInputElement;
}

// TODO: Make more of these parameters optional, especially the ones we don't
// want to expose to users in the public launch.
export interface DemoSettings {
  // Refers to the correction UI style. Current options are "default" or
  // "external" (see perspective-status.ConfigurationInput).
  configuration: string;

  // An array of colors to use as the gradient for the animated loading widget.
  // Minimum length is two, but there is no maximum length.
  gradientColors: string[];

  // Optional. API key to use when using the Gapi endpoint. Should be empty or
  // omitted when not using the Gapi endpoint.
  apiKey?: string;

  // Whether to use the Gapi endpoint.
  useGapi: boolean;

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


const REQUEST_LIMIT_MS = 500;
const LOCAL_STORAGE_SESSION_ID_KEY = 'sessionId';

export const DEFAULT_DEMO_SETTINGS = {
  configuration: 'default',
  gradientColors: ["#25C1F9", "#7C4DFF", "#D400F9"],
  apiKey: '',
  useGapi: false,
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
  // Allows listening to input events outside of this component.
  host: {
    '(document:input)': '_handleInputEvent($event)',
  },
})
export class ConvaiChecker implements OnInit, OnChanges {
  @ViewChild(PerspectiveStatus) statusWidget: PerspectiveStatus;
  @Input() inputId: string;
  @Input() serverUrl: string;
  @Input() fontSize: number = 12;
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
  // This is the Observable Subject for strings that are being requested to
  // be checked.
  private checkInProgress$: Subject<string>;
  // This is the observable for requests to the API giving back responses.
  private pendingRequest$: Observable<AnalyzeCommentResponse>;
  private lastRequestedText: string;
  private lastPendingRequestedText: string;
  private inputListener: EventListener;
  public initializeErrorMessage: string;
  public analyzeErrorMessage: string|null = null;
  public canAcceptFeedback: boolean = false;
  public feedbackRequestInProgress: boolean = false;
  private sessionId: string|null = null;
  private gradientColors: string[] = ["#25C1F9", "#7C4DFF", "#D400F9"];
  private apiKey: string|undefined;
  private configuration: string;

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

    this.checkInProgress$ = new Subject<string>();
    this.checkInProgress$.pipe(debounceTime(REQUEST_LIMIT_MS))
      .pipe(distinctUntilChanged())
  };

  ngOnInit() {
    if (!this.inputId) {
      this.initializeErrorMessage = "Error initializing: No input element id"
        + " specified. Set inputId=<inputElementId> to use this component.";
      return;
    }

    if (this.demoSettingsJson) {
      this.demoSettings = JSON.parse(this.demoSettingsJson);
      if (this.demoSettings.apiKey) {
        this.apiKey = this.demoSettings.apiKey;
      }
    }

    if (this.apiKey) {
      this.analyzeApiService.initGapiClient(this.apiKey);
    }

    this.sessionId = window.localStorage.getItem(LOCAL_STORAGE_SESSION_ID_KEY);
    if (this.sessionId === null) {
      this.sessionId = Math.round(Date.now() * Math.random()).toString();
      window.localStorage.setItem(LOCAL_STORAGE_SESSION_ID_KEY, this.sessionId);
    }
  }

  ngOnChanges(changes: SimpleChanges) : void {
    if (changes['demoSettings']) {
      if (this.demoSettings && this.demoSettings.apiKey &&
          this.apiKey !== this.demoSettings.apiKey) {
        console.debug('Api key changes detected in demoSettings');
        this.apiKey = this.demoSettings.apiKey;
        this.analyzeApiService.initGapiClient(this.apiKey);
      }
    }
  }

  // Public interface for manually checking text and updating the UI. Note that
  // this does NOT change the contents of the text box. This is intended to be
  // used for handling programmatic changes to the input box not caused by a
  // user typing.
  //
  // TODO: consider Null results are used for when no input (the empty string,
  // or a null string) is provided.
  //
  // TODO: condider use Single observable instead of general observable. Only
  // a single value gets given back.
  public checkText(text: string): Observable<AnalyzeCommentResponse> {
    return this._handlePendingCheckRequest(text);
  }

  // Listens to input events from elements outside the component, and forwards
  // the ones from the element with the desired input id into our check request
  // handlers.
  // TODO(rachelrosen): Consider using a CSS selector for this instead, for
  // better specificity.
  // Note: Public so that it can be used outside, to listen to events on other
  // elements.
  public _handleInputEvent(event: InputEvent) {
    if (event.target.id === this.inputId) {
      this._handlePendingCheckRequest(event.target.value);
    }
  }

  private _handlePendingCheckRequest(text: string): Observable<AnalyzeCommentResponse> {
    // // Don't make duplicate requests.
    // if (text === this.lastRequestedText ||
    //     text === this.lastPendingRequestedText) {
    //   console.debug('Duplicate request text ' + text + '; returning');
    //   return;
    // }

    // Clear any pending requests since data has changed.
    console.debug('Clearing this.pendingRequest');

    this.analyzeErrorMessage = null;

    // Text has been cleared, return to default state.
    if (!text) {
      this.analyzeCommentResponse = null;
      this.analyzeCommentResponseChanged.emit(this.analyzeCommentResponse);
      this.statusWidget.notifyScoreChange(0);
      this.scoreChanged.emit(0);
      this.canAcceptFeedback = false;
      this.statusWidget.resetFeedback();
      this.pendingRequest$ = rxjs.empty();
      return this.pendingRequest$;
    }

    this.lastPendingRequestedText = text;
    this.statusWidget.setLoading(true);

    console.debug('Updating this.pendingRequest for text: ', text);

    return this._checkText(text);
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
   *   1) when the user clicks "Learn more"
   *   2) when the user clicks the "toxic" link for the "Is this toxic?"
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

  suggestCommentScore(text: string, feedback: CommentFeedback)
      : Promise<SuggestCommentScoreResponse> {
    this.feedbackRequestInProgress = true;

    const suggestCommentScoreData: SuggestCommentScoreData = {
      comment: text,
      sessionId: this.sessionId,
      commentMarkedAsToxic: feedback.commentMarkedAsToxic
    };
    if (this.demoSettings.modelName) {
      suggestCommentScoreData.modelName = this.demoSettings.modelName;
    }

    const suggestScore$ = this.analyzeApiService.suggestScore(
      suggestCommentScoreData,
      this.demoSettings.useGapi /* makeDirectApiCall */,
      this.serverUrl
    ).pipe(finalize(() => {
        console.debug('Feedback request done');
        this.statusWidget.hideFeedbackQuestion();
        this.feedbackRequestInProgress = false;
      }));
    suggestScore$.subscribe(
      (response: SuggestCommentScoreResponse) => {
        this.statusWidget.feedbackCompleted(true);
        console.log(response);
      },
      (error: Error) => {
        console.error('Error', error);
        this.statusWidget.feedbackCompleted(false);
      }
    );
    // TODO: would be better for trhis to be a Single observable.
    return suggestScore$.toPromise();
  }

  private _getErrorMessage(error: any): string {
    let msg = 'Error scoring text. Please try again.';
    // Look at detailed API error messages for more meaningful error to return.
    try {
      for (const api_err of error.json().errors) {
        // TODO(jetpack): a small hack to handle the language detection failure
        // case. we should instead change the API to return documented, typeful
        // errors.
        if (api_err.message.includes('does not support request languages')) {
          msg = 'Sorry! Perspective needs more training data to work in this '
            + 'language.';
          break;
        }
      }
    } catch (e) {
      console.warn('Failed to parse error. ', e);
    }
    return msg;
  }

  private _checkText(text: string): Observable<AnalyzeCommentResponse> {
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

    const checkText$ = this.analyzeApiService.checkText(
        analyzeCommentData,
        this.demoSettings.useGapi /* makeDirectApiCall */,
        this.demoSettings.usePluginEndpoint ? this.pluginEndpointUrl : this.serverUrl)
      .pipe(finalize(() => {
        console.log('Request done');
        // TODO: Add a comment to explain why/how this.analyzeCommentResponse is set
        // to the new value. That seems to happen later in the subscribe.
        let newScore = this.getMaxScore(this.analyzeCommentResponse);
        // TODO: notifyScoreChange's behaviour is async: we should either make
        // it sync, or chain it so that the piped result completes AFTER
        // notifyScoreChange has compkleted.
        this.statusWidget.notifyScoreChange(newScore);
        this.scoreChanged.emit(newScore);
        this.mostRecentRequestSubscription = null;
      }));

    this.mostRecentRequestSubscription = checkText$.subscribe(
      (response: AnalyzeCommentResponse) => {
        // TODO: this seems to be an important part of the completion of the
        // behaviour for checking text, so it should be done in the pipe, not
        // in the subscription result. That way the resulting observable
        // happens when we want it to: when everything that should have
        // hapened for the new result, has happened, and then we can test
        // reliably.
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

    return checkText$;
  }

  getMaxScore(response: AnalyzeCommentResponse): number {
    if (response === null || response.attributeScores == null) {
      return 0;
    }
    let max: number = undefined;
    Object.keys(response.attributeScores).forEach((key: string) => {
      let maxSpanScoreForAttribute =
        this.getMaxSpanScore(response.attributeScores[key]);
      if (max === undefined || maxSpanScoreForAttribute > max) {
          max = maxSpanScoreForAttribute;
      }
    });

    if (max === undefined) {
      console.error('No "value" field found for score. Returning 0.');
      max = 0;
    }
    return max;
  }

  getMaxSpanScore(spanScores: SpanScores): number {
    let max: number = undefined;
    for (let spanScore of spanScores.spanScores) {
      if (max === undefined || spanScore.score.value > max) {
        max = spanScore.score.value;
      }
    }
    return max;
  };
}
