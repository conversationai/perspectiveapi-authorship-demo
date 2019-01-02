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
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3-interpolate';
import * as toxicLibsJS from 'toxiclibsjs';
import {Animation, Elastic, Power3, TimelineMax, TweenMax} from 'gsap';
import twemoji from 'twemoji';

export enum Shape {
  CIRCLE,
  SQUARE,
  DIAMOND,
};

export enum Emoji {
  SMILE,
  NEUTRAL,
  SAD,
};

export enum Configuration {
  DEMO_SITE,
  EXTERNAL,
};

// The keys in ConfigurationInput should match items in the Configuration enum.
export const ConfigurationInput = {
  DEMO_SITE: 'default',
  EXTERNAL: 'external',
};

export const ScoreThreshold = {
  OKAY: 0,
  BORDERLINE: 0.20,
  UNCIVIL: 0.76,
  MAX: 1,
};

export const LoadingIconStyle = {
  CIRCLE_SQUARE_DIAMOND: 'circle_square_diamond',
  EMOJI: 'emoji',
};

export const DEFAULT_FEEDBACK_TEXT = 'likely to be perceived as "toxic."';

const FADE_START_LABEL = "fadeStart";
const LOADING_START_ANIMATIONS_LABEL = "loadingAnimationStart";
const SHAPE_MORPH_TIME_SECONDS = 1;
const FADE_DETAILS_TIME_SECONDS = 0.4;
const FADE_ANIMATION_TIME_SECONDS = 0.3;
const GRAYSCALE_ANIMATION_TIME_SECONDS = 0.2
const LAYER_TRANSITION_TIME_SECONDS = 0.5;
const FADE_WIDGET_TIME_SECONDS = 0.4;
const WIDGET_PADDING_PX = 4;
const WIDGET_RIGHT_MARGIN_PX = 10;
const EMOJI_MAIN_LOADING_ANIMATION_LABEL = "emojiMainLoadingAnimation";
const FADE_EMOJI_TIME_SECONDS = 0.5;
const EMOJI_BOUNCE_IN_TIME_SECONDS = 1;
const COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS = 0.5;
const FIRST_GRADIENT_RATIO = 0.9;
const QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS = 0.2;
const NEUTRAL_GRAY_COLOR = '#cccccc';
const GRAY_COLOR_CIRCLE_LOADING = "rgba(227,229,230,1)";
const EMOJI_COLOR = "#ffcc4d";

@Component({
  selector: 'perspective-status',
  templateUrl: './perspective-status.component.html',
  styleUrls: ['./perspective-status.component.css'],
})
@Injectable()
export class PerspectiveStatus implements OnChanges, AfterViewInit, AfterViewChecked {
  // TODO(rachelrosen): Instead of all these inputs, we should merge the
  // convai-checker component with this one.
  @Input() indicatorWidth: number = 13;
  @Input() indicatorHeight: number = 13;
  @Input() configurationInput: string = ConfigurationInput.DEMO_SITE;
  // Since score is zero for both no score and legitimate scores of zero, keep
  // a flag to indicate whether we should show UI for showing score info.
  @Input() hasScore: boolean = false;
  @Input() fontSize: number = 12;
  @Input() gradientColors: string[] = ["#ffffff", "#000000"];
  @Input() canAcceptFeedback: boolean = false;
  @Input() feedbackRequestInProgress: boolean = false;
  @Input() feedbackRequestSubmitted: boolean = false;
  @Input() feedbackRequestError: boolean = false;
  @Input() initializeErrorMessage: string;
  @Input() feedbackText: [string, string, string] = [
     DEFAULT_FEEDBACK_TEXT,
     DEFAULT_FEEDBACK_TEXT,
     DEFAULT_FEEDBACK_TEXT
  ];
  @Input() scoreThresholds: [number, number, number] = [
    ScoreThreshold.OKAY,
    ScoreThreshold.BORDERLINE,
    ScoreThreshold.UNCIVIL
  ];
  @Input() showPercentage: boolean = true;
  @Input() showMoreInfoLink: boolean = true;
  @Input() analyzeErrorMessage: string|null = null;
  @Input() userFeedbackPromptText: string;
  @Input() hideLoadingIconAfterLoad: boolean;
  @Input() hideLoadingIconForScoresBelowMinThreshold: boolean;
  @Input() alwaysHideLoadingIcon: boolean;
  @Input() loadingIconStyle: string;
  @Input() hasLocalAssets = true;
  @Output() scoreChangeAnimationCompleted: EventEmitter<void> = new EventEmitter<void>();
  @Output() modelInfoLinkClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() commentFeedbackSubmitted: EventEmitter<CommentFeedback> =
    new EventEmitter<CommentFeedback>();

  public configurationEnum = Configuration;
  public configuration = this.configurationEnum.DEMO_SITE;
  public loadingIconStyleConst = LoadingIconStyle;
  public score: number = 0;
  public currentLayerIndex: number = 0;
  private layerAnimationHandles: HTMLElement[] = [];
  private layerAnimationSelectors: string[] = [
    "#layer1", "#layer2", "#layer3"
  ];

  public showFeedbackQuestion: boolean = false;
  isLoading: boolean = false;
  public isPlayingLoadingAnimation: boolean = false;
  public isPlayingFadeDetailsAnimation: boolean = false;
  public isPlayingShowOrHideLoadingWidgetAnimation: boolean = false;
  public shouldHideStatusWidget: boolean = false;
  public showScore: boolean = true;
  public currentShape: Shape = Shape.CIRCLE;
  public currentEmoji: Emoji = Emoji.SMILE;
  private showingMoreInfo: boolean = false;
  @ViewChild('circleSquareDiamondWidget') private circleSquareDiamondWidget: ElementRef;
  @ViewChild('emojiStatusWidget') private emojiWidget: ElementRef;
  @ViewChild('widgetContainer') private container: ElementRef;
  @ViewChild('smileEmoji') private smileEmoji: ElementRef;
  @ViewChild('neutralEmoji') private neutralEmoji: ElementRef;
  @ViewChild('sadEmoji') private sadEmoji: ElementRef;
  private widgetElement: HTMLElement|null = null;
  private layerTextContainer: HTMLElement;
  private interactiveLayerControlsContainer: HTMLElement;
  public layersAnimating: boolean = false;
  private layerHeightPixels: number;
  // Animation being used to update the display settings of the demo. This
  // should not be used for a loading animation.
  private updateDemoSettingsAnimation: any;
  private isPlayingUpdateShapeAnimation: boolean;
  private updateStatusWidgetVisibilityAnimation: TimelineMax;
  public hideEmojiIconsForLoadingAnimation = false;
  // Promise that should resolve once this.widget has been initialized.
  private widgetReady: Promise<void>;

  /** Variables to store state change flags to use in ngAfterViewChecked. */
  private loadingIconStyleChanged = false;
  private scoreThresholdsChanged = false;

  private hideLoadingIconAfterLoadChanged = false;
  private alwaysHideLoadingIconChanged = false;

  private stateChangeAnimations: TimelineMax|null = null;
  private isPlayingStateChangeAnimations = false;
  private pendingPostLoadingStateChangeAnimations: TimelineMax|null = null;
  private isPlayingPostLoadingStateChangeAnimations = false;
  private currentStateChangeAnimationId: number = 0;
  private gradientColorScale: string[];

  public percentScore() {
    return ( parseInt(this.score.toFixed(2)) * 100 ).toFixed(0)
  }

  // Inject ngZone so that we can call ngZone.run() to re-enter the angular
  // zone inside gsap animation callbacks.
  constructor(private ngZone: NgZone, private elementRef: ElementRef) {
  }

  ngOnInit() {
    this.configuration = this.getConfigurationFromInputString(this.configurationInput);

    // TODO(rachelrosen): Investigate changing these to ViewChildren/replacing
    // calls to querySelector, if possible.
    for (let layerAnimationSelector of this.layerAnimationSelectors) {
      this.layerAnimationHandles.push(
        this.elementRef.nativeElement.querySelector(layerAnimationSelector));
    }
    this.updateLayerElementContainers();

    this.updateGradient();
  }

  ngAfterViewInit() {
    // TODO: this is simply putting an event on the stack, and it not actually
    // chaining anything in a dependable way; therefore it wont have consistent
    // timing behaviour w.r.t. anything else. This is maybe wrong, and if not
    // needs some quite careful documentation on what the actual intent here is.
    this.widgetReady = Promise.resolve().then(() => {
      this.updateWidgetElement();
      this.getUpdateWidgetStateAnimation().play();
    });
  }

  ngOnChanges(changes: SimpleChanges) : void {
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
      if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
        this.getUpdateGradientColorAnimation(0.1).play();
      }
    }

    if (changes['configurationInput'] !== undefined) {
      this.configuration = this.getConfigurationFromInputString(this.configurationInput);
      this.resetLayers();
    }

    if (changes['scoreThresholds'] !== undefined) {
      console.debug('Change in scoreThresholds');
      // ngOnChanges will be called for a change in the array reference, not the
      // array values, so check to make sure they're really different.
      let valuesChanged = false;
      let scoreThresholdChanges = changes['scoreThresholds'];
      for (let i = 0; i < scoreThresholdChanges.previousValue.length; i++) {
        if (scoreThresholdChanges.currentValue[i]
            !== scoreThresholdChanges.previousValue[i]) {
          valuesChanged = true;
          break;
        }
      }

      if (valuesChanged) {
        this.updateGradient();

        // Kill any prior animations so that the resetting any animation state
        // will not get overridden by the old animation before the new one can
        // begin; this can lead to bugs.
        if (this.updateDemoSettingsAnimation) {
          this.updateDemoSettingsAnimation.kill();
        }
        this.scoreThresholdsChanged = true;
      }
    }

    if (changes['hideLoadingIconAfterLoad']) {
      this.hideLoadingIconAfterLoadChanged = true;
    }

    if (changes['alwaysHideLoadingIcon']) {
      this.alwaysHideLoadingIconChanged = true;
    }
  }

  /**
   * Make any animation changes that require ViewChild updates in this lifecycle
   * callback, to ensure that the ViewChild has been updated.
   */
  ngAfterViewChecked() {
    if (this.scoreThresholdsChanged
        || this.loadingIconStyleChanged
        || this.hideLoadingIconAfterLoadChanged
        || this.alwaysHideLoadingIconChanged) {

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
      let afterChangesTimeline = new TimelineMax({
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
        if (this.hideLoadingIconAfterLoadChanged
            || this.alwaysHideLoadingIconChanged) {
          if (this.hideLoadingIconAfterLoadChanged) {
            console.debug('Setting hideLoadingIconAfterLoadChanged to false');
            this.hideLoadingIconAfterLoadChanged = false;
          }
          if (this.alwaysHideLoadingIconChanged) {
            console.debug('Setting alwaysHideLoadingIconChanged to false');
            this.alwaysHideLoadingIconChanged = false;
          }

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
          // work correctly.
          if (this.shouldHideStatusWidget) {
            this.widgetElement.style.transform =
              'matrix(1,0,0,1,' + (-1 * (this.indicatorWidth + WIDGET_PADDING_PX + WIDGET_RIGHT_MARGIN_PX)) + ',0)';
          }
          console.debug('Setting loadingIconStyleChanged to false');
          this.loadingIconStyleChanged = false;
          let loadingIconStyleChangedTimeline = new TimelineMax({});
          // TODO(rachelrosen): Determine whether this covers all cases
          // regarding the correct x position of elements, or if more animations
          // are needed here.
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
        this.stateChangeAnimations.play();
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
    let gradientPoints = [
      Math.floor(
        gradientPointCount * (
          this.scoreThresholds[0] + FIRST_GRADIENT_RATIO * (
            this.scoreThresholds[1] - this.scoreThresholds[0]))),
      Math.floor(gradientPointCount * this.scoreThresholds[1]),
      Math.floor(gradientPointCount * this.scoreThresholds[2])
    ];

    // If two gradient colors are added at the same point (which happens when
    // scoreThresholds[i] === scoreThresholds[i + 1]), the toxiclibsjs library
    // does not automatically favor the correct color. Add deltas to the
    // gradient points that favor the color for the higher threshold at that
    // point.
    //
    // Examples:
    //   [50, 90, 90] => [50, 89, 90]
    //   [50, 50, 99] => [49, 50, 99]
    //   [50, 50, 50] => [48, 49, 50]
    let gradientPointDeltas: number[] = [];
    for (let i = gradientPoints.length - 1; i >= 0; i--) {
      if (gradientPoints[i] >= gradientPoints[i + 1]) {
        gradientPoints[i] -= (gradientPoints[i] - gradientPoints[i + 1] + 1);
      }
    }
    return gradientPoints;
  }

  /**
   * Updates the gradient color scale for the shape based on the
   * scoreThresholds.
   */
  updateGradient() {
    // The number of points to use to calculate the gradient.
    let gradientPointCount = 100;

    let gradientPoints = this.getAdjustedGradientControlPoints(gradientPointCount);
    const sliderGradient = new toxicLibsJS.color.ColorGradient();

    for (let i = 0; i < gradientPoints.length; i++) {
      // If the gradient point is less than 0, it measn scoresThresholds[i] ===
      // scoreThresholds[i + 1] === 0, in which case we start at the second
      // higher indexed gradient color.
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
    let scoreLowerIndex = Math.min(
      Math.floor(score * 100), this.gradientColorScale.length - 1);
    let scoreUpperIndex = Math.min(
      Math.ceil(score * 100), this.gradientColorScale.length - 1);

    let interpolatorFn = d3.interpolateRgb(
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

  private getShouldHideStatusWidget(loadStart: boolean): boolean {
    let shouldHide = false;

    if (this.hideLoadingIconAfterLoad) {
      shouldHide = shouldHide || !loadStart;
    }
    if (this.hideLoadingIconForScoresBelowMinThreshold) {
      shouldHide = shouldHide || loadStart || (this.score < this.scoreThresholds[0]);
    }
    if (this.alwaysHideLoadingIcon) {
      shouldHide = true;
    }

    return shouldHide;
  }

  private getUpdateStatusWidgetVisibilityAnimation(loadStart: boolean): TimelineMax {
    let hide = this.getShouldHideStatusWidget(loadStart);

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
    let updateStatusWidgetVisibilityAnimation = new TimelineMax({
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
      },
    });
    updateStatusWidgetVisibilityAnimation.add([
      this.getChangeLoadingIconVisibilityAnimation(hide),
      this.getChangeLoadingIconXValueAnimation(hide)]);
    return updateStatusWidgetVisibilityAnimation;
  }

  private getChangeLoadingIconVisibilityAnimation(hide: boolean): TweenMax {
    return TweenMax.to(
      this.widgetElement, FADE_WIDGET_TIME_SECONDS, { opacity: hide ? 0 : 1})
  }

  private getSetIconToNeutralStateAnimation(): TimelineMax {
    let timeline = new TimelineMax({});

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
    let timeline = new TimelineMax({});
    let translateXAnimations: Animation[] = [];
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
      let layer0TextContainer = this.elementRef.nativeElement.querySelector(
          this.layerAnimationSelectors[0] + ' .layerText');
      let layer1TextContainer = this.elementRef.nativeElement.querySelector(
          this.layerAnimationSelectors[1] + ' .layerText');
      let layer2InteractiveContainer =
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
    if (inputString === ConfigurationInput.EXTERNAL) {
      return Configuration.EXTERNAL;
    } else {
      // Demo site is the default.
      return Configuration.DEMO_SITE;
    }
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
    return score >= this.scoreThresholds[0];
  }

  // Wrapper for twemoji.parse() to use in data binding. Parses text, replacing
  // any emojis with <img> tags. All other text remains the same.
  parseEmojis(text: string) {
    return twemoji.parse(text);
  }

  getFeedbackTextForScore(score: number): string {
    if (score >= this.scoreThresholds[2]) {
      return this.feedbackText[2];
    } else if (score >= this.scoreThresholds[1]) {
      return this.feedbackText[1];
    } else if (score >= this.scoreThresholds[0]) {
      return this.feedbackText[0];
    } else {
      return '';
    }
  }

  feedbackContainerClicked() {
    if (this.configuration === Configuration.DEMO_SITE) {
      this.getTransitionToLayerAnimation(1, LAYER_TRANSITION_TIME_SECONDS).play();
    } else if (this.configuration === Configuration.EXTERNAL) {
      this.showFeedbackQuestion = true;
    }
  }

  feedbackCompleted(success: boolean) {
    // TODO: probably want something like an observable for when the animation
    // has finished, and to be returning that, so that we can test for animation
    // completes, etc.
    if (success) {
      this.feedbackRequestSubmitted = true;
    } else {
      this.feedbackRequestError = true;
    }
    if (this.configuration === Configuration.DEMO_SITE) {
      let feedbackCompletedTimeline = new TimelineMax({});

      feedbackCompletedTimeline.add([
        this.getTransitionToLayerAnimation(2, LAYER_TRANSITION_TIME_SECONDS),
        this.getSetIconToNeutralStateAnimation()
      ]);

      feedbackCompletedTimeline.play();
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
    let resetAnimationTimeline = new TimelineMax({});
    resetAnimationTimeline.add(this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
    resetAnimationTimeline.add(this.getUpdateWidgetStateAnimation());
    resetAnimationTimeline.play();
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
    if (score > this.scoreThresholds[2]) {
      return Shape.DIAMOND;
    } else if (score > this.scoreThresholds[1]) {
      return Shape.SQUARE;
    } else {
      return Shape.CIRCLE;
    }
  }

  // Gets the emoji corresponding to the specified score.
  getEmojiForScore(score: number): Emoji {
    if (score > this.scoreThresholds[2]) {
      return Emoji.SAD;
    } else if (score > this.scoreThresholds[1]) {
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
    let updateShapeAnimationTimeline = new TimelineMax({
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

    if (score > this.scoreThresholds[2]) {
      updateShapeAnimationTimeline.add(
        this.getTransitionToDiamondAnimation(.8 * SHAPE_MORPH_TIME_SECONDS));
    } else if (score > this.scoreThresholds[1]) {
      // Square is a special case, since we rotate based on the current degrees
      // and not to a specific rotation. As a result this can get messed up if
      // we're in the middle of an existing rotation, so reset the rotation
      // accordingly before animating to prevent this bug.
      // Note that this only works if the previous animation gets killed first.
      // TODO(rachelrosen): Figure out a more general way to prevent this bug
      // for all cases, not just when customizing the demo. It seems to happen
      // occasionally in the wild as well.
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

  setShowMoreInfo(showMoreInfo: boolean): void {
    this.getTransitionToLayerAnimation(
      showMoreInfo ? 1 : 0, LAYER_TRANSITION_TIME_SECONDS).play();
  }

  getAccessibilityDescriptionForEmoji(emoji: Emoji): string {
    if (emoji === Emoji.SMILE) {
      return "Smile emoji";
    } else if (emoji === Emoji.NEUTRAL) {
      return "Neutral emoji";
    } else {
      return "Sad emoji";
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
  };

  getAnimationA11yLabel(loadingIconStyle: string,
                        isPlayingLoadingAnimation: boolean): string {
    if (isPlayingLoadingAnimation) {
      return "Computing score animation";
    } else if (loadingIconStyle === LoadingIconStyle.EMOJI) {
      return this.getAccessibilityDescriptionForEmoji(this.currentEmoji);
    } else {
      return this.getAccessibilityDescriptionForShape(this.currentShape);
    }
  }

  notifyModelInfoLinkClicked(): void {
    this.modelInfoLinkClicked.emit();
  }

  getUpdateWidgetStateAnimation(): TimelineMax {
    let updateScoreCompletedTimeline = new TimelineMax({
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
    if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
      console.debug('Update widget state for default style');
      let updateScoreCompletedTimeline = new TimelineMax({
        onComplete: () => {
          this.ngZone.run(() => {
            console.debug(this.scoreChangeAnimationCompleted);
            // TODO(rachelrosen): Debug ObjectUnsubscribedError that occurs here.
            // Seems to happen when animation finishes after changing from emoji
            // to shape. This only happens when this component is a child of the
            // conversationai-website. This error does not reproduce reliably
            // (it was there one day and gone a few days later with no code
            // changes) and therefore requires more investigation.
            this.scoreChangeAnimationCompleted.emit();
          });
        }
      });
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation(false));
      updateScoreCompletedTimeline.add(this.getUpdateShapeAnimation(this.score));
      return updateScoreCompletedTimeline;
    } else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
      console.debug('Update widget state for emoji style');
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation(false));
      updateScoreCompletedTimeline.add(this.getShowEmojiAnimation());
      return updateScoreCompletedTimeline;
    } else {
      console.error('Calling updateWidgetState for unknown loadingIconStyle: '
                    + this.loadingIconStyle);
      return new TimelineMax({});
    }
  }

  // TODO: when a score changes, we should return an observable (probably a
  // Single) for when the animation has completed. That way we can test against
  // it sensibly, and also make sure timing dependencies can be programmed
  // against.
  notifyScoreChange(score: number): void {
    console.debug('Setting this.score =', score);
    this.score = score;
    if (this.isPlayingLoadingAnimation) {
      // Loading just ended.
      this.setLoading(false);
    } else {
      // This indicates that the score was reset without being the result of a
      // load completing, such as the text being cleared.
      console.debug('Updating shape from notifyScoreChange');
      this.getUpdateWidgetStateAnimation().play();
    }
  }

  // TODO: unclear why this needs to be async. Remove, or add a comment to
  // explain/justify why. If it does need to be async, it should return an
  // observable to know when its done.
  setLoading(loading: boolean): void {
    this.widgetReady.then(() => {
      console.debug('Calling setLoading(' + loading + ')');
      if (this.widgetElement === null) {
        console.error('this.widgetElement = null in call to setLoading');
        return;
      }
      this.isLoading = loading;
      if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
        this.setLoadingForDefaultWidget(loading);
      } else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
        this.setLoadingForEmojiWidget(loading);
      } else {
        console.error(
          'Calling setLoading for unknown loadingIconStyle: ' + this.loadingIconStyle);
      }
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
    if (this.score > this.scoreThresholds[2]) {
      emojiType = Emoji.SAD;
    } else if (this.score > this.scoreThresholds[1]) {
      emojiType = Emoji.NEUTRAL;
    } else {
      emojiType = Emoji.SMILE;
    }
    let emojiElementToShow = this.getEmojiElementFromEmojiType(emojiType);
    let showEmojiTimeline = new TimelineMax({
      onStart:() => {
        this.ngZone.run(() => {
          this.hideEmojiIconsForLoadingAnimation = false;
        });
      },
      onComplete:() => {
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
    let hideEmojiTimeline = new TimelineMax({
      onComplete: () => {
        this.ngZone.run(()=> {
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
    let loadingStartTimeline = new TimelineMax({});
    // Reset to the first layer if we're not already there.
    if (this.currentLayerIndex !== 0) {
      loadingStartTimeline.add(
        this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
    }
    // Update visibility of the emoji icon before starting; it could have
    // disappeared due to certain settings, and in some of these cases it
    // needs to reappear before loading animation begins.
    loadingStartTimeline.add(
      this.getUpdateStatusWidgetVisibilityAnimation(true));

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
    let shrinkAndFadeTimeline = new TimelineMax({
      // Apply ease
      ease: Power3.easeInOut
    });
    shrinkAndFadeTimeline.add(
      this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
    return shrinkAndFadeTimeline;
  }

  /** Loading animations to play when loading finishes for emoji-style loading. */
  getEndAnimationsForEmojiWidgetLoading(loadingTimeline: TimelineMax): TimelineMax {
    let loadingEndTimeline = new TimelineMax({
      onComplete: () => {
        this.ngZone.run(()=> {
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
    let scoreCompletedAnimations: Animation[] = [];
    scoreCompletedAnimations.push(this.getShowEmojiAnimation());
    scoreCompletedAnimations.push(
      this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));

    // If we're revealing the status widget, play the reveal animation
    // before the update emoji animation.
    if (!this.getShouldHideStatusWidget(false)) {
      loadingEndTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation(false));
    }

    loadingEndTimeline.add(scoreCompletedAnimations);

    // If we're hiding the status widget, play the hide widget
    // animation after the update emoji animation.
    if (this.getShouldHideStatusWidget(false)) {
      loadingEndTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation(false));
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
    let startAnimationsTimeline = new TimelineMax({
      align: 'sequence',
    });

    // Start animations happen in three groups. Group 0 animations before
    // group 1, which animates before group 2. The animations within each
    // group start at the same time.
    let startAnimationsGroup0: Animation[] = [];
    let startAnimationsGroup1: Animation[] = [];
    let startAnimationsGroup2: Animation[] = [];

    // Update visibility of the status widget before starting; it could have
    // disappeared due to certain settings, and in some of these cases it
    // needs to reappear before loading animation begins.
    startAnimationsGroup0.push(
      this.getUpdateStatusWidgetVisibilityAnimation(true));

    startAnimationsGroup2.push(
      this.getToGrayScaleAnimation(GRAYSCALE_ANIMATION_TIME_SECONDS));
    if (this.showScore) {
      if (this.currentLayerIndex !== 0) {
        startAnimationsGroup1.push(
          this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
      }

      startAnimationsGroup2.push(
        this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
    }
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
    let shrinkAndFadeTimeline = new TimelineMax({
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
    let updateScoreCompletedTimeline = new TimelineMax({
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
    let scoreCompletedAnimations: Animation[] = [];
    scoreCompletedAnimations.push(
      this.getUpdateShapeAnimation(this.score));

    if (this.showScore) {
      scoreCompletedAnimations.push(
        this.getFadeDetailsAnimation(
          FADE_DETAILS_TIME_SECONDS, false, 0));
    }

    // If we're revealing the status widget, play the reveal animation
    // before the update shape animation.
    if (!this.getShouldHideStatusWidget(false)) {
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation(false));
    }

    updateScoreCompletedTimeline.add(scoreCompletedAnimations);

    // If we're hiding the status widget, play the hide widget
    // animation after the update shape animation.
    if (this.getShouldHideStatusWidget(false)) {
      updateScoreCompletedTimeline.add(
        this.getUpdateStatusWidgetVisibilityAnimation(false));
    }

    if (this.pendingPostLoadingStateChangeAnimations) {
      updateScoreCompletedTimeline.add(
        this.pendingPostLoadingStateChangeAnimations);
    }

    return updateScoreCompletedTimeline;
  }

  setLoadingForEmojiWidget(loading: boolean): void {
    if (loading && !this.isPlayingLoadingAnimation) {
      this.isPlayingLoadingAnimation = true;
      let loadingTimeline = new TimelineMax({
        paused:true,
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
              loadingTimeline.seek(EMOJI_MAIN_LOADING_ANIMATION_LABEL, true);
            } else {
              this.getEndAnimationsForEmojiWidgetLoading(loadingTimeline).play();
            }
          });
        }
      });

      loadingTimeline.add(this.getStartAnimationsForEmojiWidgetLoading());
      loadingTimeline.add(this.getLoopAnimationForEmojiWidgetLoading(),
                          EMOJI_MAIN_LOADING_ANIMATION_LABEL);
      loadingTimeline.play();
    }
  }

  setLoadingForDefaultWidget(loading: boolean): void {
    if (loading && !this.isPlayingLoadingAnimation) {
      console.debug('About to create loadingTimeline');
      // Set isPlayingLoadingAnimation = true here instead of in the onStart()
      // of the animation, so that the animation does not start twice if this
      // function gets called twice in rapid succession.
      this.isPlayingLoadingAnimation = true;

      let loadingTimeline = new TimelineMax({
        paused:true,
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
              // TODO(rachelrosen): Consider the edge case where
              // isPlayingShowOrHideLoadingWidgetAnimation is true here. It's
              // not ever getting triggered in the existing logs and might not
              // be possible to hit now, but could become an issue later.
              console.debug('Restarting loading to fade animation.');
              loadingTimeline.seek(FADE_START_LABEL, true);
            } else {
              console.debug('Loading complete');
              console.debug('hasScore:', this.hasScore);
              let updateScoreCompletedTimeline =
                this.getEndAnimationsForCircleSquareDiamondWidgetLoading(
                  loadingTimeline);
              updateScoreCompletedTimeline.play();
            }
          });
        },
      });
      let startAnimationsTimeline =
        this.getStartAnimationsForCircleSquareDiamondWidgetLoading();
      loadingTimeline.add(startAnimationsTimeline, LOADING_START_ANIMATIONS_LABEL);

      loadingTimeline.add(
        this.getLoopAnimationsForCircleSquareDiamondWidgetLoading(), FADE_START_LABEL);
      loadingTimeline.play();
    }
  }

  private getNameFromShape(shape: Shape): string {
    if (shape == Shape.CIRCLE) {
      return 'circle';
    } else if (shape == Shape.SQUARE) {
      return 'square';
    } else {
      return 'diamond';
    }
  }

  private getAccessibilityDescriptionForShape(shape: Shape): string {
    if (shape == Shape.CIRCLE) {
      return 'Low toxicity icon.';
    } else if (shape == Shape.SQUARE) {
      return 'Medium toxicity icon.';
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
    let circleAnimationTimeline = new TimelineMax({
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
    let squareAnimationTimeline = new TimelineMax({
      onStart: () => {
        let currentRotation = 0;
        let currentWidgetTransform = (this.widgetElement as any)._gsTransform;
        if (currentWidgetTransform !== undefined) {
          currentRotation = currentWidgetTransform.rotation;
        }
        console.debug('getTransitionToSquare; Current rotation:', currentRotation);
      },
      onComplete: () => {
      },
    });
    let previousShape = this.currentShape;
    squareAnimationTimeline.add([
      this.getSquareAnimation(timeSeconds / 4),
      this.getToFullScaleCompleteRotationAnimation(timeSeconds, previousShape)
    ]);
    return squareAnimationTimeline;
  }

  private getTransitionToDiamondAnimation(timeSeconds: number) {
    let diamondAnimationTimeline = new TimelineMax({
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
    let currentWidgetTransform = (this.widgetElement as any)._gsTransform;
    if (currentWidgetTransform !== undefined) {
      currentRotation = currentWidgetTransform.rotation;
    }
    console.debug('Current rotation:', currentRotation);
    console.debug('From shape:', this.getNameFromShape(fromShape));
    let rotationDegrees = fromShape === Shape.DIAMOND ? 315 : 360;
    return TweenMax.to(this.widgetElement, timeSeconds, {
      rotation: "+=" + rotationDegrees + "_ccw",
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

  private getTransitionToLayerAnimation(endLayerIndex: number, timeSeconds: number): Animation {
    this.layerHeightPixels = this.layerAnimationHandles[this.currentLayerIndex].offsetHeight;

    let timeline = new TimelineMax({
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

    let startLayer = this.layerAnimationHandles[this.currentLayerIndex];
    let endLayer = this.layerAnimationHandles[endLayerIndex];
    if (this.currentLayerIndex < endLayerIndex) {
      timeline.add([
        this.getShiftLayerVerticallyAnimation(startLayer, timeSeconds, 0, -1 * this.layerHeightPixels, false),
        this.getShiftLayerVerticallyAnimation(endLayer, timeSeconds, this.layerHeightPixels, 0, true),
      ])
    } else {
      timeline.add([
        this.getShiftLayerVerticallyAnimation(startLayer, 1, 0, this.layerHeightPixels, false),
        this.getShiftLayerVerticallyAnimation(endLayer, 1, -1 * this.layerHeightPixels, 0, true),
      ])
    }

    return timeline;
  }

  private getShiftLayerVerticallyAnimation(layer: HTMLElement, timeSeconds: number,
                                        startY: number, endY: number, fadeIn: boolean) {
    return TweenMax.fromTo(
      layer, timeSeconds,{y: startY, opacity: fadeIn ? 0 : 1}, {y: endY, opacity: fadeIn ? 1 : 0});
  }

  private getCircleAnimation(timeSeconds: number, endColor?: string) {
    if (!endColor) {
      endColor = this.interpolateColors(this.score);
    }
    return TweenMax.to(this.widgetElement, timeSeconds, {
      rotation: 0,
      borderRadius: "50%",
      backgroundColor: endColor,
      onStart: () => {
        console.debug('Loading animation: Morphing to circle from '
                     + this.getNameFromShape(
           this.currentShape));
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
      backgroundColor: "rgba(227,229,230,0.54)",
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
    let timeline = new TimelineMax({
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
    let interactiveLayerControlsContainer =
      this.elementRef.nativeElement.querySelector(
        this.layerAnimationSelectors[layerIndex] + ' .interactiveElement');
    let layerTextContainer = this.elementRef.nativeElement.querySelector(
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
