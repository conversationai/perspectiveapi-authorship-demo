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
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Injectable,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import * as d3 from 'd3-interpolate';

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
const ConfigurationInput = {
  DEMO_SITE: 'default',
  EXTERNAL: 'external',
};

const ScoreThreshold = {
  OKAY: 0,
  BORDERLINE: 0.20,
  UNCIVIL: 0.76,
  MAX: 1,
};

const FADE_START_LABEL = "fadeStart";
const SHAPE_MORPH_TIME_SECONDS = 1;
const FADE_DETAILS_TIME_SECONDS = 0.4;
const FADE_ANIMATION_TIME_SECONDS = 0.3;
const GRAYSCALE_ANIMATION_TIME_SECONDS = 0.2
const LAYER_TRANSITION_TIME_SECONDS = 0.5;
const PADDING_PX = 4;

@Component({
  selector: 'perspective-status',
  templateUrl: './perspective-status.component.html',
  styleUrls: ['./perspective-status.component.css'],
})
@Injectable()
export class PerspectiveStatus implements OnChanges {
  // TODO(rachelrosen): Instead of all these inputs, we should merge the
  // convai-checker component with this one.
  @Input() indicatorWidth: number = 13;
  @Input() indicatorHeight: number = 13;
  @Input() score: number = 0;
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
  @Input() analyzeErrorMessage: string|null = null;
  @Output() scoreChangeAnimationCompleted: EventEmitter<void> = new EventEmitter<void>();
  @Output() modelInfoLinkClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() commentFeedbackSubmitted: EventEmitter<CommentFeedback> =
    new EventEmitter<CommentFeedback>();

  public configurationEnum = Configuration;
  public configuration = this.configurationEnum.DEMO_SITE;

  public currentLayerIndex: number = 0;
  private layerAnimationHandles: HTMLElement[] = [];
  private layerAnimationSelectors: string[] = [
    "#layer1", "#layer2", "#layer3"
  ];

  private showFeedbackQuestion: boolean = false;
  isLoading: boolean = false;
  public isPlayingLoadingAnimation: boolean = false;
  public isPlayingShowOrHideDetailsAnimation: boolean = false;
  public showScore: boolean = true;
  private currentShape: Shape = Shape.CIRCLE;
  private showingMoreInfo: boolean = false;
  private widget: HTMLElement;
  private container: HTMLElement;
  private layerTextContainer: HTMLElement;
  private interactiveLayerControlsContainer: HTMLElement;
  private interpolateColors: Function;
  public layersAnimating: boolean = false;
  private layerHeightPixels: number;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private elementRef: ElementRef) {
  }

  ngOnInit() {
    this.configuration = this.getConfigurationFromInputString(this.configurationInput);

    this.widget = this.elementRef.nativeElement.querySelector('#statusWidget');
    this.container = this.elementRef.nativeElement.querySelector(
        '#widgetContainer');

    for (let layerAnimationSelector of this.layerAnimationSelectors) {
      this.layerAnimationHandles.push(
        this.elementRef.nativeElement.querySelector(layerAnimationSelector));
    }
    this.updateLayerElementContainers();

    this.interpolateColors = d3.interpolateRgbBasis(this.gradientColors);
  }

  ngOnChanges(changes: SimpleChanges) : void {
    // Return if ngOnInit has not been called yet, since the animation code
    // cannot run.
    if (this.widget === undefined
      || this.container === undefined
      || this.layerTextContainer === undefined
      || this.interactiveLayerControlsContainer === undefined) {
      return;
    }

    if (changes['score'] !== undefined) {
      if (!this.isPlayingLoadingAnimation) {
        console.debug('Updating shape from ngOnChanges: ' + this.score);
        this.getUpdateShapeAnimation(this.score).play();
      }
    }
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

  shouldShowMessageForScore(score: number): boolean {
    if (this.configuration === Configuration.DEMO_SITE) {
      return true;
    }
    return score >= ScoreThreshold.BORDERLINE;
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

  getUpdateShapeAnimation(score: number): TimelineMax {
    let updateShapeAnimationTimeline = new TimelineMax({});

    // Shrink before updating to a new shape.
    updateShapeAnimationTimeline.add(
      this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));

    if (score > ScoreThreshold.UNCIVIL) {
      updateShapeAnimationTimeline.add(
        this.getTransitionToDiamondAnimation(.8 * SHAPE_MORPH_TIME_SECONDS));
    } else if (score > ScoreThreshold.BORDERLINE) {
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

  setLoading(loading: boolean): void {
    if (this.widget === null) {
      return;
    }
    this.isLoading = loading;
    console.debug('Setting loading to ', loading);
    if (loading && !this.isPlayingLoadingAnimation) {
      let loadingTimeline = new TimelineMax({
        paused:true,
        ease: Power3.easeInOut,
        onStart: () => {
          console.debug('Starting timeline');
          this.isPlayingLoadingAnimation = true;
          this.changeDetectorRef.detectChanges();
        },
        onComplete: () => {
          console.debug('Completing timeline');
          this.changeDetectorRef.detectChanges();
          console.debug('Updating shape from animation complete');
          if (this.isLoading) {
            console.debug('Restarting loading');
            loadingTimeline.seek(FADE_START_LABEL);
          } else {
            console.debug('Loading complete');
            console.debug('hasScore:', this.hasScore);
            let updateScoreCompletedTimeline = new TimelineMax({
              paused:true,
              onStart: () => {
                console.debug('Score change animation start');
              },
              onComplete: () => {
                this.scoreChangeAnimationCompleted.emit();
              }
            });
            let scoreCompletedAnimations: Animation[] = [];
            scoreCompletedAnimations.push(this.getUpdateShapeAnimation(this.score));
            if (this.showScore) {
              scoreCompletedAnimations.push(
                this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));
            }
            updateScoreCompletedTimeline.add(scoreCompletedAnimations);
            updateScoreCompletedTimeline.play();

            this.isPlayingLoadingAnimation = false;
            this.changeDetectorRef.detectChanges();
            loadingTimeline.clear();
          }
        },
      });
      let startAnimationsTimeline = new TimelineMax({
        align: 'sequence',
      });
      // Start animations happen in two groups. Group 1 animates before
      // group 2, and the animations within each group start at the same time.
      let startAnimationsGroup1: Animation[] = [];
      let startAnimationsGroup2: Animation[] = [];

      startAnimationsGroup2.push(this.getToGrayScaleAnimation(GRAYSCALE_ANIMATION_TIME_SECONDS));
      if (this.showScore) {
        startAnimationsGroup1.push(
          this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));

        startAnimationsGroup2.push(
          this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
      }
      startAnimationsTimeline.add(startAnimationsGroup1);
      startAnimationsTimeline.add(startAnimationsGroup2);

      loadingTimeline.add(startAnimationsTimeline);

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

  private getShowDetailsAnimation() {
    let timeline = new TimelineMax({
      paused:true,
      onStart: () => {
        this.isPlayingShowOrHideDetailsAnimation = true;
        this.changeDetectorRef.detectChanges();
        this.widget.blur();
      },
      onComplete: () => {
        this.showScore = true;
        this.isPlayingShowOrHideDetailsAnimation = false;
        this.changeDetectorRef.detectChanges();
      },
    });
    let staggerAmount = 0;
    timeline.add([
      TweenMax.to(this.widget, 0.6, { x: 0 }),
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
        this.isPlayingShowOrHideDetailsAnimation = true;
        this.changeDetectorRef.detectChanges();
        this.widget.blur();
      },
      onComplete: () => {
        this.showScore = false;
        this.isPlayingShowOrHideDetailsAnimation = false;
        this.changeDetectorRef.detectChanges();
      },
    });
    timeline.add([
      TweenMax.to(this.interactiveLayerControlsContainer, 0.4, { opacity: 0}),
      TweenMax.to(this.interactiveLayerControlsContainer, 0.4, { x: 20}),
      TweenMax.to(this.layerTextContainer, 0.4, { opacity: 0, delay: 0.1 }),
      TweenMax.to(this.layerTextContainer, 0.4, { x: 20, delay: 0.1 }),
      TweenMax.to(this.widget, 0.6, {
        x: this.container.offsetWidth - this.indicatorWidth - PADDING_PX,
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
    return TweenMax.to(this.widget, timeSeconds, {
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
    return TweenMax.to(this.widget, timeSeconds, {
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
    return TweenMax.to(this.widget, timeSeconds, {
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
    let rotationDegrees = fromShape === Shape.DIAMOND ? 315 : 360;
    return TweenMax.to(this.widget, timeSeconds, {
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
        console.debug('Transitioning from layer ' + this.currentLayerIndex
                      + ' to layer ' + endLayerIndex);
        this.layersAnimating = true;
        this.changeDetectorRef.detectChanges();
      },
      onComplete: () => {
        this.layersAnimating = false;
        this.currentLayerIndex = endLayerIndex;
        console.debug('Finished transitioning to layer ' + this.currentLayerIndex);
        this.showingMoreInfo = this.currentLayerIndex === 1;
        this.updateLayerElementContainers();
        this.changeDetectorRef.detectChanges();
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
    return TweenMax.to(this.widget, timeSeconds, {
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
    return TweenMax.to(this.widget, timeSeconds, {
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
    return TweenMax.to(this.widget, timeSeconds, {
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
    return TweenMax.to(this.widget, timeSeconds, {
      backgroundColor: "rgba(227,229,230,1)",
    });
  }

  private getFadeAndShrinkAnimation(timeSeconds: number, repeat: boolean) {
    return TweenMax.to(this.widget, timeSeconds, {
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
        console.debug('Calling getFadeDetails animation, fadeOut=' + hide
                      + ' and current layer index = ' + this.currentLayerIndex);
        this.isPlayingShowOrHideDetailsAnimation = true;
        this.changeDetectorRef.detectChanges();
      },
      onComplete: () => {
        console.debug('Fade details animation complete');
        this.isPlayingShowOrHideDetailsAnimation = false;
        this.changeDetectorRef.detectChanges();
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
