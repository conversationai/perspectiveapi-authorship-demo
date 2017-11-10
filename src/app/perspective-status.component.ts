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
import twemoji from 'twemoji';

enum Shape {
  CIRCLE,
  SQUARE,
  DIAMOND,
};

enum Configuration {
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
  DEFAULT: 'default',
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
const COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS = 0.5;
const GRAY_LOADING_COLOR = '#cccccc';

@Component({
  selector: 'perspective-status',
  templateUrl: './perspective-status.component.html',
  styleUrls: ['./perspective-status.component.css'],
})
@Injectable()
export class PerspectiveStatus implements OnChanges, AfterViewInit {
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

  private showFeedbackQuestion: boolean = false;
  isLoading: boolean = false;
  public isPlayingLoadingAnimation: boolean = false;
  public isPlayingShowOrHideDetailsAnimation: boolean = false;
  public isPlayingShowOrHideLoadingWidgetAnimation: boolean = false;
  public shouldHideStatusWidget: boolean = false;
  public showScore: boolean = true;
  private currentShape: Shape = Shape.CIRCLE;
  private showingMoreInfo: boolean = false;
  @ViewChild('defaultStatusWidget') private defaultWidget: ElementRef;
  @ViewChild('emojiStatusWidget') private emojiWidget: ElementRef;
  @ViewChild('widgetContainer') private container: ElementRef;
  @ViewChild('smileEmoji') private smileEmoji: ElementRef;
  @ViewChild('neutralEmoji') private neutralEmoji: ElementRef;
  @ViewChild('sadEmoji') private sadEmoji: ElementRef;
  private widgetElement: HTMLElement|null = null;
  private layerTextContainer: HTMLElement;
  private interactiveLayerControlsContainer: HTMLElement;
  private interpolateColors: Function;
  public layersAnimating: boolean = false;
  private layerHeightPixels: number;
  // Animation being used to update the display settings of the demo. This
  // should not be used for a loading animation.
  private updateDemoSettingsAnimation: any;
  private isPlayingUpdateShapeAnimation: boolean;
  private updateStatusWidgetVisibilityAnimation: TimelineMax;
  private hideEmojiIconsForLoadingAnimation = false;
  // Promise that should resolve once this.widget has been initialized.
  private widgetReady: Promise<void>;

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

    this.interpolateColors = d3.interpolateRgbBasis(this.gradientColors);

  }

  ngAfterViewInit() {
    this.widgetReady = Promise.resolve().then(() => {
      this.updateWidgetElement();
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
      console.debug(changes['loadingIconStyle']);
      Promise.resolve().then(() => {this.updateWidgetElement();});
    }

    if (changes['gradientColors'] !== undefined) {
      console.debug('Change in gradientColors');
      this.interpolateColors = d3.interpolateRgbBasis(this.gradientColors);
      this.getUpdateGradientColorAnimation(0.1).play();
    }

    if (changes['configurationInput'] !== undefined) {
      this.configuration = this.getConfigurationFromInputString(this.configurationInput);
      this.resetLayers();
    }

    if (changes['scoreThresholds'] !== undefined) {
      console.debug('Change in scoreThresholds');
      // Kill any prior animations so that the resetting any animation state
      // will not get overridden by the old animation before the new one can
      // begin; this can lead to bugs.
      if (this.updateDemoSettingsAnimation) {
        this.updateDemoSettingsAnimation.kill();
      }

      this.updateDemoSettingsAnimation = this.getUpdateWidgetStateAnimation();
      this.updateDemoSettingsAnimation.play();
    }
  }

  private updateWidgetElement(): void {
    if (this.defaultWidget != null) {
      this.widgetElement = this.defaultWidget.nativeElement;
    } else if (this.emojiWidget != null) {
      this.widgetElement = this.emojiWidget.nativeElement;
    } else {
      this.widgetElement = null;
    }
    let updateWidgetStateTimeline = new TimelineMax({});
    updateWidgetStateTimeline.add(this.getUpdateWidgetStateAnimation());
    updateWidgetStateTimeline.play();
  }

  private getShouldHideStatusWidget(loadStart: boolean): boolean {
    let shouldHide = false;

    if (this.hideLoadingIconAfterLoad) {
      shouldHide = shouldHide || !loadStart;
    }
    if (this.hideLoadingIconForScoresBelowMinThreshold) {
      shouldHide = shouldHide || loadStart || (this.score < this.scoreThresholds[0]);
    }

    return shouldHide;
  }

  private getUpdateStatusWidgetVisibilityAnimation(loadStart: boolean): TimelineMax {
    let hide = this.getShouldHideStatusWidget(loadStart);

    if (this.isPlayingShowOrHideLoadingWidgetAnimation) {
      // TODO: This doesn't seem to get triggered in the logs; remove it? Might
      // worth keeping for future debugging though.
      console.warn('Calling getUpdateStatusWidgetVisibility while '
                    + 'isPlayingShowOrHideLoadingWidgetAnimation. '
                    + 'Killing animation');
      this.updateStatusWidgetVisibilityAnimation.kill();
    }

    // If nothing has changed, return an empty animation.
    if (hide === this.shouldHideStatusWidget) {
      console.debug('Returning without update status widget visibility animation.');
      return new TimelineMax({});
    } else {
      console.debug('Getting update status widget visibility animation.');
    }

    this.isPlayingShowOrHideLoadingWidgetAnimation = true;
    this.updateStatusWidgetVisibilityAnimation = new TimelineMax({
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
          console.debug('Changing status widget visibility complete');
          this.isPlayingShowOrHideLoadingWidgetAnimation = false;
          this.shouldHideStatusWidget = hide;
        });
      },
    });
    this.updateStatusWidgetVisibilityAnimation.add([
      this.getChangeLoadingIconVisibilityAnimation(hide),
      this.getChangeLoadingIconXValueAnimation(hide)]);
    return this.updateStatusWidgetVisibilityAnimation;
  }

  private getChangeLoadingIconVisibilityAnimation(hide: boolean): TweenMax {
    return TweenMax.to(
      this.widgetElement, FADE_WIDGET_TIME_SECONDS, { opacity: hide ? 0 : 1})
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
    if (success) {
      this.feedbackRequestSubmitted = true;
    } else {
      this.feedbackRequestError = true;
    }
    if (this.configuration === Configuration.DEMO_SITE) {
      this.getTransitionToLayerAnimation(
        2, LAYER_TRANSITION_TIME_SECONDS).play();
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
    this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS).play();
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

  getUpdateShapeAnimation(score: number): TimelineMax {
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

  toggleScore(): void {
    if (this.isPlayingShowOrHideDetailsAnimation) {
      return;
    }
    if (this.showScore) {
      this.getHideDetailsAnimation().play();
    } else {
      this.getShowDetailsAnimation().play();
    }
  }

  setShowMoreInfo(showMoreInfo: boolean): void {
    this.getTransitionToLayerAnimation(
      showMoreInfo ? 1 : 0, LAYER_TRANSITION_TIME_SECONDS).play();
  }

  getAnimationA11yLabel(showScore: boolean,
                        isPlayingLoadingAnimation: boolean,
                        isPlayingShowOrHideDetailsAnimation: boolean): string {
    if (isPlayingLoadingAnimation) {
      return "Computing score animation";
    } else if (isPlayingShowOrHideDetailsAnimation && showScore) {
        return "Collapsing score view animation";
    } else if (isPlayingShowOrHideDetailsAnimation && !showScore) {
        return "Expanding score view animation";
    } else if (showScore) {
      return (this.getAccessibilityDescriptionForShape(this.currentShape) +
              "Select to collapse score view");
    } else {
      return (this.getAccessibilityDescriptionForShape(this.currentShape) +
              "Select to expand score view");
    }
  }

  notifyModelInfoLinkClicked(): void {
    this.modelInfoLinkClicked.emit();
  }

  getUpdateWidgetStateAnimation(): TimelineMax {
    if (this.loadingIconStyle === LoadingIconStyle.DEFAULT) {
      console.debug('Update widget state for default style');
      let updateScoreCompletedTimeline = new TimelineMax({
        onComplete: () => {
          this.ngZone.run(() => {
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
      return this.getShowEmojiAnimation();
    } else {
      console.error('Calling updateWidgetState for unknown loadingIconStyle: '
                    + this.loadingIconStyle);
      return null;
    }
  }

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

  // Figure out solution to the following bug: In tests, setLoading(true) gets
  // called before this.widgetElement gets set, since this.widgetElement gets
  // initialized after ngOnInit, which the test doesn't wait for. The
  // pendingSetLoadingCall doesn't work because another setLoading call could
  // happen in the mean time.
  setLoading(loading: boolean): void {
    this.widgetReady.then(() => {
      console.debug('Calling setLoading(' + loading + ')');
      if (this.widgetElement === null) {
        console.error('this.widgetElement = null in call to setLoading');
        return;
      }
      this.isLoading = loading;
      if (this.loadingIconStyle === LoadingIconStyle.DEFAULT) {
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
    let emojiElementToShow: HTMLElement|null = null;
    if (this.score > this.scoreThresholds[2]) {
      emojiElementToShow = this.sadEmoji.nativeElement;
    } else if (this.score > this.scoreThresholds[1]) {
      emojiElementToShow = this.neutralEmoji.nativeElement;
    } else {
      emojiElementToShow = this.smileEmoji.nativeElement;
    }
    let showEmojiTimeline = new TimelineMax({
      onStart:() => {
        this.ngZone.run(() => {
          this.hideEmojiIconsForLoadingAnimation = false;
        });
      },
    });

    showEmojiTimeline.add(this.getChangeOpacityAnimation(
      emojiElementToShow, FADE_EMOJI_TIME_SECONDS, 1));
    return showEmojiTimeline;
  }

  /** Loading animations to play before loading starts for emoji-style loading. */
  getStartAnimationsForEmojiWidgetLoading(): TimelineMax {
    let loadingStartTimeline = new TimelineMax({});
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
    loadingStartTimeline.add(
      this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
    loadingStartTimeline.add(hideEmojiTimeline);

    return loadingStartTimeline;
  }

  /** Loopable loading animations to play for emoji-style loading. */
  getEmojiWidgetLoadingAnimation(): TimelineMax {
    let loadingTimeline = new TimelineMax({});
    let changeColorBackAndForthTimeline = new TimelineMax({
      repeat: 1,
      yoyo: true,
      onStart: () => {
        this.ngZone.run(()=> {
          console.debug('changeColorBackAndForth animation start');
        });
      },
      onComplete: () => {
        this.ngZone.run(()=> {
          console.debug('changeColorBackAndForth animation complete');
        });
      }
    });
    changeColorBackAndForthTimeline.add(
      this.getChangeColorAnimation(COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS,
                                   GRAY_LOADING_COLOR));
    loadingTimeline.add(changeColorBackAndForthTimeline);
    return loadingTimeline;
  }

  /** Loading animations to play when loading finishes for emoji-style loading. */
  getEndAnimationsForEmojiWidgetLoading(): TimelineMax {
    let loadingEndTimeline = new TimelineMax({
      onComplete: () => {
        this.ngZone.run(()=> {
          console.debug('Setting this.isPlayingLoadingAnimation = false (emoji)');
          this.isPlayingLoadingAnimation = false;
        });
      }
    });
    loadingEndTimeline.add(this.getShowEmojiAnimation());
    loadingEndTimeline.add(
      this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));
    return loadingEndTimeline;
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
              loadingTimeline.seek(EMOJI_MAIN_LOADING_ANIMATION_LABEL);
            } else {
              this.getEndAnimationsForEmojiWidgetLoading().play();
            }
          });
        }
      });

      loadingTimeline.add(this.getStartAnimationsForEmojiWidgetLoading());
      loadingTimeline.add(this.getEmojiWidgetLoadingAnimation(),
                          EMOJI_MAIN_LOADING_ANIMATION_LABEL);
      loadingTimeline.play();
    }
  }

  // TODO(rachelrosen): Refactor this into separate functions for
  // before loading/loading/end loading animations.
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
              // not ever getting triggered in the existing logsi and might not
              // be possible to hit now, but could become an issue later.
              console.debug('Restarting loading to fade animation.');
              loadingTimeline.seek(FADE_START_LABEL);
            } else {
              console.debug('Loading complete');
              console.debug('hasScore:', this.hasScore);
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

              updateScoreCompletedTimeline.play();
            }
          });
        },
      });
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
      startAnimationsGroup0.push(this.getUpdateStatusWidgetVisibilityAnimation(true));

      startAnimationsGroup2.push(this.getToGrayScaleAnimation(GRAYSCALE_ANIMATION_TIME_SECONDS));
      if (this.showScore) {
        startAnimationsGroup1.push(
          this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));

        startAnimationsGroup2.push(
          this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
      }
      startAnimationsTimeline.add(startAnimationsGroup0);
      startAnimationsTimeline.add(startAnimationsGroup1);
      startAnimationsTimeline.add(startAnimationsGroup2);

      loadingTimeline.add(startAnimationsTimeline, LOADING_START_ANIMATIONS_LABEL);

      // Include shrink in and out animation in a separate timeline so an
      // ease can be applied.
      let shrinkAndFadeTimeline = new TimelineMax({
        ease: Power3.easeInOut
      });
      shrinkAndFadeTimeline.add(
        this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
      loadingTimeline.add(shrinkAndFadeTimeline, FADE_START_LABEL);
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

  private getShowDetailsAnimation() {
    let timeline = new TimelineMax({
      paused:true,
      onStart: () => {
        this.ngZone.run(() => {
          this.isPlayingShowOrHideDetailsAnimation = true;
          this.widgetElement.blur();
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          this.showScore = true;
          this.isPlayingShowOrHideDetailsAnimation = false;
        });
      },
    });
    let staggerAmount = 0;
    timeline.add([
      TweenMax.to(this.widgetElement, 0.6, { x: 0 }),
      TweenMax.to(this.layerTextContainer, 0.4, { opacity: 1, delay: 0.3 }),
      TweenMax.to(this.layerTextContainer, 0.4, { x: 0, delay: 0.3}),
      TweenMax.to(this.interactiveLayerControlsContainer, 0.4, { opacity: 1, delay: 0.4}),
      TweenMax.to(this.interactiveLayerControlsContainer, 0.4, { x: 0, delay: 0.4})
    ], 0, 'normal', staggerAmount);
    return timeline;
  }

  private getHideDetailsAnimation() {
    let timeline = new TimelineMax({
      paused:true,
      onStart: () => {
        this.ngZone.run(() => {
          this.isPlayingShowOrHideDetailsAnimation = true;
          this.widgetElement.blur();
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          this.showScore = false;
          this.isPlayingShowOrHideDetailsAnimation = false;
        });
      },
    });
    timeline.add([
      TweenMax.to(this.interactiveLayerControlsContainer, 0.4, { opacity: 0}),
      TweenMax.to(this.interactiveLayerControlsContainer, 0.4, { x: 20}),
      TweenMax.to(this.layerTextContainer, 0.4, { opacity: 0, delay: 0.1 }),
      TweenMax.to(this.layerTextContainer, 0.4, { x: 20, delay: 0.1 }),
      TweenMax.to(this.widgetElement, 0.6, {
        x: this.container.nativeElement.offsetWidth - this.indicatorWidth - WIDGET_PADDING_PX,
        delay: 0.2,
      })
    ], 0, 'normal', 0);
    return timeline;
  }

  private getTransitionToCircleAnimation(timeSeconds: number) {
    let circleAnimationTimeline = new TimelineMax({
      align: 'start',
      onStart: () => {
      },
      onComplete: () => {
      },
    });
    circleAnimationTimeline.add([
      this.getCircleAnimation(timeSeconds / 6),
      this.getToFullScaleBounceAnimation(timeSeconds)
    ]);
    return circleAnimationTimeline;
  }

  private getTransitionToSquareAnimation(timeSeconds: number) {
    let squareAnimationTimeline = new TimelineMax({
      onStart: () => {
        let currentRotation = (this.widgetElement as any)._gsTransform.rotation;
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
    this.layerHeightPixels = 30;//this.layerAnimationHandles[0].offsetHeight;

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

  private getCircleAnimation(timeSeconds: number) {
    return TweenMax.to(this.widgetElement, timeSeconds, {
      rotation: 0,
      borderRadius: "50%",
      backgroundColor: this.interpolateColors(this.score),
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
      backgroundColor: "rgba(227,229,230,1)",
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
          this.isPlayingShowOrHideDetailsAnimation = true;
        });
      },
      onComplete: () => {
        this.ngZone.run(() => {
          console.debug('Fade details animation complete');
          this.isPlayingShowOrHideDetailsAnimation = false;
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
