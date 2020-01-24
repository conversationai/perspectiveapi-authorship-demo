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
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Injectable,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3-interpolate';
import * as toxicLibsJS from 'toxiclibsjs';
import {Animation, Elastic, Power3, TimelineMax, TweenMax} from 'gsap';
import { take } from 'rxjs/operators';

export enum Shape {
  CIRCLE,
  SQUARE,
  DIAMOND,
}

export enum Emoji {
  SMILE,
  NEUTRAL,
  SAD,
}

// If adding an alternate UI flow, create a new Configuration.
export enum Configuration {
  DEMO_SITE,
}

// The keys in ConfigurationInput should match items in the Configuration enum.
export const ConfigurationInput = {
  DEMO_SITE: 'default',
};

export const ScoreThreshold = {
  OKAY: 0,
  NEUTRAL: 0.20,
  TOXIC: 0.76,
};

export const LoadingIconStyle = {
  CIRCLE_SQUARE_DIAMOND: 'circle_square_diamond',
  EMOJI: 'emoji',
  NONE: 'none' // No loading icon
};

export const DEFAULT_FEEDBACK_TEXT = 'x% likely to be perceived as "toxic."';

const FADE_START_LABEL = 'fadeStart';
const LOADING_START_ANIMATIONS_LABEL = 'loadingAnimationStart';
const SHAPE_MORPH_TIME_SECONDS = 1;
const FADE_DETAILS_TIME_SECONDS = 0.4;
const FADE_ANIMATION_TIME_SECONDS = 0.3;
const GRAYSCALE_ANIMATION_TIME_SECONDS = 0.2;
const LAYER_TRANSITION_TIME_SECONDS = 0.5;
const FADE_WIDGET_TIME_SECONDS = 0.4;
const WIDGET_PADDING_PX = 4;
const WIDGET_RIGHT_MARGIN_PX = 10;
const EMOJI_MAIN_LOADING_ANIMATION_LABEL = 'emojiMainLoadingAnimation';
const FADE_EMOJI_TIME_SECONDS = 0.5;
const EMOJI_BOUNCE_IN_TIME_SECONDS = 1;
const COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS = 0.5;
const FIRST_GRADIENT_RATIO = 0.9;
const QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS = 0.2;
const NEUTRAL_GRAY_COLOR = '#cccccc';
const GRAY_COLOR_CIRCLE_LOADING = 'rgba(227,229,230,1)';
const EMOJI_COLOR = '#ffcc4d';

@Component({
  selector: 'perspective-status',
  templateUrl: './perspective-status.component.html',
  styleUrls: ['./perspective-status.component.css'],
})
@Injectable()
export class PerspectiveStatusComponent implements OnChanges, OnInit, AfterViewInit, AfterViewChecked {
  // TODO: Instead of all these inputs, we should merge the
  // convai-checker component with this one.
  @Input() configurationInput: string = ConfigurationInput.DEMO_SITE;
  // Since score is zero for both no score and legitimate scores of zero, keep
  // a flag to indicate whether we should show UI for showing score info.
  @Input() hasScore = false;
  @Input() gradientColors: string[] = ['#ffffff', '#000000'];
  @Input() canAcceptFeedback = false;
  @Input() feedbackRequestInProgress = false;
  @Input() feedbackRequestSubmitted = false;
  @Input() feedbackRequestError = false;
  @Input() initializeErrorMessage: string;
  @Input() feedbackText: [string, string, string] = [
     DEFAULT_FEEDBACK_TEXT,
     DEFAULT_FEEDBACK_TEXT,
     DEFAULT_FEEDBACK_TEXT
  ];
  @Input() neutralScoreThreshold = ScoreThreshold.NEUTRAL;
  @Input() toxicScoreThreshold = ScoreThreshold.TOXIC;
  @Input() analyzeErrorMessage: string|null = null;
  @Input() showFeedbackForLowScores: boolean;
  @Input() showFeedbackForNeutralScores: boolean;
  @Input() loadingIconStyle: string;
  @Input() hasLocalAssets = true;
  @Input() fontFamily = 'Roboto, sans-serif';

  @Output() scoreChangeAnimationCompleted: EventEmitter<void> = new EventEmitter<void>();
  @Output() modelInfoLinkClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() commentFeedbackSubmitted: EventEmitter<CommentFeedback> =
    new EventEmitter<CommentFeedback>();
  @Output() animationsDone: EventEmitter<void> = new EventEmitter<void>();

  indicatorWidth = 13;
  indicatorHeight = 13;
  fontSize = 12;
  userFeedbackPromptText = 'Disagree?';

  public configurationEnum = Configuration;
  public configuration = this.configurationEnum.DEMO_SITE;
  public loadingIconStyleConst = LoadingIconStyle;
  public score = 0;
  public currentLayerIndex = 0;
  private layerAnimationHandles: HTMLElement[] = [];
  private layerAnimationSelectors: string[] = [
    '#layer1', '#layer2', '#layer3'
  ];

  private showFeedbackQuestion = false;
  isLoading = false;
  public isPlayingLoadingAnimation = false;
  public isPlayingFadeDetailsAnimation = false;
  public isPlayingShowOrHideLoadingWidgetAnimation = false;
  public shouldHideStatusWidget = false;
  public currentShape: Shape = Shape.CIRCLE;
  public currentEmoji: Emoji = Emoji.SMILE;
  private showingMoreInfo = false;
  @ViewChild('circleSquareDiamondWidget', {static: false}) private circleSquareDiamondWidget: ElementRef;
  @ViewChild('emojiStatusWidget', {static: false}) private emojiWidget: ElementRef;
  @ViewChild('widgetContainer', {static: false}) private container: ElementRef;
  @ViewChild('smileEmoji', {static: false}) private smileEmoji: ElementRef;
  @ViewChild('neutralEmoji', {static: false}) private neutralEmoji: ElementRef;
  @ViewChild('sadEmoji', {static: false}) private sadEmoji: ElementRef;
  private widgetElement: HTMLElement|null = null;
  private layerTextContainer: HTMLElement;
  private interactiveLayerControlsContainer: HTMLElement;
  public layersAnimating = false;
  private layerHeightPixels: number;
  // Animation being used to update the display settings of the demo. This
  // should not be used for a loading animation.
  private updateDemoSettingsAnimation: any;
  private isPlayingUpdateShapeAnimation: boolean;
  private updateStatusWidgetVisibilityAnimation: TimelineMax;
  hideEmojiIconsForLoadingAnimation = false;
  // Promise that should resolve once this.widget has been initialized.
  private widgetReady: Promise<void>;

  /** Variables to store state change flags to use in ngAfterViewChecked. */
  private loadingIconStyleChanged = false;
  private scoreThresholdsChanged = false;

  private showFeedbackChanged = false;
  private gradientColorsChanged = false;

  private stateChangeAnimations: TimelineMax|null = null;
  private isPlayingStateChangeAnimations = false;
  private pendingPostLoadingStateChangeAnimations: TimelineMax|null = null;
  private isPlayingPostLoadingStateChangeAnimations = false;
  private currentStateChangeAnimationId = 0;
  private gradientColorScale: string[];

  // Promise for any pending animations. New animations will be chained to this
  // Promise.
  private animationPromise: Promise<number> = Promise.resolve(0);
  // Keeps track of the number of animations that are queued or in progress.
  private pendingAnimationCount = 0;

  // Copy enum to class for data binding.
  readonly Emoji = Emoji;

  // Inject ngZone so that we can call ngZone.run() to re-enter the angular
  // zone inside gsap animation callbacks.
  constructor(private ngZone: NgZone, private elementRef: ElementRef) {
  }

  ngOnInit() {
    this.configuration = this.getConfigurationFromInputString(this.configurationInput);

    // TODO: Investigate changing these to ViewChildren/replacing
    // calls to querySelector, if possible.
    for (const layerAnimationSelector of this.layerAnimationSelectors) {
      this.layerAnimationHandles.push(
        this.elementRef.nativeElement.querySelector(layerAnimationSelector));
    }
    this.updateLayerElementContainers();

    this.updateGradient();
  }

  ngAfterViewInit() {
    // The Promise.resolve().then is required to prevent
    // ExpressionChangedAfterItHasBeenCheck errors.
    this.widgetReady = Promise.resolve().then(() => {
      this.updateWidgetElement();
      this.playAnimation(this.getUpdateWidgetStateAnimation());
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Return if ngOnInit has not been called yet, since the animation code
    // cannot run.
    if (this.widgetElement === null
      || this.container === undefined
      || this.layerTextContainer === undefined
      || this.interactiveLayerControlsContainer === undefined) {
      return;
    }

    if (changes['loadingIconStyle'] !== undefined) {
      console.debug('Loading icon style change:', changes['loadingIconStyle']);
      this.loadingIconStyleChanged = true;
    }

    if (changes['gradientColors'] !== undefined) {
      console.debug('Change in gradientColors');
      this.updateGradient();
      this.gradientColorsChanged = true;
    }

    if (changes['configurationInput'] !== undefined) {
      this.configuration = this.getConfigurationFromInputString(this.configurationInput);
      this.resetLayers();
    }

    if (changes['neutralScoreThreshold'] || changes['toxicScoreThreshold']) {
      console.debug('Change in scoreThresholds');

      this.updateGradient();

      // Kill any prior animations so that the resetting any animation state
      // will not get overridden by the old animation before the new one can
      // begin; this can lead to bugs.
      if (this.updateDemoSettingsAnimation) {
        console.debug('Killing update demo settings animation');
        this.updateDemoSettingsAnimation.kill();
      }
      this.scoreThresholdsChanged = true;
    }

    if (changes['showFeedbackForLowScores']
        || changes['showFeedbackForNeutralScors']) {
      this.showFeedbackChanged = true;
    }
  }

  /**
   * Make any animation changes that require ViewChild updates in this lifecycle
   * callback, to ensure that the ViewChild has been updated.
   */
  ngAfterViewChecked() {
    if (this.scoreThresholdsChanged
        || this.gradientColorsChanged
        || this.loadingIconStyleChanged
        || this.showFeedbackChanged) {

      // Kill any pending state change animations, since those are for an
      // out-of-date state.
      if (this.isPlayingStateChangeAnimations) {
        this.stateChangeAnimations.kill();
        console.debug('Killing pending state change animation.');
      } else if (this.isPlayingPostLoadingStateChangeAnimations) {
        this.pendingPostLoadingStateChangeAnimations.kill();
        this.isPlayingPostLoadingStateChangeAnimations = false;
        console.debug('Killing pending post-loading state change animation');
      }

      // Animations to run immediately.
      const afterChangesTimeline = new TimelineMax({
        onStart: () => {
          this.ngZone.run(() => {
            this.isPlayingStateChangeAnimations = true;
            console.debug('Starting state change animation');
          });
        },
        onComplete: () => {
          this.ngZone.run(() => {
            this.isPlayingStateChangeAnimations = false;
            console.debug('Completing state change animation');
          });
        }
      });

      if (this.isLoading) {
        // Animations to run after any pending loading finishes.
        this.pendingPostLoadingStateChangeAnimations = new TimelineMax({
          onStart: () => {
            this.ngZone.run(() => {
              this.isPlayingPostLoadingStateChangeAnimations = true;
              console.debug('Started postLoadingStateChangeAnimations');
            });
          },
          onComplete: () => {
            this.ngZone.run(() => {
              this.isPlayingPostLoadingStateChangeAnimations = false;
              console.debug('Completing postLoadingStateChangeAnimations');
            });
          }
        });
      } else {
        this.pendingPostLoadingStateChangeAnimations = null;
      }

      // Run in a Promise resolve statement so we don't get an
      // ExpressionChangedAfterItHasBeenCheckedError.
      Promise.resolve().then(() => {
        if (this.gradientColorsChanged) {
          this.gradientColorsChanged = false;
          if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
            const updateGradientAnimation =
              this.getUpdateGradientColorAnimation(0.1);
            if (this.isLoading) {
              this.pendingPostLoadingStateChangeAnimations.add(updateGradientAnimation);
            } else {
              afterChangesTimeline.add(updateGradientAnimation);
            }
          }
        }
        if (this.showFeedbackChanged) {
          this.showFeedbackChanged = false;
          console.debug('Setting showFeedbackChanged to false');

          // Don't do anything if the loadingIconStyle has also changed, since
          // that animation will override animations to do here.
          if (!this.loadingIconStyleChanged) {
            // Call getUpdateWidgetStateAnimation to update the visibility and x
            // position of all elements.
            if (this.isLoading) {
              this.pendingPostLoadingStateChangeAnimations.add(
                this.getUpdateWidgetStateAnimation());
            } else {
              afterChangesTimeline.add(
                this.getUpdateWidgetStateAnimation());
            }
          }
        }

        if (this.loadingIconStyleChanged) {
          this.updateWidgetElement();
          // If the previous loading icon was already hidden, we should update
          // the position of the new one to match, so transition animations
          // work correctly. We also update the opacity.
          if (this.shouldHideStatusWidget) {
            if (this.widgetElement !== null) {
              this.widgetElement.style.transform =
                'matrix(1,0,0,1,' + (-1 * (this.indicatorWidth + WIDGET_PADDING_PX + WIDGET_RIGHT_MARGIN_PX)) + ',0)';
              this.widgetElement.style.opacity = '0';
            }
          }
          console.debug('Setting loadingIconStyleChanged to false');
          this.loadingIconStyleChanged = false;
          const loadingIconStyleChangedTimeline = new TimelineMax({});
          // TODO: Determine whether this covers all cases regarding the correct
          // x position of elements, or if more animations are needed here.
          loadingIconStyleChangedTimeline.add(this.getUpdateWidgetStateAnimation());
          if (this.isLoading) {
            this.pendingPostLoadingStateChangeAnimations.add(
              loadingIconStyleChangedTimeline);
          } else {
            afterChangesTimeline.add(loadingIconStyleChangedTimeline);
          }
        } else if (this.scoreThresholdsChanged) {
          console.debug('Setting scoreThresholdsChanged to false');
          this.scoreThresholdsChanged = false;
          this.updateDemoSettingsAnimation = this.getUpdateWidgetStateAnimation();
          if (this.isLoading) {
            this.pendingPostLoadingStateChangeAnimations.add(
              this.updateDemoSettingsAnimation);
          } else {
            afterChangesTimeline.add(this.updateDemoSettingsAnimation);
          }
        }

        this.stateChangeAnimations = afterChangesTimeline;
        this.playAnimation(this.stateChangeAnimations);
      });
    }
  }

  // TODO: Alternative option: Make images into dataurls and put them directly
  // in the TS.
  getImageResourcePath(imageName): string {
    if (this.hasLocalAssets) {
      return 'assets/' + imageName;
    } else {
      return 'https://storage.googleapis.com/checker_source/assets/' + imageName;
    }
  }

  getFirstGradientRatio(): number {
    return FIRST_GRADIENT_RATIO;
  }

  getAdjustedGradientControlPoints(gradientPointCount: number): number[] {
    // Points along a gradient of size |gradientPointCount| at which to add
    // colors. The first part of the gradient is not linear, and instead moves
    // from color 1 to color 2 with the ratio FIRST_GRADIENT_RATIO.
    // Use Math.floor because control points have to be integers.
    const gradientPoints = [
      Math.floor(
        gradientPointCount * (FIRST_GRADIENT_RATIO * this.neutralScoreThreshold)),
      Math.floor(gradientPointCount * this.neutralScoreThreshold),
      Math.floor(gradientPointCount * this.toxicScoreThreshold)
    ];

    // If two gradient colors are added at the same point (e.g.
    // gradientPoints[i] === gradientPoints[i + 1], which happens when
    // neutralScoreThreshold === toxicScoreThreshold or
    // neutralScoreThreshold === 0), the toxiclibsjs library does not
    // automatically favor the correct color. Add deltas to the gradient points
    // that favor the color for the higher threshold at that point.
    //
    // Examples:
    //   [50, 90, 90] => [50, 89, 90]
    //   [50, 50, 99] => [49, 50, 99]
    //   [50, 50, 50] => [48, 49, 50]
    const gradientPointDeltas: number[] = [];
    for (let i = gradientPoints.length - 1; i >= 0; i--) {
      if (gradientPoints[i] >= gradientPoints[i + 1]) {
        gradientPoints[i] -= (gradientPoints[i] - gradientPoints[i + 1] + 1);
      }
    }
    return gradientPoints;
  }

  /**
   * Updates the gradient color scale for the shape based on the
   * score thresholds.
   */
  updateGradient() {
    // The number of points to use to calculate the gradient.
    const gradientPointCount = 100;

    const gradientPoints = this.getAdjustedGradientControlPoints(gradientPointCount);
    const sliderGradient = new toxicLibsJS.color.ColorGradient();

    for (let i = 0; i < gradientPoints.length; i++) {
      // If the gradient point is less than 0, it means neutralScoreThreshold
      // === 0 or toxicScoreThreshold === neutralScoreThreshold === 0, in
      // which case we start at the higher indexed gradient color since it has
      // effectively been overridden by the higher toxicity threshold.
      if (gradientPoints[i] >= 0) {
        sliderGradient.addColorAt(
          gradientPoints[i],
          toxicLibsJS.color.TColor.newHex(this.gradientColors[i]));
      }
    }

    this.gradientColorScale =
      sliderGradient.calcGradient(0, gradientPointCount).colors
        .map((tColor) => tColor.toRGBCSS());
  }

  interpolateColors(score: number): string {
    // Find the two color indices to interpolate between, and prevent overflow
    // if the score >= 1 by just using the color at the last index.
    const scoreLowerIndex = Math.min(
      Math.floor(score * 100), this.gradientColorScale.length - 1);
    const scoreUpperIndex = Math.min(
      Math.ceil(score * 100), this.gradientColorScale.length - 1);

    const interpolatorFn = d3.interpolateRgb(
      this.gradientColorScale[scoreLowerIndex],
      this.gradientColorScale[scoreUpperIndex]);
    return interpolatorFn((score * 100) - scoreLowerIndex);
  }

  private updateWidgetElement(): void {
    if (this.circleSquareDiamondWidget != null) {
      this.widgetElement = this.circleSquareDiamondWidget.nativeElement;
    } else if (this.emojiWidget != null) {
      this.widgetElement = this.emojiWidget.nativeElement;
    } else {
      console.error('Widget element is null.');
      this.widgetElement = null;
    }
  }

  private getShouldHideStatusWidget(): boolean {
    let shouldHide = this.loadingIconStyle === LoadingIconStyle.NONE;

    if (!this.showFeedbackForLowScores) {
      shouldHide = shouldHide || this.score < this.neutralScoreThreshold;
    }

    if (!this.showFeedbackForNeutralScores) {
      shouldHide = shouldHide || (
        this.score >= this.neutralScoreThreshold
        && this.score < this.toxicScoreThreshold);
    }

    return shouldHide;
  }

  private getUpdateStatusWidgetVisibilityAnimation(): TimelineMax {
    const hide = this.getShouldHideStatusWidget();

    let forceAnimation = false;
    if (this.isPlayingShowOrHideLoadingWidgetAnimation) {
      // Note: This happens when more than one of these animations are
      // constructed back to back, before the first has started, or if an
      // animation is killed before it can complete. In these cases we always
      // want to return the full desired animation, not the empty one.
      console.debug('Calling getUpdateStatusWidgetVisibility while '
                    + 'isPlayingShowOrHideLoadingWidgetAnimation = true. ');
      forceAnimation = true;
    }

    // If nothing has changed, return an empty animation.
    if (hide === this.shouldHideStatusWidget && !forceAnimation) {
      console.debug('Returning without update status widget visibility animation.');
      return new TimelineMax({});
    } else {
      console.debug('Getting update status widget visibility animation.');
    }

    this.isPlayingShowOrHideLoadingWidgetAnimation = true;
    const updateStatusWidgetVisibilityAnimation = new TimelineMax({
      onStart: () => {
        this.ngZone.run(() => {
          console.debug('Updating status widget visibility to '
                        + (hide ? 'hidden' : 'visible') + ' from '
                        + (this.shouldHideStatusWidget ? 'hidden' : 'visible'));
          // Disable hiding so animations will show up.
          this.shouldHideStatusWidget = false;
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Changing status widget visibility complete, hide=', hide);
          this.isPlayingShowOrHideLoadingWidgetAnimation = false;
          this.shouldHideStatusWidget = hide;
        });
      }
    });
    updateStatusWidgetVisibilityAnimation.add([
      this.getChangeLoadingIconVisibilityAnimation(hide),
      this.getChangeLoadingIconXValueAnimation(hide)]);
    return updateStatusWidgetVisibilityAnimation;
  }

  private getChangeLoadingIconVisibilityAnimation(hide: boolean): TweenMax {
    return TweenMax.to(
      this.widgetElement, FADE_WIDGET_TIME_SECONDS, { opacity: hide ? 0 : 1});
  }

  private getSetIconToNeutralStateAnimation(): TimelineMax {
    const timeline = new TimelineMax({});

    if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
      timeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
      timeline.add(this.getTransitionToCircleAnimation(
        SHAPE_MORPH_TIME_SECONDS, NEUTRAL_GRAY_COLOR));
    } else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
      timeline.add(this.getHideEmojisAnimation());
      timeline.add(this.getChangeColorAnimation(
        QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, NEUTRAL_GRAY_COLOR));
    }

    return timeline;
  }


  private getChangeLoadingIconXValueAnimation(hide: boolean): TimelineMax {
    const timeline = new TimelineMax({});
    const translateXAnimations: Animation[] = [];
    translateXAnimations.push(
      TweenMax.to(this.widgetElement, FADE_WIDGET_TIME_SECONDS,
                  { x: hide ? -1 * (this.indicatorWidth
                                    + WIDGET_PADDING_PX
                                    + WIDGET_RIGHT_MARGIN_PX)
                            : 0}));
    if (this.configuration === Configuration.DEMO_SITE) {
      // Also shift the text for the leftmost element in each layer left/right
      // as needed. Even though only layer 0 is visible when the score changes,
      // the elements in the rest of the layers need to be adjusted to match
      // for when we transition to other layers.
      const layer0TextContainer = this.elementRef.nativeElement.querySelector(
          this.layerAnimationSelectors[0] + ' .layerText');
      const layer1TextContainer = this.elementRef.nativeElement.querySelector(
          this.layerAnimationSelectors[1] + ' .layerText');
      const layer2InteractiveContainer =
        this.elementRef.nativeElement.querySelector(
          this.layerAnimationSelectors[2] + ' .interactiveElement');
      const translateXSettings = {
        x: hide ? -1 * (this.indicatorWidth
                        + WIDGET_PADDING_PX
                        + WIDGET_RIGHT_MARGIN_PX)
                : 0
      };
      translateXAnimations.push(
        TweenMax.to(layer0TextContainer,
                    FADE_WIDGET_TIME_SECONDS,
                    translateXSettings));
      translateXAnimations.push(
        TweenMax.to(layer1TextContainer,
                    FADE_WIDGET_TIME_SECONDS,
                    translateXSettings));
      translateXAnimations.push(
        TweenMax.to(layer2InteractiveContainer,
                    FADE_WIDGET_TIME_SECONDS,
                    translateXSettings));
    }
    timeline.add(translateXAnimations);
    return timeline;
  }

  private getConfigurationFromInputString(inputString: string): Configuration {
    return Configuration.DEMO_SITE;
  }

  private updateLayerElementContainers(): void {
    this.layerTextContainer = this.elementRef.nativeElement.querySelector(
          this.layerAnimationSelectors[this.currentLayerIndex] + ' .layerText');
    this.interactiveLayerControlsContainer =
      this.elementRef.nativeElement.querySelector(
        this.layerAnimationSelectors[this.currentLayerIndex]
        + ' .interactiveElement');
  }

  shouldShowFeedback(score: number) {
    if (score < this.neutralScoreThreshold) {
      return this.showFeedbackForLowScores;
    } else if (score < this.toxicScoreThreshold) {
      return this.showFeedbackForNeutralScores;
    }
    return true;
  }

  // If the text contains the replacement string "x%", replace it with the
  // actual percentage from the score.
  formatFeedbackMessage(text: string) {
    return text.replace('x%', `${(this.score * 100).toFixed(2)}%`);
  }

  getFeedbackTextForScore(score: number): string {
    let feedbackText;
    if (score >= this.toxicScoreThreshold) {
      feedbackText = this.feedbackText[2];
    } else if (score >= this.neutralScoreThreshold) {
      feedbackText = this.feedbackText[1];
    } else {
      feedbackText = this.feedbackText[0];
    }
    return this.formatFeedbackMessage(feedbackText);
  }

  feedbackContainerClicked() {
    console.log('feedbackContainerClicked');
    if (this.configuration === Configuration.DEMO_SITE) {
      this.playAnimation(
        this.getTransitionToLayerAnimation(1, LAYER_TRANSITION_TIME_SECONDS));
    }
  }

  feedbackCompleted(success: boolean) {
    if (success) {
      this.feedbackRequestSubmitted = true;
    } else {
      this.feedbackRequestError = true;
    }
    if (this.configuration === Configuration.DEMO_SITE) {
      const feedbackCompletedTimeline = new TimelineMax({});

      feedbackCompletedTimeline.add([
        this.getTransitionToLayerAnimation(2, LAYER_TRANSITION_TIME_SECONDS),
        this.getSetIconToNeutralStateAnimation()
      ]);

      this.playAnimation(feedbackCompletedTimeline);
    }
  }

  hideFeedbackQuestion() {
    this.showFeedbackQuestion = false;
  }

  resetFeedback() {
    this.showFeedbackQuestion = false;
    this.feedbackRequestInProgress = false;
    this.feedbackRequestSubmitted = false;
    this.feedbackRequestError = false;
  }

  resetLayers() {
    this.resetFeedback();
    const resetAnimationTimeline = new TimelineMax({});
    resetAnimationTimeline.add(this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
    resetAnimationTimeline.add(this.getUpdateWidgetStateAnimation());
    this.playAnimation(resetAnimationTimeline);
  }

  submitFeedback(commentIsToxic: boolean) {
    this.feedbackRequestError = false;
    this.commentFeedbackSubmitted.emit({commentMarkedAsToxic: commentIsToxic});
  }

  getResetRotationAnimation(): TweenMax {
    return TweenMax.to(this.widgetElement, 0.1, {
      rotation: this.currentShape === Shape.DIAMOND ? 45 : 0,
    });

  }

  // Gets the shape corresponding to the specified score.
  getShapeForScore(score: number): Shape {
    if (score >= this.toxicScoreThreshold) {
      return Shape.DIAMOND;
    } else if (score >= this.neutralScoreThreshold) {
      return Shape.SQUARE;
    } else {
      return Shape.CIRCLE;
    }
  }

  // Gets the emoji corresponding to the specified score.
  getEmojiForScore(score: number): Emoji {
    if (score >= this.toxicScoreThreshold) {
      return Emoji.SAD;
    } else if (score >= this.neutralScoreThreshold) {
      return Emoji.NEUTRAL;
    } else {
      return Emoji.SMILE;
    }
  }

  getUpdateShapeAnimation(score: number): TimelineMax {
    if (this.loadingIconStyle !== LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
      console.debug('Calling getUpdateShapeAnimation(), but the loading icon'
                    + 'style is not set to circle/square/diamond. Returning an'
                    + 'empty timeline.');
      // The loading icon state has been changed; return an empty timeline.
      // This is not an error and can happen when the loading icon state is
      // changed via data binding while the loading animation is active.
      return new TimelineMax({});
    }
    const updateShapeAnimationTimeline = new TimelineMax({
      onStart: () => {
        this.isPlayingUpdateShapeAnimation = true;
      },
      onComplete: () => {
        this.isPlayingUpdateShapeAnimation = false;
      },
    });

    // Shrink before updating to a new shape.
    updateShapeAnimationTimeline.add(
      this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));

    if (score >= this.toxicScoreThreshold) {
      updateShapeAnimationTimeline.add(
        this.getTransitionToDiamondAnimation(.8 * SHAPE_MORPH_TIME_SECONDS));
    } else if (score >= this.neutralScoreThreshold) {
      // Square is a special case, since we rotate based on the current degrees
      // and not to a specific rotation. As a result this can get messed up if
      // we're in the middle of an existing rotation, so reset the rotation
      // accordingly before animating to prevent this bug.
      // Note that this only works if the previous animation gets killed first.
      // TODO: Figure out a more general way to prevent this bug for all cases,
      // not just when customizing the demo. It seems to happen occasionally in
      // the wild as well.
      if (this.isPlayingUpdateShapeAnimation) {
        console.debug('Starting updateShapeAnimation to square while in the'
                      + ' middle of an existing updateShapeAnimation or before'
                      + ' the previous animation was able to finish; resetting'
                      + ' rotation state');
        updateShapeAnimationTimeline.add(this.getResetRotationAnimation());
      }
      updateShapeAnimationTimeline.add(
        this.getTransitionToSquareAnimation(SHAPE_MORPH_TIME_SECONDS));
    } else {
      updateShapeAnimationTimeline.add(
        this.getTransitionToCircleAnimation(SHAPE_MORPH_TIME_SECONDS));
    }

    return updateShapeAnimationTimeline;
  }

  setShowMoreInfo(showMoreInfo: boolean) {
    this.playAnimation(this.getTransitionToLayerAnimation(
      showMoreInfo ? 1 : 0, LAYER_TRANSITION_TIME_SECONDS));
  }

  getAccessibilityDescriptionForEmoji(emoji: Emoji): string {
    if (emoji === Emoji.SMILE) {
      return 'Smile emoji';
    } else if (emoji === Emoji.NEUTRAL) {
      return 'Neutral emoji';
    } else {
      return 'Sad emoji';
    }
  }

  getEmojiElementFromEmojiType(emojiType: Emoji): HTMLElement {
    if (emojiType === Emoji.SMILE) {
      return this.smileEmoji.nativeElement;
    } else if (emojiType === Emoji.NEUTRAL) {
      return this.neutralEmoji.nativeElement;
    } else {
      return this.sadEmoji.nativeElement;
    }
  }

  getAnimationA11yLabel(loadingIconStyle: string,
                        isPlayingLoadingAnimation: boolean): string {
    if (isPlayingLoadingAnimation) {
      return 'Computing score animation';
    } else if (loadingIconStyle === LoadingIconStyle.EMOJI) {
      return this.getAccessibilityDescriptionForEmoji(this.currentEmoji);
    } else if (loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
      return this.getAccessibilityDescriptionForShape(this.currentShape);
    } else {
      return ''; // There is no animation if the LoadingIconStyle is NONE.
    }
  }

  notifyModelInfoLinkClicked(): void {
    this.modelInfoLinkClicked.emit();
  }

  getUpdateWidgetStateAnimation(): TimelineMax {
    const updateScoreCompletedTimeline = new TimelineMax({
      onStart: () => {
        this.ngZone.run(() => {
          console.debug('Starting animation for getUpdateWidgetStateAnimation');
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Completing animation for getUpdateWidgetStateAnimation');
          this.scoreChangeAnimationCompleted.emit();
        });
      }
    });
    if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND
        || this.loadingIconStyle === LoadingIconStyle.NONE) {
      console.debug('Update widget state for default style');
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation());
      updateScoreCompletedTimeline.add(this.getUpdateShapeAnimation(this.score));
      return updateScoreCompletedTimeline;
    } else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
      console.debug('Update widget state for emoji style');
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation());
      updateScoreCompletedTimeline.add(this.getShowEmojiAnimation());
      return updateScoreCompletedTimeline;
    } else {
      console.error('Calling updateWidgetState for unknown loadingIconStyle: '
                    + this.loadingIconStyle);
      return new TimelineMax({});
    }
  }

  /**
   * Returns a Promise that resolves when the score change animation completes.
   *
   * TODO: I'm not sure there's a huge benefit to returning a Promise (or even
   * an Observable) here rather than having the caller listen on the
   * animationsDone EventEmitter directly.
   */
  async notifyScoreChange(score: number): Promise<void> {
    console.debug('Setting this.score =', score);
    this.score = score;
    if (this.isPlayingLoadingAnimation) {
      // Loading just ended.
      this.setLoading(false);
    } else {
      // This indicates that the score was reset without being the result of a
      // load completing, such as the text being cleared.
      console.debug('Updating shape from notifyScoreChange');
      this.playAnimation(this.getUpdateWidgetStateAnimation());
    }
    return new Promise<void>((resolve, reject) => {
      this.animationsDone.pipe(take(1)).subscribe(() => { resolve(); });
    });
  }

  /**
   * Updates the internal loading state, and kicks off asynchronous animations
   * to reflect the change. Returns a Promise that resolves when the animations
   * complete.
   */
  async setLoading(loading: boolean): Promise<void> {
    console.debug('Calling setLoading(' + loading + ')');
    return new Promise<void>((resolve, reject) => {
      this.widgetReady.then(async () => {
        if (this.widgetElement === null) {
          console.error('this.widgetElement = null in call to setLoading');
          return;
        }
        this.isLoading = loading;
        if (!this.isPlayingLoadingAnimation) {
          if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND
              || this.loadingIconStyle === LoadingIconStyle.NONE) {
            this.setLoadingForDefaultWidget();
          } else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
            this.setLoadingForEmojiWidget();
          } else {
            console.error(
              'Calling setLoading for unknown loadingIconStyle: ' + this.loadingIconStyle);
          }
        }
        this.animationsDone.pipe(take(1)).subscribe(() => { resolve(); });
      });
    });
  }

  getChangeOpacityAnimation(element: HTMLElement, timeSeconds: number,
                            opacity: number): TweenMax {
    return TweenMax.to(element, timeSeconds, { opacity: opacity});
  }

  getShowEmojiAnimation(): TimelineMax {
    if (this.loadingIconStyle !== LoadingIconStyle.EMOJI) {
      console.debug('Calling getShowEmojiAnimation() but loading icon style is'
                    + 'not emoji style, returning an empty timeline');
      // The loading icon state has been changed; return an empty timeline.
      // This is not an error and can happen when the loading icon state is
      // changed via data binding while the loading animation is active.
      return new TimelineMax({});
    }
    let emojiType: Emoji|null = null;
    if (this.score >= this.toxicScoreThreshold) {
      emojiType = Emoji.SAD;
    } else if (this.score >= this.neutralScoreThreshold) {
      emojiType = Emoji.NEUTRAL;
    } else {
      emojiType = Emoji.SMILE;
    }

    const emojiElementToShow = this.getEmojiElementFromEmojiType(emojiType);
    const showEmojiTimeline = new TimelineMax({
      onStart: () => {
        this.ngZone.run(() => {
          this.hideEmojiIconsForLoadingAnimation = false;
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          this.currentEmoji = emojiType;
        });
      }
    });

    // Updates the background color to yellow (it could be gray from being in a
    // neutral state).
    const resetBackgroundColorAnimation = this.getChangeColorAnimation(
      QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, EMOJI_COLOR);

    showEmojiTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
    showEmojiTimeline.add([
      resetBackgroundColorAnimation,
      this.getToFullScaleBounceAnimation(EMOJI_BOUNCE_IN_TIME_SECONDS),
      this.getChangeOpacityAnimation(emojiElementToShow, FADE_EMOJI_TIME_SECONDS, 1)]);

    return showEmojiTimeline;
  }

  getHideEmojisAnimation(): TimelineMax {
    const hideEmojiTimeline = new TimelineMax({
      onComplete: () => {
        this.ngZone.run(() => {
          this.hideEmojiIconsForLoadingAnimation = true;
        });
      }
    });
    hideEmojiTimeline.add([
      this.getChangeOpacityAnimation(
        this.smileEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0),
      this.getChangeOpacityAnimation(
        this.neutralEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0),
      this.getChangeOpacityAnimation(
        this.sadEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0)
    ]);
    return hideEmojiTimeline;
  }

  /** Loading animations to play before loading starts for emoji-style loading. */
  getStartAnimationsForEmojiWidgetLoading(): TimelineMax {
    const loadingStartTimeline = new TimelineMax({});
    // Reset to the first layer if we're not already there.
    if (this.currentLayerIndex !== 0) {
      loadingStartTimeline.add(
        this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
    }
    // Update visibility of the emoji icon before starting; it could have
    // disappeared due to certain settings, and in some of these cases it
    // needs to reappear before loading animation begins.
    loadingStartTimeline.add(
      this.getUpdateStatusWidgetVisibilityAnimation());

    loadingStartTimeline.add(
      this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
    loadingStartTimeline.add([
      this.getHideEmojisAnimation(),
      // Change color of the emoji background back to the yellow color before
      // the main loading (it could be gray from being in a neutral state).
      this.getChangeColorAnimation(
        COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, EMOJI_COLOR)
    ]);

    return loadingStartTimeline;
  }

  /** Loopable loading animations to play for emoji-style loading. */
  getLoopAnimationForEmojiWidgetLoading(): TimelineMax {
    const shrinkAndFadeTimeline = new TimelineMax({
      // Apply ease
      ease: Power3.easeInOut
    });
    shrinkAndFadeTimeline.add(
      this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
    return shrinkAndFadeTimeline;
  }

  /** Loading animations to play when loading finishes for emoji-style loading. */
  getEndAnimationsForEmojiWidgetLoading(loadingTimeline: TimelineMax): TimelineMax {
    const loadingEndTimeline = new TimelineMax({
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Setting this.isPlayingLoadingAnimation = false (emoji)');
          this.isPlayingLoadingAnimation = false;
          loadingTimeline.clear();
          this.scoreChangeAnimationCompleted.emit();
          if (this.isLoading) {
            // If we finish the end loading animation and we're supposed
            // to be loading again, restart the loading animation!
            console.debug('Restarting loading from ending animation completion');
            this.setLoading(true);
          } else if (this.currentEmoji !== this.getEmojiForScore(this.score)) {
            // The score has changed between now and when the animation
            // started (the emoji is no longer valid).
            console.debug(
              'Load ending animation completed, found an out of date shape');
            this.notifyScoreChange(this.score);
          }
        });
      }
    });
    const scoreCompletedAnimations: Animation[] = [];
    scoreCompletedAnimations.push(this.getShowEmojiAnimation());
    scoreCompletedAnimations.push(
      this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));

    // If we're revealing the status widget, play the reveal animation
    // before the update emoji animation.
    if (!this.getShouldHideStatusWidget()) {
      loadingEndTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation());
    }

    loadingEndTimeline.add(scoreCompletedAnimations);

    // If we're hiding the status widget, play the hide widget
    // animation after the update emoji animation.
    if (this.getShouldHideStatusWidget()) {
      loadingEndTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation());
    }

    if (this.pendingPostLoadingStateChangeAnimations) {
      loadingEndTimeline.add(
        this.pendingPostLoadingStateChangeAnimations);
    }
    return loadingEndTimeline;
  }

  /**
   * Loading animations to play before loading starts for
   * circle/square/diamond-style loading.
   */
  getStartAnimationsForCircleSquareDiamondWidgetLoading(): TimelineMax {
    const startAnimationsTimeline = new TimelineMax({
      align: 'sequence',
    });

    // Start animations happen in three groups. Group 0 animations before
    // group 1, which animates before group 2. The animations within each
    // group start at the same time.
    const startAnimationsGroup0: Animation[] = [];
    const startAnimationsGroup1: Animation[] = [];
    const startAnimationsGroup2: Animation[] = [];

    // Update visibility of the status widget before starting; it could have
    // disappeared due to certain settings, and in some of these cases it
    // needs to reappear before loading animation begins.
    startAnimationsGroup0.push(
      this.getUpdateStatusWidgetVisibilityAnimation());

    startAnimationsGroup2.push(
    this.getToGrayScaleAnimation(GRAYSCALE_ANIMATION_TIME_SECONDS));
    if (this.currentLayerIndex !== 0) {
      startAnimationsGroup1.push(
        this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
    }

    startAnimationsGroup2.push(
      this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
    startAnimationsTimeline.add(startAnimationsGroup0);
    startAnimationsTimeline.add(startAnimationsGroup1);
    startAnimationsTimeline.add(startAnimationsGroup2);
    return startAnimationsTimeline;
  }

  /**
   * Main loading animation to play on loop for the circle/square/diamond style
   * loading.
   */
  getLoopAnimationsForCircleSquareDiamondWidgetLoading(): TimelineMax {
    const shrinkAndFadeTimeline = new TimelineMax({
      // Apply ease.
      ease: Power3.easeInOut
    });
    shrinkAndFadeTimeline.add(
      this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
    return shrinkAndFadeTimeline;
  }

  /**
   * Loading animations to play when loading finishes for
   * circle/square/diamond-style loading.
   */
  getEndAnimationsForCircleSquareDiamondWidgetLoading(
      loadingTimeline: TimelineMax): TimelineMax {
    const updateScoreCompletedTimeline = new TimelineMax({
      onStart: () => {
        console.debug('Score change animation start');
      },
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Score change animation end');
          console.debug('Clearing loadingTimeline');
          this.isPlayingLoadingAnimation = false;
          loadingTimeline.clear();
          this.scoreChangeAnimationCompleted.emit();
          if (this.isLoading) {
            // If we finish the end loading animation and we're supposed
            // to be loading again, restart the loading animation!
            console.debug('Restarting loading from ending animation completion');
            this.setLoading(true);
          } else if (this.currentShape !== this.getShapeForScore(this.score)) {
            // The score has changed between now and when the animation
            // started (the shape is no longer valid).
            console.debug(
              'Load ending animation completed, found an out of date shape');
            this.notifyScoreChange(this.score);
          }
        });
      }
    });
    const scoreCompletedAnimations: Animation[] = [];
    scoreCompletedAnimations.push(
      this.getUpdateShapeAnimation(this.score));

    scoreCompletedAnimations.push(
      this.getFadeDetailsAnimation(
        FADE_DETAILS_TIME_SECONDS, false, 0));

    // If we're revealing the status widget, play the reveal animation
    // before the update shape animation.
    if (!this.getShouldHideStatusWidget()) {
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation());
    }

    updateScoreCompletedTimeline.add(scoreCompletedAnimations);

    // If we're hiding the status widget, play the hide widget
    // animation after the update shape animation.
    if (this.getShouldHideStatusWidget()) {
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation());
    }

    if (this.pendingPostLoadingStateChangeAnimations) {
      updateScoreCompletedTimeline.add(
        this.pendingPostLoadingStateChangeAnimations);
    }

    return updateScoreCompletedTimeline;
  }

  setLoadingForEmojiWidget(): void {
    this.isPlayingLoadingAnimation = true;
    const loadingTimeline = new TimelineMax({
      ease: Power3.easeInOut,
      onStart: () => {
        this.ngZone.run(() => {
          console.debug('Starting timeline (emoji)');
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Completing timeline (emoji)');
          if (this.isLoading) {
            console.debug('Restarting main emoji loading animation');
            this.seekPosition(loadingTimeline, EMOJI_MAIN_LOADING_ANIMATION_LABEL);
          } else {
            this.playAnimation(
              this.getEndAnimationsForEmojiWidgetLoading(loadingTimeline));
          }
        });
      }
    });

    loadingTimeline.add(this.getStartAnimationsForEmojiWidgetLoading());
    loadingTimeline.add(this.getLoopAnimationForEmojiWidgetLoading(),
                        EMOJI_MAIN_LOADING_ANIMATION_LABEL);
    this.playAnimation(loadingTimeline);
  }

  setLoadingForDefaultWidget(): void {
    console.debug('About to create loadingTimeline');
    // Set isPlayingLoadingAnimation = true here instead of in the onStart()
    // of the animation, so that the animation does not start twice if this
    // function gets called twice in rapid succession.
    this.isPlayingLoadingAnimation = true;

    const loadingTimeline = new TimelineMax({
      ease: Power3.easeInOut,
      onStart: () => {
        this.ngZone.run(() => {
          console.debug('Starting timeline');
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Completing timeline');
          console.debug('Updating shape from animation complete');
          if (this.isLoading) {
            // TODO: Consider the edge case where
            // isPlayingShowOrHideLoadingWidgetAnimation is true here. It's
            // not ever getting triggered in the existing logs and might not
            // be possible to hit now, but could become an issue later.
            console.debug('Restarting loading to fade animation.');
            this.seekPosition(loadingTimeline, FADE_START_LABEL);
          } else {
            console.debug('Loading complete');
            const updateScoreCompletedTimeline =
              this.getEndAnimationsForCircleSquareDiamondWidgetLoading(
                loadingTimeline);
            this.playAnimation(updateScoreCompletedTimeline);
          }
        });
      },
    });
    const startAnimationsTimeline =
      this.getStartAnimationsForCircleSquareDiamondWidgetLoading();
    loadingTimeline.add(startAnimationsTimeline, LOADING_START_ANIMATIONS_LABEL);

    loadingTimeline.add(
      this.getLoopAnimationsForCircleSquareDiamondWidgetLoading(), FADE_START_LABEL);
    this.playAnimation(loadingTimeline);
  }

  private getNameFromShape(shape: Shape): string {
    if (shape === Shape.CIRCLE) {
      return 'circle';
    } else if (shape === Shape.SQUARE) {
      return 'square';
    } else {
      return 'diamond';
    }
  }

  private getAccessibilityDescriptionForShape(shape: Shape): string {
    if (shape === Shape.CIRCLE) {
      return 'Low toxicity icon.';
    } else if (shape === Shape.SQUARE) {
      return 'Neutral toxicity icon.';
    } else {
      return 'High toxicity icon.';
    }
  }

  private getUpdateGradientColorAnimation(timeSeconds: number): TweenMax {
    return this.getChangeColorAnimation(
      timeSeconds, this.interpolateColors(this.score));
  }

  private getChangeColorAnimation(timeSeconds: number, color: string): TweenMax {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      backgroundColor: color,
    });
  }

  private getTransitionToCircleAnimation(timeSeconds: number, endColor?: string) {
    const circleAnimationTimeline = new TimelineMax({
      align: 'start',
      onStart: () => {
      },
      onComplete: () => {
      },
    });
    circleAnimationTimeline.add([
      this.getCircleAnimation(timeSeconds / 6, endColor),
      this.getToFullScaleBounceAnimation(timeSeconds)
    ]);
    return circleAnimationTimeline;
  }

  private getTransitionToSquareAnimation(timeSeconds: number) {
    const squareAnimationTimeline = new TimelineMax({
      onStart: () => {
        let currentRotation = 0;
        const currentWidgetTransform = (this.widgetElement as any)._gsTransform;
        if (currentWidgetTransform !== undefined) {
          currentRotation = currentWidgetTransform.rotation;
        }
        console.debug('getTransitionToSquare; Current rotation:', currentRotation);
      },
      onComplete: () => {
      },
    });
    const previousShape = this.currentShape;
    squareAnimationTimeline.add([
      this.getSquareAnimation(timeSeconds / 4),
      this.getToFullScaleCompleteRotationAnimation(timeSeconds, previousShape)
    ]);
    return squareAnimationTimeline;
  }

  private getTransitionToDiamondAnimation(timeSeconds: number) {
    const diamondAnimationTimeline = new TimelineMax({
      onStart: () => {
      },
      onComplete: () => {
      },
    });
    diamondAnimationTimeline.add([
      this.getDiamondAnimation(timeSeconds / 6),
      this.getToFullScaleAnimation(timeSeconds / 6),
    ]);
    diamondAnimationTimeline.add(
      this.getRotateBackAndForthAnimation(timeSeconds / 6, 85));
    diamondAnimationTimeline.add(
      this.getRotateBackAndForthAnimation(timeSeconds / 6, 5));
    diamondAnimationTimeline.add(
      this.getRotateBackAndForthAnimation(timeSeconds / 6, 65));
    diamondAnimationTimeline.add(
      this.getRotateBackAndForthAnimation(timeSeconds / 6, 25));
    diamondAnimationTimeline.add(
      this.getRotateBackAndForthAnimation(timeSeconds / 6, 45));
    return diamondAnimationTimeline;
  }

  private getRotateBackAndForthAnimation(timeSeconds: number, degrees: number) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      rotation: degrees,
      onStart: () => {
        console.debug('Starting rotate back and forth animation');
      },
      onComplete: () => {
        console.debug('Rotate back and forth animation completed');
      },
    });
  }

  private getToFullScaleBounceAnimation(timeSeconds: number) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      scaleX: 1,
      scaleY: 1,
      ease: Elastic.easeOut.config(1, 0.3),
      onStart: () => {
        console.debug('Starting get to full scale bounce animation');
      },
      onComplete: () => {
        console.debug('Get to full scale bounce animation completed');
      },
    });
  }

  private getToFullScaleAnimation(timeSeconds: number) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      scaleX: 1,
      scaleY: 1,
      onStart: () => {
        console.debug('Starting get to full scale animation');
      },
      onComplete: () => {
        console.debug('Get to full scale animation completed');
      },
    });
  }

  private getToFullScaleCompleteRotationAnimation(timeSeconds: number, fromShape: Shape) {
    let currentRotation = 0;
    const currentWidgetTransform = (this.widgetElement as any)._gsTransform;
    if (currentWidgetTransform !== undefined) {
      currentRotation = currentWidgetTransform.rotation;
    }
    console.debug('Current rotation:', currentRotation);
    console.debug('From shape:', this.getNameFromShape(fromShape));
    const rotationDegrees = fromShape === Shape.DIAMOND ? 315 : 360;
    return TweenMax.to(this.widgetElement, timeSeconds, {
      rotation: '+=' + rotationDegrees + '_ccw',
      scaleX: 1,
      scaleY: 1,
      ease: Elastic.easeOut.config(1, 0.3),
      onStart: () => {
        console.debug('Starting get to full scale complete rotation animation');
      },
      onComplete: () => {
        console.debug('Get to full scale complete rotation animation completed');
      },
    });
  }

  /**
   * Wrapper around Animation.seek() that increases the internal animation
   * count. This assumes that the animation was started with playAnimation().
   */
  private seekPosition(animation: Animation, label: string) {
    this.pendingAnimationCount++;
    animation.seek(label, true);
  }

  /** Wraps animations in Promises and chains them. */
  private playAnimation(animation: Animation): void {
    this.pendingAnimationCount++;

    console.debug('Increasing pending animation count to', this.pendingAnimationCount);

    const nextPromise = this.getPlayAnimationPromise(animation);

    // Chain animations to complete after the previous one.
    this.animationPromise = this.animationPromise.then(() => {
      return nextPromise;
    });
  }

  /**
   * Returns a Promise that resolves when the animation's onComplete() callback
   * is called.
   */
  private getPlayAnimationPromise(animation: Animation): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      // Override the onComplete callback to do anything already there and then
      // check the status of pending animations.
      const completedCallback = animation.eventCallback('onComplete');
      animation.eventCallback('onComplete', () => {
        // We have to re-enter the Angular zone before resolving (the
        // onComplete() callback is outside the zone) in order to
        // properly wait for the animations to complete.
        this.ngZone.run(() => {
          if (completedCallback !== undefined) {
            completedCallback();
          }
          this.pendingAnimationCount--;
          resolve();
          if (this.pendingAnimationCount === 0) {
            console.log('No pending animations left, emitting an event.');
            this.animationsDone.emit();
          } else if (this.pendingAnimationCount < 0) {
            console.error('Invalid state: this.pendingAnimationCount < 0.');
          } else {
            console.log(
              `Animation complete. There are ${this.pendingAnimationCount}`
              + ` pending animations left.`);
          }
        });
      });
      animation.play();
    });
  }

  private getTransitionToLayerAnimation(endLayerIndex: number, timeSeconds: number): Animation {
    this.layerHeightPixels = this.layerAnimationHandles[this.currentLayerIndex].offsetHeight;

    const timeline = new TimelineMax({
      onStart: () => {
        this.ngZone.run(() => {
          console.debug('Transitioning from layer ' + this.currentLayerIndex
                        + ' to layer ' + endLayerIndex);
          this.layersAnimating = true;
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          this.layersAnimating = false;
          this.currentLayerIndex = endLayerIndex;
          console.debug('Finished transitioning to layer ' + this.currentLayerIndex);
          this.showingMoreInfo = this.currentLayerIndex === 1;
          this.updateLayerElementContainers();
        });
      },
    });

    if (this.currentLayerIndex === endLayerIndex) {
      return timeline;
    }

    const startLayer = this.layerAnimationHandles[this.currentLayerIndex];
    const endLayer = this.layerAnimationHandles[endLayerIndex];
    if (this.currentLayerIndex < endLayerIndex) {
      timeline.add([
        this.getShiftLayerVerticallyAnimation(startLayer, timeSeconds, 0, -1 * this.layerHeightPixels, false),
        this.getShiftLayerVerticallyAnimation(endLayer, timeSeconds, this.layerHeightPixels, 0, true),
      ]);
    } else {
      timeline.add([
        this.getShiftLayerVerticallyAnimation(startLayer, 1, 0, this.layerHeightPixels, false),
        this.getShiftLayerVerticallyAnimation(endLayer, 1, -1 * this.layerHeightPixels, 0, true),
      ]);
    }

    return timeline;
  }

  private getShiftLayerVerticallyAnimation(layer: HTMLElement, timeSeconds: number,
                                        startY: number, endY: number, fadeIn: boolean) {
    return TweenMax.fromTo(
      layer, timeSeconds, {y: startY, opacity: fadeIn ? 0 : 1}, {y: endY, opacity: fadeIn ? 1 : 0});
  }

  private getCircleAnimation(timeSeconds: number, endColor?: string) {
    if (!endColor) {
      endColor = this.interpolateColors(this.score);
    }
    return TweenMax.to(this.widgetElement, timeSeconds, {
      rotation: 0,
      borderRadius: '50%',
      backgroundColor: endColor,
      onStart: () => {
        console.debug('Loading animation: Morphing to circle from '
                      + this.getNameFromShape(this.currentShape));
        this.currentShape = Shape.CIRCLE;
      },
      onComplete: () => {
        console.debug('Loading animation: done morphing to circle.');
      },
    });
  }

  private getSquareAnimation(timeSeconds: number) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      rotation: 0,
      borderRadius: 0,
      backgroundColor: this.interpolateColors(this.score),
      onStart: () => {
        console.debug('Morphing to square from ' + this.getNameFromShape(
           this.currentShape));
        this.currentShape = Shape.SQUARE;
      },
      onComplete: () => {
        console.debug('Done morphing to square');
      },
    });

  }

  private getDiamondAnimation(timeSeconds: number) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      borderRadius: 0,
      rotation: 45,
      backgroundColor: this.interpolateColors(this.score),
      onStart: () => {
        console.debug('Morphing to diamond from ' + this.getNameFromShape(
           this.currentShape));
        this.currentShape = Shape.DIAMOND;
      },
      onComplete: () => {
        console.debug('Done morphing to diamond.');
      },
    });
  }

  private getToGrayScaleAnimation(timeSeconds: number) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      backgroundColor: GRAY_COLOR_CIRCLE_LOADING,
    });
  }

  private getFadeAndShrinkAnimation(timeSeconds: number, repeat: boolean) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      repeat: repeat ? 1 : 0,
      backgroundColor: 'rgba(227,229,230,0.54)',
      scaleX: 0.5,
      scaleY: 0.5,
      yoyo: repeat,
      onStart: () => {
        console.debug('Loading animation: fade in and out start');
      },
      onComplete: () => {
        console.debug('Loading animation: fade in and out complete');
      },
    });
  }

  private getFadeDetailsAnimation(timeSeconds: number, hide: boolean,
                                  layerIndex: number) {
    const timeline = new TimelineMax({
      onStart: () => {
        this.ngZone.run(() => {
          console.debug('Calling getFadeDetails animation, fadeOut=' + hide
                        + ' and current layer index = ' + this.currentLayerIndex);
          this.isPlayingFadeDetailsAnimation = true;
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Fade details animation complete');
          this.isPlayingFadeDetailsAnimation = false;
        });
      },
    });
    const interactiveLayerControlsContainer =
      this.elementRef.nativeElement.querySelector(
        this.layerAnimationSelectors[layerIndex] + ' .interactiveElement');
    const layerTextContainer = this.elementRef.nativeElement.querySelector(
          this.layerAnimationSelectors[layerIndex] + ' .layerText');

    timeline.add([
      TweenMax.to(interactiveLayerControlsContainer, timeSeconds,
                  { opacity: (hide ? 0 : 1) }),
      TweenMax.to(layerTextContainer, timeSeconds,
                  { opacity: (hide ? 0 : 1) }),
    ], 0, 'normal', 0);
    return timeline;
  }
}

export interface CommentFeedback {
  // True if the user clicked "yes" when leaving feedback on whether the comment
  // was toxic after clicking the "Seem wrong?" button. This is used to
  // differentiate between false positives and false negatives in the comment scores.
  commentMarkedAsToxic: boolean;
}
