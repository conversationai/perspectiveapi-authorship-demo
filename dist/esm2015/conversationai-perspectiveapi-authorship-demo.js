import { Component, ElementRef, EventEmitter, Injectable, Input, NgZone, Output, ViewChild, NgModule } from '@angular/core';
import { interpolateRgb } from 'd3-interpolate';
import { color } from 'toxiclibsjs';
import { Elastic, Power3, TimelineMax, TweenMax } from 'gsap';
import twemoji from 'twemoji';
import { Http, Headers, HttpModule } from '@angular/http';
import { from } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatInputModule } from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/** @enum {number} */
const Shape = {
    CIRCLE: 0,
    SQUARE: 1,
    DIAMOND: 2,
};
Shape[Shape.CIRCLE] = "CIRCLE";
Shape[Shape.SQUARE] = "SQUARE";
Shape[Shape.DIAMOND] = "DIAMOND";

/** @enum {number} */
const Emoji = {
    SMILE: 0,
    NEUTRAL: 1,
    SAD: 2,
};
Emoji[Emoji.SMILE] = "SMILE";
Emoji[Emoji.NEUTRAL] = "NEUTRAL";
Emoji[Emoji.SAD] = "SAD";

/** @enum {number} */
const Configuration = {
    DEMO_SITE: 0,
    EXTERNAL: 1,
};
Configuration[Configuration.DEMO_SITE] = "DEMO_SITE";
Configuration[Configuration.EXTERNAL] = "EXTERNAL";

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
const LoadingIconStyle = {
    CIRCLE_SQUARE_DIAMOND: 'circle_square_diamond',
    EMOJI: 'emoji',
};
const DEFAULT_FEEDBACK_TEXT = 'likely to be perceived as "toxic."';
const FADE_START_LABEL = "fadeStart";
const LOADING_START_ANIMATIONS_LABEL = "loadingAnimationStart";
const SHAPE_MORPH_TIME_SECONDS = 1;
const FADE_DETAILS_TIME_SECONDS = 0.4;
const FADE_ANIMATION_TIME_SECONDS = 0.3;
const GRAYSCALE_ANIMATION_TIME_SECONDS = 0.2;
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
class PerspectiveStatus {
    /**
     * @param {?} ngZone
     * @param {?} elementRef
     */
    constructor(ngZone, elementRef) {
        this.ngZone = ngZone;
        this.elementRef = elementRef;
        // TODO(rachelrosen): Instead of all these inputs, we should merge the
        // convai-checker component with this one.
        this.indicatorWidth = 13;
        this.indicatorHeight = 13;
        this.configurationInput = ConfigurationInput.DEMO_SITE;
        // Since score is zero for both no score and legitimate scores of zero, keep
        // a flag to indicate whether we should show UI for showing score info.
        this.hasScore = false;
        this.fontSize = 12;
        this.gradientColors = ["#ffffff", "#000000"];
        this.canAcceptFeedback = false;
        this.feedbackRequestInProgress = false;
        this.feedbackRequestSubmitted = false;
        this.feedbackRequestError = false;
        this.feedbackText = [
            DEFAULT_FEEDBACK_TEXT,
            DEFAULT_FEEDBACK_TEXT,
            DEFAULT_FEEDBACK_TEXT
        ];
        this.scoreThresholds = [
            ScoreThreshold.OKAY,
            ScoreThreshold.BORDERLINE,
            ScoreThreshold.UNCIVIL
        ];
        this.showPercentage = true;
        this.showMoreInfoLink = true;
        this.analyzeErrorMessage = null;
        this.scoreChangeAnimationCompleted = new EventEmitter();
        this.modelInfoLinkClicked = new EventEmitter();
        this.commentFeedbackSubmitted = new EventEmitter();
        this.configurationEnum = Configuration;
        this.configuration = this.configurationEnum.DEMO_SITE;
        this.loadingIconStyleConst = LoadingIconStyle;
        this.score = 0;
        this.currentLayerIndex = 0;
        this.layerAnimationHandles = [];
        this.layerAnimationSelectors = [
            "#layer1", "#layer2", "#layer3"
        ];
        this.showFeedbackQuestion = false;
        this.isLoading = false;
        this.isPlayingLoadingAnimation = false;
        this.isPlayingFadeDetailsAnimation = false;
        this.isPlayingShowOrHideLoadingWidgetAnimation = false;
        this.shouldHideStatusWidget = false;
        this.showScore = true;
        this.currentShape = Shape.CIRCLE;
        this.currentEmoji = Emoji.SMILE;
        this.showingMoreInfo = false;
        this.widgetElement = null;
        this.layersAnimating = false;
        this.hideEmojiIconsForLoadingAnimation = false;
        /**
         * Variables to store state change flags to use in ngAfterViewChecked.
         */
        this.loadingIconStyleChanged = false;
        this.scoreThresholdsChanged = false;
        this.hideLoadingIconAfterLoadChanged = false;
        this.alwaysHideLoadingIconChanged = false;
        this.stateChangeAnimations = null;
        this.isPlayingStateChangeAnimations = false;
        this.pendingPostLoadingStateChangeAnimations = null;
        this.isPlayingPostLoadingStateChangeAnimations = false;
        this.currentStateChangeAnimationId = 0;
    }
    /**
     * @return {?}
     */
    ngOnInit() {
        this.configuration = this.getConfigurationFromInputString(this.configurationInput);
        // TODO(rachelrosen): Investigate changing these to ViewChildren/replacing
        // calls to querySelector, if possible.
        for (let /** @type {?} */ layerAnimationSelector of this.layerAnimationSelectors) {
            this.layerAnimationHandles.push(this.elementRef.nativeElement.querySelector(layerAnimationSelector));
        }
        this.updateLayerElementContainers();
        this.updateGradient();
    }
    /**
     * @return {?}
     */
    ngAfterViewInit() {
        this.widgetReady = Promise.resolve().then(() => {
            this.updateWidgetElement();
            this.getUpdateWidgetStateAnimation().play();
        });
    }
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
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
            let /** @type {?} */ valuesChanged = false;
            let /** @type {?} */ scoreThresholdChanges = changes['scoreThresholds'];
            for (let /** @type {?} */ i = 0; i < scoreThresholdChanges.previousValue.length; i++) {
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
     * @return {?}
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
            }
            else if (this.isPlayingPostLoadingStateChangeAnimations) {
                this.pendingPostLoadingStateChangeAnimations.kill();
                this.isPlayingPostLoadingStateChangeAnimations = false;
                console.debug('Killing pending post-loading state change animation');
            }
            // Animations to run immediately.
            let /** @type {?} */ afterChangesTimeline = new TimelineMax({
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
            }
            else {
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
                            this.pendingPostLoadingStateChangeAnimations.add(this.getUpdateWidgetStateAnimation());
                        }
                        else {
                            afterChangesTimeline.add(this.getUpdateWidgetStateAnimation());
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
                    let /** @type {?} */ loadingIconStyleChangedTimeline = new TimelineMax({});
                    // TODO(rachelrosen): Determine whether this covers all cases
                    // regarding the correct x position of elements, or if more animations
                    // are needed here.
                    loadingIconStyleChangedTimeline.add(this.getUpdateWidgetStateAnimation());
                    if (this.isLoading) {
                        this.pendingPostLoadingStateChangeAnimations.add(loadingIconStyleChangedTimeline);
                    }
                    else {
                        afterChangesTimeline.add(loadingIconStyleChangedTimeline);
                    }
                }
                else if (this.scoreThresholdsChanged) {
                    console.debug('Setting scoreThresholdsChanged to false');
                    this.scoreThresholdsChanged = false;
                    this.updateDemoSettingsAnimation = this.getUpdateWidgetStateAnimation();
                    if (this.isLoading) {
                        this.pendingPostLoadingStateChangeAnimations.add(this.updateDemoSettingsAnimation);
                    }
                    else {
                        afterChangesTimeline.add(this.updateDemoSettingsAnimation);
                    }
                }
                this.stateChangeAnimations = afterChangesTimeline;
                this.stateChangeAnimations.play();
            });
        }
    }
    /**
     * @return {?}
     */
    getFirstGradientRatio() {
        return FIRST_GRADIENT_RATIO;
    }
    /**
     * @param {?} gradientPointCount
     * @return {?}
     */
    getAdjustedGradientControlPoints(gradientPointCount) {
        // Points along a gradient of size |gradientPointCount| at which to add
        // colors. The first part of the gradient is not linear, and instead moves
        // from color 1 to color 2 with the ratio FIRST_GRADIENT_RATIO.
        // Use Math.floor because control points have to be integers.
        let /** @type {?} */ gradientPoints = [
            Math.floor(gradientPointCount * (this.scoreThresholds[0] + FIRST_GRADIENT_RATIO * (this.scoreThresholds[1] - this.scoreThresholds[0]))),
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
        for (let /** @type {?} */ i = gradientPoints.length - 1; i >= 0; i--) {
            if (gradientPoints[i] >= gradientPoints[i + 1]) {
                gradientPoints[i] -= (gradientPoints[i] - gradientPoints[i + 1] + 1);
            }
        }
        return gradientPoints;
    }
    /**
     * Updates the gradient color scale for the shape based on the
     * scoreThresholds.
     * @return {?}
     */
    updateGradient() {
        // The number of points to use to calculate the gradient.
        let /** @type {?} */ gradientPointCount = 100;
        let /** @type {?} */ gradientPoints = this.getAdjustedGradientControlPoints(gradientPointCount);
        const /** @type {?} */ sliderGradient = new color.ColorGradient();
        for (let /** @type {?} */ i = 0; i < gradientPoints.length; i++) {
            // If the gradient point is less than 0, it measn scoresThresholds[i] ===
            // scoreThresholds[i + 1] === 0, in which case we start at the second
            // higher indexed gradient color.
            if (gradientPoints[i] >= 0) {
                sliderGradient.addColorAt(gradientPoints[i], color.TColor.newHex(this.gradientColors[i]));
            }
        }
        this.gradientColorScale =
            sliderGradient.calcGradient(0, gradientPointCount).colors
                .map((tColor) => tColor.toRGBCSS());
    }
    /**
     * @param {?} score
     * @return {?}
     */
    interpolateColors(score) {
        // Find the two color indices to interpolate between, and prevent overflow
        // if the score >= 1 by just using the color at the last index.
        let /** @type {?} */ scoreLowerIndex = Math.min(Math.floor(score * 100), this.gradientColorScale.length - 1);
        let /** @type {?} */ scoreUpperIndex = Math.min(Math.ceil(score * 100), this.gradientColorScale.length - 1);
        let /** @type {?} */ interpolatorFn = interpolateRgb(this.gradientColorScale[scoreLowerIndex], this.gradientColorScale[scoreUpperIndex]);
        return interpolatorFn((score * 100) - scoreLowerIndex);
    }
    /**
     * @return {?}
     */
    updateWidgetElement() {
        if (this.circleSquareDiamondWidget != null) {
            this.widgetElement = this.circleSquareDiamondWidget.nativeElement;
        }
        else if (this.emojiWidget != null) {
            this.widgetElement = this.emojiWidget.nativeElement;
        }
        else {
            console.error('Widget element is null.');
            this.widgetElement = null;
        }
    }
    /**
     * @param {?} loadStart
     * @return {?}
     */
    getShouldHideStatusWidget(loadStart) {
        let /** @type {?} */ shouldHide = false;
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
    /**
     * @param {?} loadStart
     * @return {?}
     */
    getUpdateStatusWidgetVisibilityAnimation(loadStart) {
        let /** @type {?} */ hide = this.getShouldHideStatusWidget(loadStart);
        let /** @type {?} */ forceAnimation = false;
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
        }
        else {
            console.debug('Getting update status widget visibility animation.');
        }
        this.isPlayingShowOrHideLoadingWidgetAnimation = true;
        let /** @type {?} */ updateStatusWidgetVisibilityAnimation = new TimelineMax({
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
            this.getChangeLoadingIconXValueAnimation(hide)
        ]);
        return updateStatusWidgetVisibilityAnimation;
    }
    /**
     * @param {?} hide
     * @return {?}
     */
    getChangeLoadingIconVisibilityAnimation(hide) {
        return TweenMax.to(this.widgetElement, FADE_WIDGET_TIME_SECONDS, { opacity: hide ? 0 : 1 });
    }
    /**
     * @return {?}
     */
    getSetIconToNeutralStateAnimation() {
        let /** @type {?} */ timeline = new TimelineMax({});
        if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
            timeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
            timeline.add(this.getTransitionToCircleAnimation(SHAPE_MORPH_TIME_SECONDS, NEUTRAL_GRAY_COLOR));
        }
        else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
            timeline.add(this.getHideEmojisAnimation());
            timeline.add(this.getChangeColorAnimation(QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, NEUTRAL_GRAY_COLOR));
        }
        return timeline;
    }
    /**
     * @param {?} hide
     * @return {?}
     */
    getChangeLoadingIconXValueAnimation(hide) {
        let /** @type {?} */ timeline = new TimelineMax({});
        let /** @type {?} */ translateXAnimations = [];
        translateXAnimations.push(TweenMax.to(this.widgetElement, FADE_WIDGET_TIME_SECONDS, { x: hide ? -1 * (this.indicatorWidth
                + WIDGET_PADDING_PX
                + WIDGET_RIGHT_MARGIN_PX)
                : 0 }));
        if (this.configuration === Configuration.DEMO_SITE) {
            // Also shift the text for the leftmost element in each layer left/right
            // as needed. Even though only layer 0 is visible when the score changes,
            // the elements in the rest of the layers need to be adjusted to match
            // for when we transition to other layers.
            let /** @type {?} */ layer0TextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[0] + ' .layerText');
            let /** @type {?} */ layer1TextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[1] + ' .layerText');
            let /** @type {?} */ layer2InteractiveContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[2] + ' .interactiveElement');
            const /** @type {?} */ translateXSettings = {
                x: hide ? -1 * (this.indicatorWidth
                    + WIDGET_PADDING_PX
                    + WIDGET_RIGHT_MARGIN_PX)
                    : 0
            };
            translateXAnimations.push(TweenMax.to(layer0TextContainer, FADE_WIDGET_TIME_SECONDS, translateXSettings));
            translateXAnimations.push(TweenMax.to(layer1TextContainer, FADE_WIDGET_TIME_SECONDS, translateXSettings));
            translateXAnimations.push(TweenMax.to(layer2InteractiveContainer, FADE_WIDGET_TIME_SECONDS, translateXSettings));
        }
        timeline.add(translateXAnimations);
        return timeline;
    }
    /**
     * @param {?} inputString
     * @return {?}
     */
    getConfigurationFromInputString(inputString) {
        if (inputString === ConfigurationInput.EXTERNAL) {
            return Configuration.EXTERNAL;
        }
        else {
            // Demo site is the default.
            return Configuration.DEMO_SITE;
        }
    }
    /**
     * @return {?}
     */
    updateLayerElementContainers() {
        this.layerTextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[this.currentLayerIndex] + ' .layerText');
        this.interactiveLayerControlsContainer =
            this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[this.currentLayerIndex]
                + ' .interactiveElement');
    }
    /**
     * @param {?} score
     * @return {?}
     */
    shouldShowFeedback(score) {
        return score >= this.scoreThresholds[0];
    }
    /**
     * @param {?} text
     * @return {?}
     */
    parseEmojis(text) {
        return twemoji.parse(text);
    }
    /**
     * @param {?} score
     * @return {?}
     */
    getFeedbackTextForScore(score) {
        if (score >= this.scoreThresholds[2]) {
            return this.feedbackText[2];
        }
        else if (score >= this.scoreThresholds[1]) {
            return this.feedbackText[1];
        }
        else if (score >= this.scoreThresholds[0]) {
            return this.feedbackText[0];
        }
        else {
            return '';
        }
    }
    /**
     * @return {?}
     */
    feedbackContainerClicked() {
        if (this.configuration === Configuration.DEMO_SITE) {
            this.getTransitionToLayerAnimation(1, LAYER_TRANSITION_TIME_SECONDS).play();
        }
        else if (this.configuration === Configuration.EXTERNAL) {
            this.showFeedbackQuestion = true;
        }
    }
    /**
     * @param {?} success
     * @return {?}
     */
    feedbackCompleted(success) {
        if (success) {
            this.feedbackRequestSubmitted = true;
        }
        else {
            this.feedbackRequestError = true;
        }
        if (this.configuration === Configuration.DEMO_SITE) {
            let /** @type {?} */ feedbackCompletedTimeline = new TimelineMax({});
            feedbackCompletedTimeline.add([
                this.getTransitionToLayerAnimation(2, LAYER_TRANSITION_TIME_SECONDS),
                this.getSetIconToNeutralStateAnimation()
            ]);
            feedbackCompletedTimeline.play();
        }
    }
    /**
     * @return {?}
     */
    hideFeedbackQuestion() {
        this.showFeedbackQuestion = false;
    }
    /**
     * @return {?}
     */
    resetFeedback() {
        this.showFeedbackQuestion = false;
        this.feedbackRequestInProgress = false;
        this.feedbackRequestSubmitted = false;
        this.feedbackRequestError = false;
    }
    /**
     * @return {?}
     */
    resetLayers() {
        this.resetFeedback();
        let /** @type {?} */ resetAnimationTimeline = new TimelineMax({});
        resetAnimationTimeline.add(this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
        resetAnimationTimeline.add(this.getUpdateWidgetStateAnimation());
        resetAnimationTimeline.play();
    }
    /**
     * @param {?} commentIsToxic
     * @return {?}
     */
    submitFeedback(commentIsToxic) {
        this.feedbackRequestError = false;
        this.commentFeedbackSubmitted.emit({ commentMarkedAsToxic: commentIsToxic });
    }
    /**
     * @return {?}
     */
    getResetRotationAnimation() {
        return TweenMax.to(this.widgetElement, 0.1, {
            rotation: this.currentShape === Shape.DIAMOND ? 45 : 0,
        });
    }
    /**
     * @param {?} score
     * @return {?}
     */
    getShapeForScore(score) {
        if (score > this.scoreThresholds[2]) {
            return Shape.DIAMOND;
        }
        else if (score > this.scoreThresholds[1]) {
            return Shape.SQUARE;
        }
        else {
            return Shape.CIRCLE;
        }
    }
    /**
     * @param {?} score
     * @return {?}
     */
    getEmojiForScore(score) {
        if (score > this.scoreThresholds[2]) {
            return Emoji.SAD;
        }
        else if (score > this.scoreThresholds[1]) {
            return Emoji.NEUTRAL;
        }
        else {
            return Emoji.SMILE;
        }
    }
    /**
     * @param {?} score
     * @return {?}
     */
    getUpdateShapeAnimation(score) {
        if (this.loadingIconStyle !== LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
            console.debug('Calling getUpdateShapeAnimation(), but the loading icon'
                + 'style is not set to circle/square/diamond. Returning an'
                + 'empty timeline.');
            // The loading icon state has been changed; return an empty timeline.
            // This is not an error and can happen when the loading icon state is
            // changed via data binding while the loading animation is active.
            return new TimelineMax({});
        }
        let /** @type {?} */ updateShapeAnimationTimeline = new TimelineMax({
            onStart: () => {
                this.isPlayingUpdateShapeAnimation = true;
            },
            onComplete: () => {
                this.isPlayingUpdateShapeAnimation = false;
            },
        });
        // Shrink before updating to a new shape.
        updateShapeAnimationTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
        if (score > this.scoreThresholds[2]) {
            updateShapeAnimationTimeline.add(this.getTransitionToDiamondAnimation(.8 * SHAPE_MORPH_TIME_SECONDS));
        }
        else if (score > this.scoreThresholds[1]) {
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
            updateShapeAnimationTimeline.add(this.getTransitionToSquareAnimation(SHAPE_MORPH_TIME_SECONDS));
        }
        else {
            updateShapeAnimationTimeline.add(this.getTransitionToCircleAnimation(SHAPE_MORPH_TIME_SECONDS));
        }
        return updateShapeAnimationTimeline;
    }
    /**
     * @param {?} showMoreInfo
     * @return {?}
     */
    setShowMoreInfo(showMoreInfo) {
        this.getTransitionToLayerAnimation(showMoreInfo ? 1 : 0, LAYER_TRANSITION_TIME_SECONDS).play();
    }
    /**
     * @param {?} emoji
     * @return {?}
     */
    getAccessibilityDescriptionForEmoji(emoji) {
        if (emoji === Emoji.SMILE) {
            return "Smile emoji";
        }
        else if (emoji === Emoji.NEUTRAL) {
            return "Neutral emoji";
        }
        else {
            return "Sad emoji";
        }
    }
    /**
     * @param {?} emojiType
     * @return {?}
     */
    getEmojiElementFromEmojiType(emojiType) {
        if (emojiType === Emoji.SMILE) {
            return this.smileEmoji.nativeElement;
        }
        else if (emojiType === Emoji.NEUTRAL) {
            return this.neutralEmoji.nativeElement;
        }
        else {
            return this.sadEmoji.nativeElement;
        }
    }
    ;
    /**
     * @param {?} loadingIconStyle
     * @param {?} isPlayingLoadingAnimation
     * @return {?}
     */
    getAnimationA11yLabel(loadingIconStyle, isPlayingLoadingAnimation) {
        if (isPlayingLoadingAnimation) {
            return "Computing score animation";
        }
        else if (loadingIconStyle === LoadingIconStyle.EMOJI) {
            return this.getAccessibilityDescriptionForEmoji(this.currentEmoji);
        }
        else {
            return this.getAccessibilityDescriptionForShape(this.currentShape);
        }
    }
    /**
     * @return {?}
     */
    notifyModelInfoLinkClicked() {
        this.modelInfoLinkClicked.emit();
    }
    /**
     * @return {?}
     */
    getUpdateWidgetStateAnimation() {
        let /** @type {?} */ updateScoreCompletedTimeline = new TimelineMax({
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
            let /** @type {?} */ updateScoreCompletedTimeline = new TimelineMax({
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
            updateScoreCompletedTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
            updateScoreCompletedTimeline.add(this.getUpdateShapeAnimation(this.score));
            return updateScoreCompletedTimeline;
        }
        else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
            console.debug('Update widget state for emoji style');
            updateScoreCompletedTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
            updateScoreCompletedTimeline.add(this.getShowEmojiAnimation());
            return updateScoreCompletedTimeline;
        }
        else {
            console.error('Calling updateWidgetState for unknown loadingIconStyle: '
                + this.loadingIconStyle);
            return new TimelineMax({});
        }
    }
    /**
     * @param {?} score
     * @return {?}
     */
    notifyScoreChange(score) {
        console.debug('Setting this.score =', score);
        this.score = score;
        if (this.isPlayingLoadingAnimation) {
            // Loading just ended.
            this.setLoading(false);
        }
        else {
            // This indicates that the score was reset without being the result of a
            // load completing, such as the text being cleared.
            console.debug('Updating shape from notifyScoreChange');
            this.getUpdateWidgetStateAnimation().play();
        }
    }
    /**
     * @param {?} loading
     * @return {?}
     */
    setLoading(loading) {
        this.widgetReady.then(() => {
            console.debug('Calling setLoading(' + loading + ')');
            if (this.widgetElement === null) {
                console.error('this.widgetElement = null in call to setLoading');
                return;
            }
            this.isLoading = loading;
            if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
                this.setLoadingForDefaultWidget(loading);
            }
            else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
                this.setLoadingForEmojiWidget(loading);
            }
            else {
                console.error('Calling setLoading for unknown loadingIconStyle: ' + this.loadingIconStyle);
            }
        });
    }
    /**
     * @param {?} element
     * @param {?} timeSeconds
     * @param {?} opacity
     * @return {?}
     */
    getChangeOpacityAnimation(element, timeSeconds, opacity) {
        return TweenMax.to(element, timeSeconds, { opacity: opacity });
    }
    /**
     * @return {?}
     */
    getShowEmojiAnimation() {
        if (this.loadingIconStyle !== LoadingIconStyle.EMOJI) {
            console.debug('Calling getShowEmojiAnimation() but loading icon style is'
                + 'not emoji style, returning an empty timeline');
            // The loading icon state has been changed; return an empty timeline.
            // This is not an error and can happen when the loading icon state is
            // changed via data binding while the loading animation is active.
            return new TimelineMax({});
        }
        let /** @type {?} */ emojiType = null;
        if (this.score > this.scoreThresholds[2]) {
            emojiType = Emoji.SAD;
        }
        else if (this.score > this.scoreThresholds[1]) {
            emojiType = Emoji.NEUTRAL;
        }
        else {
            emojiType = Emoji.SMILE;
        }
        let /** @type {?} */ emojiElementToShow = this.getEmojiElementFromEmojiType(emojiType);
        let /** @type {?} */ showEmojiTimeline = new TimelineMax({
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
        const /** @type {?} */ resetBackgroundColorAnimation = this.getChangeColorAnimation(QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, EMOJI_COLOR);
        showEmojiTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
        showEmojiTimeline.add([
            resetBackgroundColorAnimation,
            this.getToFullScaleBounceAnimation(EMOJI_BOUNCE_IN_TIME_SECONDS),
            this.getChangeOpacityAnimation(emojiElementToShow, FADE_EMOJI_TIME_SECONDS, 1)
        ]);
        return showEmojiTimeline;
    }
    /**
     * @return {?}
     */
    getHideEmojisAnimation() {
        let /** @type {?} */ hideEmojiTimeline = new TimelineMax({
            onComplete: () => {
                this.ngZone.run(() => {
                    this.hideEmojiIconsForLoadingAnimation = true;
                });
            }
        });
        hideEmojiTimeline.add([
            this.getChangeOpacityAnimation(this.smileEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0),
            this.getChangeOpacityAnimation(this.neutralEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0),
            this.getChangeOpacityAnimation(this.sadEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0)
        ]);
        return hideEmojiTimeline;
    }
    /**
     * Loading animations to play before loading starts for emoji-style loading.
     * @return {?}
     */
    getStartAnimationsForEmojiWidgetLoading() {
        let /** @type {?} */ loadingStartTimeline = new TimelineMax({});
        // Reset to the first layer if we're not already there.
        if (this.currentLayerIndex !== 0) {
            loadingStartTimeline.add(this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
        }
        // Update visibility of the emoji icon before starting; it could have
        // disappeared due to certain settings, and in some of these cases it
        // needs to reappear before loading animation begins.
        loadingStartTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(true));
        loadingStartTimeline.add(this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
        loadingStartTimeline.add([
            this.getHideEmojisAnimation(),
            // Change color of the emoji background back to the yellow color before
            // the main loading (it could be gray from being in a neutral state).
            this.getChangeColorAnimation(COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, EMOJI_COLOR)
        ]);
        return loadingStartTimeline;
    }
    /**
     * Loopable loading animations to play for emoji-style loading.
     * @return {?}
     */
    getLoopAnimationForEmojiWidgetLoading() {
        let /** @type {?} */ shrinkAndFadeTimeline = new TimelineMax({
            // Apply ease
            ease: Power3.easeInOut
        });
        shrinkAndFadeTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
        return shrinkAndFadeTimeline;
    }
    /**
     * Loading animations to play when loading finishes for emoji-style loading.
     * @param {?} loadingTimeline
     * @return {?}
     */
    getEndAnimationsForEmojiWidgetLoading(loadingTimeline) {
        let /** @type {?} */ loadingEndTimeline = new TimelineMax({
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
                    }
                    else if (this.currentEmoji !== this.getEmojiForScore(this.score)) {
                        // The score has changed between now and when the animation
                        // started (the emoji is no longer valid).
                        console.debug('Load ending animation completed, found an out of date shape');
                        this.notifyScoreChange(this.score);
                    }
                });
            }
        });
        let /** @type {?} */ scoreCompletedAnimations = [];
        scoreCompletedAnimations.push(this.getShowEmojiAnimation());
        scoreCompletedAnimations.push(this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));
        // If we're revealing the status widget, play the reveal animation
        // before the update emoji animation.
        if (!this.getShouldHideStatusWidget(false)) {
            loadingEndTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        loadingEndTimeline.add(scoreCompletedAnimations);
        // If we're hiding the status widget, play the hide widget
        // animation after the update emoji animation.
        if (this.getShouldHideStatusWidget(false)) {
            loadingEndTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        if (this.pendingPostLoadingStateChangeAnimations) {
            loadingEndTimeline.add(this.pendingPostLoadingStateChangeAnimations);
        }
        return loadingEndTimeline;
    }
    /**
     * Loading animations to play before loading starts for
     * circle/square/diamond-style loading.
     * @return {?}
     */
    getStartAnimationsForCircleSquareDiamondWidgetLoading() {
        let /** @type {?} */ startAnimationsTimeline = new TimelineMax({
            align: 'sequence',
        });
        // Start animations happen in three groups. Group 0 animations before
        // group 1, which animates before group 2. The animations within each
        // group start at the same time.
        let /** @type {?} */ startAnimationsGroup0 = [];
        let /** @type {?} */ startAnimationsGroup1 = [];
        let /** @type {?} */ startAnimationsGroup2 = [];
        // Update visibility of the status widget before starting; it could have
        // disappeared due to certain settings, and in some of these cases it
        // needs to reappear before loading animation begins.
        startAnimationsGroup0.push(this.getUpdateStatusWidgetVisibilityAnimation(true));
        startAnimationsGroup2.push(this.getToGrayScaleAnimation(GRAYSCALE_ANIMATION_TIME_SECONDS));
        if (this.showScore) {
            if (this.currentLayerIndex !== 0) {
                startAnimationsGroup1.push(this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
            }
            startAnimationsGroup2.push(this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
        }
        startAnimationsTimeline.add(startAnimationsGroup0);
        startAnimationsTimeline.add(startAnimationsGroup1);
        startAnimationsTimeline.add(startAnimationsGroup2);
        return startAnimationsTimeline;
    }
    /**
     * Main loading animation to play on loop for the circle/square/diamond style
     * loading.
     * @return {?}
     */
    getLoopAnimationsForCircleSquareDiamondWidgetLoading() {
        let /** @type {?} */ shrinkAndFadeTimeline = new TimelineMax({
            // Apply ease.
            ease: Power3.easeInOut
        });
        shrinkAndFadeTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
        return shrinkAndFadeTimeline;
    }
    /**
     * Loading animations to play when loading finishes for
     * circle/square/diamond-style loading.
     * @param {?} loadingTimeline
     * @return {?}
     */
    getEndAnimationsForCircleSquareDiamondWidgetLoading(loadingTimeline) {
        let /** @type {?} */ updateScoreCompletedTimeline = new TimelineMax({
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
                    }
                    else if (this.currentShape !== this.getShapeForScore(this.score)) {
                        // The score has changed between now and when the animation
                        // started (the shape is no longer valid).
                        console.debug('Load ending animation completed, found an out of date shape');
                        this.notifyScoreChange(this.score);
                    }
                });
            }
        });
        let /** @type {?} */ scoreCompletedAnimations = [];
        scoreCompletedAnimations.push(this.getUpdateShapeAnimation(this.score));
        if (this.showScore) {
            scoreCompletedAnimations.push(this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));
        }
        // If we're revealing the status widget, play the reveal animation
        // before the update shape animation.
        if (!this.getShouldHideStatusWidget(false)) {
            updateScoreCompletedTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        updateScoreCompletedTimeline.add(scoreCompletedAnimations);
        // If we're hiding the status widget, play the hide widget
        // animation after the update shape animation.
        if (this.getShouldHideStatusWidget(false)) {
            updateScoreCompletedTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        if (this.pendingPostLoadingStateChangeAnimations) {
            updateScoreCompletedTimeline.add(this.pendingPostLoadingStateChangeAnimations);
        }
        return updateScoreCompletedTimeline;
    }
    /**
     * @param {?} loading
     * @return {?}
     */
    setLoadingForEmojiWidget(loading) {
        if (loading && !this.isPlayingLoadingAnimation) {
            this.isPlayingLoadingAnimation = true;
            let /** @type {?} */ loadingTimeline = new TimelineMax({
                paused: true,
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
                        }
                        else {
                            this.getEndAnimationsForEmojiWidgetLoading(loadingTimeline).play();
                        }
                    });
                }
            });
            loadingTimeline.add(this.getStartAnimationsForEmojiWidgetLoading());
            loadingTimeline.add(this.getLoopAnimationForEmojiWidgetLoading(), EMOJI_MAIN_LOADING_ANIMATION_LABEL);
            loadingTimeline.play();
        }
    }
    /**
     * @param {?} loading
     * @return {?}
     */
    setLoadingForDefaultWidget(loading) {
        if (loading && !this.isPlayingLoadingAnimation) {
            console.debug('About to create loadingTimeline');
            // Set isPlayingLoadingAnimation = true here instead of in the onStart()
            // of the animation, so that the animation does not start twice if this
            // function gets called twice in rapid succession.
            this.isPlayingLoadingAnimation = true;
            let /** @type {?} */ loadingTimeline = new TimelineMax({
                paused: true,
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
                        }
                        else {
                            console.debug('Loading complete');
                            console.debug('hasScore:', this.hasScore);
                            let /** @type {?} */ updateScoreCompletedTimeline = this.getEndAnimationsForCircleSquareDiamondWidgetLoading(loadingTimeline);
                            updateScoreCompletedTimeline.play();
                        }
                    });
                },
            });
            let /** @type {?} */ startAnimationsTimeline = this.getStartAnimationsForCircleSquareDiamondWidgetLoading();
            loadingTimeline.add(startAnimationsTimeline, LOADING_START_ANIMATIONS_LABEL);
            loadingTimeline.add(this.getLoopAnimationsForCircleSquareDiamondWidgetLoading(), FADE_START_LABEL);
            loadingTimeline.play();
        }
    }
    /**
     * @param {?} shape
     * @return {?}
     */
    getNameFromShape(shape) {
        if (shape == Shape.CIRCLE) {
            return 'circle';
        }
        else if (shape == Shape.SQUARE) {
            return 'square';
        }
        else {
            return 'diamond';
        }
    }
    /**
     * @param {?} shape
     * @return {?}
     */
    getAccessibilityDescriptionForShape(shape) {
        if (shape == Shape.CIRCLE) {
            return 'Low toxicity icon.';
        }
        else if (shape == Shape.SQUARE) {
            return 'Medium toxicity icon.';
        }
        else {
            return 'High toxicity icon.';
        }
    }
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getUpdateGradientColorAnimation(timeSeconds) {
        return this.getChangeColorAnimation(timeSeconds, this.interpolateColors(this.score));
    }
    /**
     * @param {?} timeSeconds
     * @param {?} color
     * @return {?}
     */
    getChangeColorAnimation(timeSeconds, color$$1) {
        return TweenMax.to(this.widgetElement, timeSeconds, {
            backgroundColor: color$$1,
        });
    }
    /**
     * @param {?} timeSeconds
     * @param {?=} endColor
     * @return {?}
     */
    getTransitionToCircleAnimation(timeSeconds, endColor) {
        let /** @type {?} */ circleAnimationTimeline = new TimelineMax({
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
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getTransitionToSquareAnimation(timeSeconds) {
        let /** @type {?} */ squareAnimationTimeline = new TimelineMax({
            onStart: () => {
                let /** @type {?} */ currentRotation = 0;
                let /** @type {?} */ currentWidgetTransform = (/** @type {?} */ (this.widgetElement))._gsTransform;
                if (currentWidgetTransform !== undefined) {
                    currentRotation = currentWidgetTransform.rotation;
                }
                console.debug('getTransitionToSquare; Current rotation:', currentRotation);
            },
            onComplete: () => {
            },
        });
        let /** @type {?} */ previousShape = this.currentShape;
        squareAnimationTimeline.add([
            this.getSquareAnimation(timeSeconds / 4),
            this.getToFullScaleCompleteRotationAnimation(timeSeconds, previousShape)
        ]);
        return squareAnimationTimeline;
    }
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getTransitionToDiamondAnimation(timeSeconds) {
        let /** @type {?} */ diamondAnimationTimeline = new TimelineMax({
            onStart: () => {
            },
            onComplete: () => {
            },
        });
        diamondAnimationTimeline.add([
            this.getDiamondAnimation(timeSeconds / 6),
            this.getToFullScaleAnimation(timeSeconds / 6),
        ]);
        diamondAnimationTimeline.add(this.getRotateBackAndForthAnimation(timeSeconds / 6, 85));
        diamondAnimationTimeline.add(this.getRotateBackAndForthAnimation(timeSeconds / 6, 5));
        diamondAnimationTimeline.add(this.getRotateBackAndForthAnimation(timeSeconds / 6, 65));
        diamondAnimationTimeline.add(this.getRotateBackAndForthAnimation(timeSeconds / 6, 25));
        diamondAnimationTimeline.add(this.getRotateBackAndForthAnimation(timeSeconds / 6, 45));
        return diamondAnimationTimeline;
    }
    /**
     * @param {?} timeSeconds
     * @param {?} degrees
     * @return {?}
     */
    getRotateBackAndForthAnimation(timeSeconds, degrees) {
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
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getToFullScaleBounceAnimation(timeSeconds) {
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
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getToFullScaleAnimation(timeSeconds) {
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
    /**
     * @param {?} timeSeconds
     * @param {?} fromShape
     * @return {?}
     */
    getToFullScaleCompleteRotationAnimation(timeSeconds, fromShape) {
        let /** @type {?} */ currentRotation = 0;
        let /** @type {?} */ currentWidgetTransform = (/** @type {?} */ (this.widgetElement))._gsTransform;
        if (currentWidgetTransform !== undefined) {
            currentRotation = currentWidgetTransform.rotation;
        }
        console.debug('Current rotation:', currentRotation);
        console.debug('From shape:', this.getNameFromShape(fromShape));
        let /** @type {?} */ rotationDegrees = fromShape === Shape.DIAMOND ? 315 : 360;
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
    /**
     * @param {?} endLayerIndex
     * @param {?} timeSeconds
     * @return {?}
     */
    getTransitionToLayerAnimation(endLayerIndex, timeSeconds) {
        this.layerHeightPixels = this.layerAnimationHandles[this.currentLayerIndex].offsetHeight;
        let /** @type {?} */ timeline = new TimelineMax({
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
        let /** @type {?} */ startLayer = this.layerAnimationHandles[this.currentLayerIndex];
        let /** @type {?} */ endLayer = this.layerAnimationHandles[endLayerIndex];
        if (this.currentLayerIndex < endLayerIndex) {
            timeline.add([
                this.getShiftLayerVerticallyAnimation(startLayer, timeSeconds, 0, -1 * this.layerHeightPixels, false),
                this.getShiftLayerVerticallyAnimation(endLayer, timeSeconds, this.layerHeightPixels, 0, true),
            ]);
        }
        else {
            timeline.add([
                this.getShiftLayerVerticallyAnimation(startLayer, 1, 0, this.layerHeightPixels, false),
                this.getShiftLayerVerticallyAnimation(endLayer, 1, -1 * this.layerHeightPixels, 0, true),
            ]);
        }
        return timeline;
    }
    /**
     * @param {?} layer
     * @param {?} timeSeconds
     * @param {?} startY
     * @param {?} endY
     * @param {?} fadeIn
     * @return {?}
     */
    getShiftLayerVerticallyAnimation(layer, timeSeconds, startY, endY, fadeIn) {
        return TweenMax.fromTo(layer, timeSeconds, { y: startY, opacity: fadeIn ? 0 : 1 }, { y: endY, opacity: fadeIn ? 1 : 0 });
    }
    /**
     * @param {?} timeSeconds
     * @param {?=} endColor
     * @return {?}
     */
    getCircleAnimation(timeSeconds, endColor) {
        if (!endColor) {
            endColor = this.interpolateColors(this.score);
        }
        return TweenMax.to(this.widgetElement, timeSeconds, {
            rotation: 0,
            borderRadius: "50%",
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
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getSquareAnimation(timeSeconds) {
        return TweenMax.to(this.widgetElement, timeSeconds, {
            rotation: 0,
            borderRadius: 0,
            backgroundColor: this.interpolateColors(this.score),
            onStart: () => {
                console.debug('Morphing to square from ' + this.getNameFromShape(this.currentShape));
                this.currentShape = Shape.SQUARE;
            },
            onComplete: () => {
                console.debug('Done morphing to square');
            },
        });
    }
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getDiamondAnimation(timeSeconds) {
        return TweenMax.to(this.widgetElement, timeSeconds, {
            borderRadius: 0,
            rotation: 45,
            backgroundColor: this.interpolateColors(this.score),
            onStart: () => {
                console.debug('Morphing to diamond from ' + this.getNameFromShape(this.currentShape));
                this.currentShape = Shape.DIAMOND;
            },
            onComplete: () => {
                console.debug('Done morphing to diamond.');
            },
        });
    }
    /**
     * @param {?} timeSeconds
     * @return {?}
     */
    getToGrayScaleAnimation(timeSeconds) {
        return TweenMax.to(this.widgetElement, timeSeconds, {
            backgroundColor: GRAY_COLOR_CIRCLE_LOADING,
        });
    }
    /**
     * @param {?} timeSeconds
     * @param {?} repeat
     * @return {?}
     */
    getFadeAndShrinkAnimation(timeSeconds, repeat) {
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
    /**
     * @param {?} timeSeconds
     * @param {?} hide
     * @param {?} layerIndex
     * @return {?}
     */
    getFadeDetailsAnimation(timeSeconds, hide, layerIndex) {
        let /** @type {?} */ timeline = new TimelineMax({
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
        let /** @type {?} */ interactiveLayerControlsContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[layerIndex] + ' .interactiveElement');
        let /** @type {?} */ layerTextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[layerIndex] + ' .layerText');
        timeline.add([
            TweenMax.to(interactiveLayerControlsContainer, timeSeconds, { opacity: (hide ? 0 : 1) }),
            TweenMax.to(layerTextContainer, timeSeconds, { opacity: (hide ? 0 : 1) }),
        ], 0, 'normal', 0);
        return timeline;
    }
}
PerspectiveStatus.decorators = [
    { type: Component, args: [{
                selector: 'perspective-status',
                template: `<div #widgetContainer id="widgetContainer" class="horizontal-container">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet">
  <!-- For items that need to be animated, hidden is used instead of *ngIf.
       This is because *ngIf removes items from the DOM, which means they
       cannot be found when the component is initializing if their display
       conditions are not met. -->
  <div id="animationContainer">
    <div *ngIf="loadingIconStyle === loadingIconStyleConst.CIRCLE_SQUARE_DIAMOND"
         id="circleSquareDiamondLoadingIconContainer">
      <div
           #circleSquareDiamondWidget
           id="circleSquareDiamondWidget"
           class="dot"
           [style.width]="indicatorWidth"
           [style.height]="indicatorHeight"
           [hidden]="shouldHideStatusWidget || alwaysHideLoadingIcon"
           [attr.aria-hidden]="shouldHideStatusWidget || isPlayingShowOrHideLoadingWidgetAnimation || alwaysHideLoadingIcon"
           [attr.aria-label]="getAnimationA11yLabel(loadingIconStyle, isPlayingLoadingAnimation)"
           tabindex=0>
      </div>
    </div>
    <div *ngIf="loadingIconStyle === loadingIconStyleConst.EMOJI">
      <div
           #emojiStatusWidget
           id="emojiStatusWidget"
           class="dot emojiWidget"
           tabindex=0
           [attr.aria-label]="getAnimationA11yLabel(loadingIconStyle, isPlayingLoadingAnimation)">
        <img #smileEmoji id="smileEmoji" class="iconEmoji"
             [ngClass]="{hiddenEmoji: hideEmojiIconsForLoadingAnimation || score >= scoreThresholds[1]}"
             src="assets/grinning_face.png">
        <img #neutralEmoji id="neutralEmoji" class="iconEmoji"
             [ngClass]="{hiddenEmoji: hideEmojiIconsForLoadingAnimation || (score < scoreThresholds[1] || score >= scoreThresholds[2])}"
             src="assets/thinking_face.png">
        <img #sadEmoji id="sadEmoji" class="iconEmoji"
             [ngClass]="{hiddenEmoji: hideEmojiIconsForLoadingAnimation || score < scoreThresholds[2]}"
             src="assets/disappointed_face.png">
      </div>
    </div>
  </div>

  <div class="layersContainer">
    <!-- TODO(rachelrosen): Check the necessity of specifying aria-hidden here and elsewhere. -->
    <div id="layer1" [ngClass]="{'horizontal-container': true,
                                 'detailsContainer': true,
                                 'layer': true,
                                 'hiddenLayer': !layersAnimating && currentLayerIndex !== 0}"
                     [attr.aria-hidden]="currentLayerIndex !== 0">
      <div id="layerText" class="layerText">
        <!-- For layer 1 text, configurations EXTERNAL and DEMO_SITE are the same.-->
        <div>
          <div id="noBorderButtonscoreInfo"
               class="widgetText"
               *ngIf="hasScore && !analyzeErrorMessage && shouldShowFeedback(score)"
               [style.fontSize]="fontSize"
               tabindex=0
               role="status"
               [attr.aria-hidden]="!showScore || isPlayingLoadingAnimation || isPlayingFadeDetailsAnimation">
            <span id="feedbackText" [innerHTML]="parseEmojis(getFeedbackTextForScore(score))"></span><span *ngIf="showPercentage" id="percentage">({{score.toFixed(2)}})</span><span
               *ngIf="showMoreInfoLink"
               class="link"
               role="link"
               tabindex=0
               (keyup.enter)="notifyModelInfoLinkClicked()"
               (keyup.space)="notifyModelInfoLinkClicked()"
               (click)="notifyModelInfoLinkClicked()">Learn more</span>
          </div>

          <div class="error" *ngIf="initializeErrorMessage">
            {{initializeErrorMessage}}
          </div>
          <div class="error" *ngIf="analyzeErrorMessage">
            {{analyzeErrorMessage}}
          </div>
        </div><!-- End configuration DEMO_SITE or EXTERNAL -->

      </div> <!-- End layerText -->

      <div class="interactiveElement">
        <div *ngIf="configuration === configurationEnum.EXTERNAL">
          <div id="infoButtonContainer" class="infoButtonContainer">
            <button *ngIf="hasScore && shouldShowFeedback(score)"
              id="infoButton"
              class="infoButton"
              role="button"
              aria-label="Show score details"
              [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
              (click)="setShowMoreInfo(true)"
              tabindex=0>
              <i class="material-icons md-dark md-18">info</i>
            </button>
          </div>
        </div> <!-- End configuration EXTERNAL-->

        <div *ngIf="configuration === configurationEnum.DEMO_SITE">
          <button id="seemWrongButtonDemoConfig"
               *ngIf="canAcceptFeedback && shouldShowFeedback(score)"
               role="button"
               class="seemWrongButton purpleButton noBorderButton"
               [style.fontSize]="fontSize"
               [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
               (click)="feedbackContainerClicked()"
               tabindex=0>
            {{userFeedbackPromptText}}
          </button>
        </div>

      </div> <!-- End interactiveElement -->
    </div> <!-- End layer1 -->

    <div id="layer2" [ngClass]="{'horizontal-container': true,
                                 'detailsContainer': true,
                                 'layer': true,
                                 'hiddenLayer': !layersAnimating && currentLayerIndex !== 1}"
                     [attr.aria-hidden]="currentLayerIndex !== 1">

      <div class="layerText">
        <div *ngIf="configuration === configurationEnum.EXTERNAL">
          <div id="detailedScoreInfo"
               class="widgetText"
               role="status"
               tabindex=0>
            <span>Scored {{(score.toFixed(2) * 100).toFixed(0)}}% by the <a href="https://conversationai.github.io/">Perspective "Toxicity" analyzer</a>
            </span>
          </div>
        </div> <!-- End configuration EXTERNAL-->

        <div *ngIf="configuration === configurationEnum.DEMO_SITE">
          <div class="widgetText"
            tabindex=0>
            <span>Is this comment
              <span class="link"
                    role="link"
                    tabindex=0
                    (keyup.enter)="notifyModelInfoLinkClicked()"
                    (keyup.space)="notifyModelInfoLinkClicked()"
                    (click)="notifyModelInfoLinkClicked()">toxic</span>?
            </span>
          </div>
        </div> <!-- End configuration DEMO_SITE -->

      </div> <!-- End layerText -->

      <div class="interactiveElement">

        <div *ngIf="configuration === configurationEnum.EXTERNAL">
          <div class="horizontal-container">
            <div class="feedbackContainer widgetText"
                 [style.fontSize]="fontSize"
                 [attr.aria-hidden]="!showScore || isPlayingLoadingAnimation">
              <button id="seemWrongButton"
                   *ngIf="canAcceptFeedback && !showFeedbackQuestion
                      && !feedbackRequestInProgress && !feedbackRequestSubmitted && !feedbackRequestError"
                   role="button"
                   class="seemWrongButton greyButton noBorderButton"
                   [style.fontSize]="fontSize"
                   [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
                   (click)="feedbackContainerClicked()"
                   tabindex=0>
                {{userFeedbackPromptText}}
              </button>
              <div id="seemWrongQuestion" *ngIf="showFeedbackQuestion && !feedbackRequestInProgress">
                <div class="feedbackQuestion widgetText" tabindex=0>Is this text toxic?</div>
                <div class="yesNoButtonContainer horizontal-container">
                  <div>
                    <button
                      id="yesButtonExternalConfig"
                      class="yesNoButton greyButton underlineButton noBorderButton"
                      role="button"
                      [style.fontSize]="fontSize"
                      [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
                      (click)="submitFeedback(true)"
                      tabindex=0>
                      Yes
                    </button>
                  </div>
                  <div>
                    <button
                      id="noButtonExternalConfig"
                      class="yesNoButton greyButton underlineButton noBorderButton"
                      role="button"
                      [style.fontSize]="fontSize"
                      [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
                      (click)="submitFeedback(false)"
                      tabindex=0>
                      No
                    </button>
                  </div>
                </div>
              </div>
              <div id="feedbackSubmitting"
                   tabindex=0
                   role="status"
                   *ngIf="feedbackRequestInProgress">
                Sending...
              </div>
              <div id="feedbackThanks"
                   tabindex=0
                   role="status"
                   *ngIf="feedbackRequestSubmitted">
                Thanks for the feedback!
              </div>
              <div *ngIf="feedbackRequestError">
                <button
                     class="error noBorderButton"
                     role="button"
                     [style.fontSize]="fontSize"
                     (click)="resetFeedback()"
                     tabindex=0>
                  Error submitting feedback. Click to try again.
                </button>
              </div>
            </div>
            <div id="infoButtonContainer" class="infoButtonContainer">
              <button *ngIf="hasScore"
                id="cancelButton"
                class="infoButton"
                role="button"
                aria-label="Hide score details"
                [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
                (click)="setShowMoreInfo(false)"
                tabindex=0>
                <i class="material-icons md-dark md-18">cancel</i>
              </button>
            </div>
          </div>
        </div> <!-- End configuration EXTERNAL -->

        <div *ngIf="configuration === configurationEnum.DEMO_SITE">
          <div class="yesNoButtonContainer horizontal-container"
               *ngIf="!feedbackRequestInProgress && !feedbackRequestSubmitted && !feedbackRequestError">
            <div>
              <button
                id="yesButtonDemoConfig"
                class="yesNoButton purpleButton noBorderButton"
                role="button"
                [style.fontSize]="fontSize"
                [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
                (click)="submitFeedback(true)"
                tabindex=0>
                Yes
              </button>
            </div>
            <div>
              <button
                id="noButtonDemoConfig"
                class="yesNoButton purpleButton noBorderButton"
                role="button"
                [style.fontSize]="fontSize"
                [disabled]="!showScore || isPlayingLoadingAnimation || layersAnimating"
                (click)="submitFeedback(false)"
                tabindex=0>
                No
              </button>
            </div>
          </div>
        </div> <!-- End configuration DEMO_SITE -->

      </div> <!-- End layer2 interactive element -->

    </div> <!-- End layer2 -->

    <div id="layer3" [ngClass]="{'horizontal-container': true,
                                 'detailsContainer': true,
                                 'hiddenLayer': !layersAnimating && currentLayerIndex !== 2}">
      <div class="interactiveElement">

        <div *ngIf="configuration === configurationEnum.DEMO_SITE">
            <div id="feedbackThanksDemoConfig"
                 class="widgetText"
                 tabindex=0
                 role="status"
                 *ngIf="feedbackRequestSubmitted">
              <button
                id="thanksForFeedbackButtonDemoConfig"
                class="noBorderButton feedbackResponseButton widgetText"
                role="button"
                (click)="resetLayers()">
                Thanks for your feedback!
              </button>
            </div>
            <div *ngIf="feedbackRequestError">
              <button
                   class="error noBorderButton feedbackResponseButton"
                   role="button"
                   [style.fontSize]="fontSize"
                   (click)="resetLayers()"
                   tabindex=0>
                Error submitting feedback. Click to try again.
              </button>
            </div>
        </div> <!-- End configuration DEMO_SITE. -->
      </div> <!-- End interactiveElement. -->
    </div> <!-- End layer3 -->

  </div>
</div>
`,
                styles: [`.horizontal-container{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-ms-flex-direction:row;flex-direction:row}.center-perp-axis{-webkit-box-align:center;-ms-flex-align:center;align-items:center}.dot{border-radius:50%;border:0;background-color:#00bcd4;margin:2px;padding:0;width:13px;height:13px;vertical-align:top}#circleSquareDiamondLoadingIconContainer{padding-top:2px}.emojiWidget{background-color:#ffcc4d;width:16px;height:16px}.iconEmoji{width:16px;height:16px;opacity:0}.hiddenEmoji{display:none}#animationContainer{z-index:5;width:20px;height:22px;margin-right:10px}#scoreInfoContainer{padding-top:2px}.widgetText{color:#6e7378;font-size:12px;line-height:16px;letter-spacing:.05em;width:100%}#feedbackText,#percentage{margin-right:4px}.widgetText a{color:#6e7378!important}.link{text-decoration:underline;cursor:pointer}.layerText{padding-right:10px;padding-top:2px}#detailedScoreInfo a{width:40%;color:#6e7378!important}.feedbackQuestion{margin-right:4px}.seemWrongButton{font-size:12px;font-family:Roboto,sans-serif;line-height:16px;letter-spacing:.05em;-ms-flex-item-align:start;align-self:flex-start}.detailsContainer{-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;width:100%;margin-top:1px}.layersContainer{width:100%;position:relative}.layer{position:absolute}.hiddenLayer{display:none!important}.interactiveElement{vertical-align:top;text-align:end;margin-left:auto;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-pack:end;-ms-flex-pack:end;justify-content:flex-end;min-width:-webkit-fit-content;min-width:-moz-fit-content;min-width:fit-content;padding-top:1px}.interactiveElement .feedbackContainer{padding-top:2px}#layer3 .interactiveElement{-webkit-box-flex:0;-ms-flex:0 1 auto;flex:0 1 auto;margin-left:0;padding-top:2px}.noBorderButton{background-color:#fff;border:0;cursor:pointer;padding-top:0;font-family:Roboto,sans-serif}.feedbackResponseButton{padding-left:0}.purpleButton{color:#6200ea;text-transform:uppercase}.greyButton{color:#6e7378}.underlineButton{text-decoration:underline}.yesNoButton{font-size:12px;font-family:Roboto,sans-serif;line-height:16px;letter-spacing:.05em}.yesNoButton.purpleButton{margin-left:8px;margin-right:8px}.yesNoButtonContainer{-webkit-box-pack:end;-ms-flex-pack:end;justify-content:flex-end}#widgetContainer{height:50px}.error{font-size:12px;letter-spacing:.05em;line-height:16px;color:#f44336}.infoButtonContainer{margin-left:10px;width:26px;height:26px}.infoButton{background-color:transparent;border:none;cursor:pointer}.material-icons.md-18{font-size:18px}.material-icons.md-dark{color:#78909c}.material-icons.md-dark.md-inactive{color:rgba(0,0,0,.26)}`],
            },] },
    { type: Injectable },
];
/** @nocollapse */
PerspectiveStatus.ctorParameters = () => [
    { type: NgZone, },
    { type: ElementRef, },
];
PerspectiveStatus.propDecorators = {
    "indicatorWidth": [{ type: Input },],
    "indicatorHeight": [{ type: Input },],
    "configurationInput": [{ type: Input },],
    "hasScore": [{ type: Input },],
    "fontSize": [{ type: Input },],
    "gradientColors": [{ type: Input },],
    "canAcceptFeedback": [{ type: Input },],
    "feedbackRequestInProgress": [{ type: Input },],
    "feedbackRequestSubmitted": [{ type: Input },],
    "feedbackRequestError": [{ type: Input },],
    "initializeErrorMessage": [{ type: Input },],
    "feedbackText": [{ type: Input },],
    "scoreThresholds": [{ type: Input },],
    "showPercentage": [{ type: Input },],
    "showMoreInfoLink": [{ type: Input },],
    "analyzeErrorMessage": [{ type: Input },],
    "userFeedbackPromptText": [{ type: Input },],
    "hideLoadingIconAfterLoad": [{ type: Input },],
    "hideLoadingIconForScoresBelowMinThreshold": [{ type: Input },],
    "alwaysHideLoadingIcon": [{ type: Input },],
    "loadingIconStyle": [{ type: Input },],
    "scoreChangeAnimationCompleted": [{ type: Output },],
    "modelInfoLinkClicked": [{ type: Output },],
    "commentFeedbackSubmitted": [{ type: Output },],
    "circleSquareDiamondWidget": [{ type: ViewChild, args: ['circleSquareDiamondWidget',] },],
    "emojiWidget": [{ type: ViewChild, args: ['emojiStatusWidget',] },],
    "container": [{ type: ViewChild, args: ['widgetContainer',] },],
    "smileEmoji": [{ type: ViewChild, args: ['smileEmoji',] },],
    "neutralEmoji": [{ type: ViewChild, args: ['neutralEmoji',] },],
    "sadEmoji": [{ type: ViewChild, args: ['sadEmoji',] },],
};
/**
 * @record
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
// TODO: Make this configurable for dev vs prod.
const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery'
    + '/rest?version=v1alpha1';
const TOXICITY_ATTRIBUTE = 'TOXICITY';
class PerspectiveApiService {
    /**
     * @param {?} http
     */
    constructor(http) {
        this.http = http;
        this.gapiClient = null;
    }
    /**
     * @param {?} apiKey
     * @return {?}
     */
    initGapiClient(apiKey) {
        if (!apiKey) {
            this.gapiClient = null;
        }
        gapi.load('client', () => {
            console.log('Starting to load gapi client');
            (/** @type {?} */ (gapi.client)).init({
                'apiKey': apiKey,
                'discoveryDocs': [DISCOVERY_URL],
            }).then(() => {
                console.log('Finished loading gapi client');
                console.log(gapi.client);
                this.gapiClient = /** @type {?} */ ((/** @type {?} */ (gapi.client)));
            }, (error) => {
                console.error('Error loading gapi client:', error);
            });
        });
    }
    /**
     * @param {?} text
     * @param {?} sessionId
     * @param {?} communityId
     * @param {?} makeDirectApiCall
     * @param {?=} serverUrl
     * @return {?}
     */
    checkText(text, sessionId, communityId, makeDirectApiCall, serverUrl) {
        if (makeDirectApiCall && this.gapiClient === null) {
            console.error('No gapi client found; call initGapiClient with your API'
                + 'key to make a direct API call. Using server instead');
            makeDirectApiCall = false;
        }
        if (makeDirectApiCall) {
            console.debug('Making a direct API call with gapi');
            let /** @type {?} */ requestedAttributes = {};
            requestedAttributes[TOXICITY_ATTRIBUTE] = {};
            let /** @type {?} */ request = {
                comment: { text: text },
                requested_attributes: requestedAttributes,
                session_id: sessionId,
                community_id: communityId
            };
            return from(this.gapiClient.commentanalyzer.comments.analyze(request))
                .pipe(map(response => response.result));
        }
        else {
            if (serverUrl === undefined) {
                serverUrl = '';
                console.error('No server url specified for a non-direct API call.'
                    + ' Defaulting to current hosted address');
            }
            let /** @type {?} */ headers = new Headers();
            headers.append('Content-Type', 'application/json');
            let /** @type {?} */ data = {
                comment: text,
                sessionId: sessionId,
                communityId: communityId,
            };
            return this.http.post(serverUrl + '/check', JSON.stringify(data), { headers })
                .pipe(map(response => response.json()));
        }
    }
    /**
     * @param {?} text
     * @param {?} sessionId
     * @param {?} commentMarkedAsToxic
     * @param {?} makeDirectApiCall
     * @param {?=} serverUrl
     * @return {?}
     */
    suggestScore(text, sessionId, commentMarkedAsToxic, makeDirectApiCall, serverUrl) {
        if (makeDirectApiCall && this.gapiClient === null) {
            console.error('No gapi client found; call initGapiClient with your API'
                + 'key to make a direct API call. Using server instead');
            makeDirectApiCall = false;
        }
        if (makeDirectApiCall) {
            let /** @type {?} */ attributeScores = {};
            attributeScores[TOXICITY_ATTRIBUTE] = {
                summaryScore: { value: commentMarkedAsToxic ? 1 : 0 }
            };
            let /** @type {?} */ request = {
                comment: { text: text },
                attribute_scores: attributeScores,
                client_token: sessionId,
            };
            console.debug('Making a direct API call with gapi');
            return from(this.gapiClient.commentanalyzer.comments.suggestscore(request))
                .pipe(map(response => response.result));
        }
        else {
            if (serverUrl === undefined) {
                serverUrl = '';
                console.error('No server url specified for a non-direct API call.'
                    + ' Defaulting to current hosted address');
            }
            let /** @type {?} */ headers = new Headers();
            headers.append('Content-Type', 'application/json');
            let /** @type {?} */ data = {
                comment: text,
                sessionId: sessionId,
                commentMarkedAsToxic: commentMarkedAsToxic
            };
            return this.http.post(serverUrl + '/suggest_score', JSON.stringify(data), { headers })
                .pipe(map(response => response.json()));
        }
    }
}
PerspectiveApiService.decorators = [
    { type: Injectable },
];
/** @nocollapse */
PerspectiveApiService.ctorParameters = () => [
    { type: Http, },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @record
 */

/**
 * @record
 */

const DEFAULT_DEMO_SETTINGS = {
    configuration: 'default',
    gradientColors: ["#25C1F9", "#7C4DFF", "#D400F9"],
    apiKey: '',
    useGapi: false,
    usePluginEndpoint: false,
    showPercentage: true,
    showMoreInfoLink: true,
    feedbackText: /** @type {?} */ ([
        'Unlikely to be perceived as toxic',
        'Unsure if this will be perceived as toxic',
        'Likely to be perceived as toxic'
    ]),
    scoreThresholds: /** @type {?} */ ([0, 0.4, 0.7]),
    hideLoadingIconAfterLoad: false,
    hideLoadingIconForScoresBelowMinThreshold: false,
    alwaysHideLoadingIcon: false,
    loadingIconStyle: LoadingIconStyle.CIRCLE_SQUARE_DIAMOND,
    userFeedbackPromptText: 'Seem wrong?'
};
class ConvaiChecker {
    /**
     * @param {?} elementRef
     * @param {?} analyzeApiService
     */
    constructor(elementRef, analyzeApiService) {
        this.elementRef = elementRef;
        this.analyzeApiService = analyzeApiService;
        this.fontSize = 12;
        this.demoSettings = DEFAULT_DEMO_SETTINGS;
        // A JSON string representation of the DemoSettings. Expected to be static
        // over the course of the component's lifecycle, and should only be used from
        // a non-Angular context (when convai-checker is being used as a
        // webcomponent). If working from an Angular context, use |demoSettings|.
        this.demoSettingsJson = null;
        this.pluginEndpointUrl = 'http://perspectiveapi.com';
        this.scoreChangeAnimationCompleted = new EventEmitter();
        this.scoreChanged = new EventEmitter();
        this.modelInfoLinkClicked = new EventEmitter();
        this.analyzeCommentResponseChanged = new EventEmitter();
        this.analyzeCommentResponse = null;
        this.analyzeErrorMessage = null;
        this.canAcceptFeedback = false;
        this.feedbackRequestInProgress = false;
        this.sessionId = null;
        this.gradientColors = ["#25C1F9", "#7C4DFF", "#D400F9"];
        // Extracts attribute fields from the element declaration. This
        // covers the case where this component is used as a root level
        // component outside an angular component tree and we cannot get
        // these values from data bindings.
        this.inputId = this.elementRef.nativeElement.getAttribute('inputId');
        // Default to '' to use same server as whatever's serving the webapp.
        this.serverUrl =
            this.elementRef.nativeElement.getAttribute('serverUrl') || '';
    }
    ;
    /**
     * @return {?}
     */
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
    /**
     * @param {?} changes
     * @return {?}
     */
    ngOnChanges(changes) {
        if (changes['demoSettings']) {
            if (this.demoSettings && this.demoSettings.apiKey &&
                this.apiKey !== this.demoSettings.apiKey) {
                console.debug('Api key changes detected in demoSettings');
                this.apiKey = this.demoSettings.apiKey;
                this.analyzeApiService.initGapiClient(this.apiKey);
            }
        }
    }
    /**
     * @param {?} text
     * @return {?}
     */
    checkText(text) {
        this._handlePendingCheckRequest(text);
    }
    /**
     * @param {?} event
     * @return {?}
     */
    _handleInputEvent(event) {
        if (event.target.id === this.inputId) {
            this._handlePendingCheckRequest(event.target.value);
        }
    }
    /**
     * @param {?} text
     * @return {?}
     */
    _handlePendingCheckRequest(text) {
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
    /**
     * @param {?} feedback
     * @return {?}
     */
    onCommentFeedbackReceived(feedback) {
        if (this.analyzeCommentResponse === null) {
            // Don't send feedback for an empty input box.
            return;
        }
        this.suggestCommentScore(this.lastRequestedText, feedback);
    }
    /**
     * @return {?}
     */
    handleScoreChangeAnimationCompleted() {
        // Allow the output event to bubble up from the child checker-status
        // component through this component.
        this.scoreChangeAnimationCompleted.emit();
        console.debug('Score animation completed! Emitting an event');
    }
    /**
     * @return {?}
     */
    handleModelInfoLinkClicked() {
        // Allow the output event to bubble up from the child checker-status
        // component through this component.
        this.modelInfoLinkClicked.emit();
    }
    /**
     * @param {?} text
     * @param {?} feedback
     * @return {?}
     */
    suggestCommentScore(text, feedback) {
        this.feedbackRequestInProgress = true;
        this.analyzeApiService.suggestScore(text, this.sessionId, feedback.commentMarkedAsToxic, this.demoSettings.useGapi /* makeDirectApiCall */, this.serverUrl).pipe(finalize(() => {
            console.debug('Feedback request done');
            this.statusWidget.hideFeedbackQuestion();
            this.feedbackRequestInProgress = false;
        }))
            .subscribe((response) => {
            this.statusWidget.feedbackCompleted(true);
            console.log(response);
        }, (error) => {
            console.error('Error', error);
            this.statusWidget.feedbackCompleted(false);
        });
    }
    /**
     * @param {?} error
     * @return {?}
     */
    _getErrorMessage(error) {
        let /** @type {?} */ msg = 'Error scoring text. Please try again.';
        // Look at detailed API error messages for more meaningful error to return.
        try {
            for (const /** @type {?} */ api_err of error.json().errors) {
                // TODO(jetpack): a small hack to handle the language detection failure
                // case. we should instead change the API to return documented, typeful
                // errors.
                if (api_err.message.includes('does not support request languages')) {
                    msg = 'Sorry! Perspective needs more training data to work in this '
                        + 'language.';
                    break;
                }
            }
        }
        catch (/** @type {?} */ e) {
            console.warn('Failed to parse error. ', e);
        }
        return msg;
    }
    /**
     * @param {?} text
     * @return {?}
     */
    _checkText(text) {
        // Cancel listening to callbacks of previous requests.
        if (this.mostRecentRequestSubscription) {
            this.mostRecentRequestSubscription.unsubscribe();
        }
        this.statusWidget.resetFeedback();
        console.log('Checking text ' + text);
        this.lastRequestedText = text;
        this.checkInProgress = true;
        this.mostRecentRequestSubscription =
            this.analyzeApiService.checkText(text, this.sessionId, this.demoSettings.communityId, this.demoSettings.useGapi /* makeDirectApiCall */, this.demoSettings.usePluginEndpoint ? this.pluginEndpointUrl : this.serverUrl)
                .pipe(finalize(() => {
                console.log('Request done');
                let /** @type {?} */ newScore = this.getMaxScore(this.analyzeCommentResponse);
                this.statusWidget.notifyScoreChange(newScore);
                this.scoreChanged.emit(newScore);
                this.mostRecentRequestSubscription = null;
            }))
                .subscribe((response) => {
                this.analyzeCommentResponse = response;
                this.analyzeCommentResponseChanged.emit(this.analyzeCommentResponse);
                console.log(this.analyzeCommentResponse);
                this.checkInProgress = false;
                this.canAcceptFeedback = true;
            }, (error) => {
                console.error('Error', error);
                this.checkInProgress = false;
                this.canAcceptFeedback = false;
                this.analyzeErrorMessage = this._getErrorMessage(error);
                this.analyzeCommentResponse = null;
            });
    }
    /**
     * @param {?} response
     * @return {?}
     */
    getMaxScore(response) {
        if (response === null || response.attributeScores == null) {
            return 0;
        }
        let /** @type {?} */ max = undefined;
        Object.keys(response.attributeScores).forEach((key) => {
            let /** @type {?} */ maxSpanScoreForAttribute = this.getMaxSpanScore(response.attributeScores[key]);
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
    /**
     * @param {?} spanScores
     * @return {?}
     */
    getMaxSpanScore(spanScores) {
        let /** @type {?} */ max = undefined;
        for (let /** @type {?} */ spanScore of spanScores.spanScores) {
            if (max === undefined || spanScore.score.value > max) {
                max = spanScore.score.value;
            }
        }
        return max;
    }
    ;
}
ConvaiChecker.decorators = [
    { type: Component, args: [{
                selector: 'convai-checker',
                template: `<div id="checkerContainer">
  <!-- TODO(rachelrosen): merge perspective-status and convai-checker
       and move a large portion of the convai-checker code to the perspective-api service. -->
  <perspective-status
    [fontSize]="fontSize"
    [indicatorWidth]="13"
    [indicatorHeight]="13"
    [gradientColors]="demoSettings.gradientColors"
    [scoreThresholds]="demoSettings.scoreThresholds"
    [feedbackText]="demoSettings.feedbackText"
    [configurationInput]="demoSettings.configuration"
    [showPercentage]="demoSettings.showPercentage"
    [showMoreInfoLink]="demoSettings.showMoreInfoLink"
    [hasScore]="analyzeCommentResponse !== null"
    [canAcceptFeedback]="canAcceptFeedback"
    [feedbackRequestInProgress]="feedbackRequestInProgress"
    [initializeErrorMessage]="initializeErrorMessage"
    [analyzeErrorMessage]="analyzeErrorMessage"
    [userFeedbackPromptText]="demoSettings.userFeedbackPromptText"
    [hideLoadingIconAfterLoad]="demoSettings.hideLoadingIconAfterLoad"
    [hideLoadingIconForScoresBelowMinThreshold]="demoSettings.hideLoadingIconForScoresBelowMinThreshold"
    [alwaysHideLoadingIcon]="demoSettings.alwaysHideLoadingIcon"
    [loadingIconStyle]="demoSettings.loadingIconStyle"
    (commentFeedbackSubmitted)="onCommentFeedbackReceived($event)"
    (scoreChangeAnimationCompleted)="handleScoreChangeAnimationCompleted()"
    (modelInfoLinkClicked)="handleModelInfoLinkClicked()">
  </perspective-status>
</div>
`,
                styles: [`#checkerContainer{font-family:Roboto,sans-serif;line-height:1}`],
                providers: [PerspectiveApiService],
                // Allows listening to input events outside of this component.
                host: {
                    '(document:input)': '_handleInputEvent($event)',
                },
            },] },
];
/** @nocollapse */
ConvaiChecker.ctorParameters = () => [
    { type: ElementRef, },
    { type: PerspectiveApiService, },
];
ConvaiChecker.propDecorators = {
    "statusWidget": [{ type: ViewChild, args: [PerspectiveStatus,] },],
    "inputId": [{ type: Input },],
    "serverUrl": [{ type: Input },],
    "fontSize": [{ type: Input },],
    "demoSettings": [{ type: Input },],
    "demoSettingsJson": [{ type: Input },],
    "pluginEndpointUrl": [{ type: Input },],
    "scoreChangeAnimationCompleted": [{ type: Output },],
    "scoreChanged": [{ type: Output },],
    "modelInfoLinkClicked": [{ type: Output },],
    "analyzeCommentResponseChanged": [{ type: Output },],
};
const REQUEST_LIMIT_MS = 500;
const LOCAL_STORAGE_SESSION_ID_KEY = 'sessionId';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
class ConvaiCheckerModule {
}
ConvaiCheckerModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    ConvaiChecker,
                    PerspectiveStatus,
                ],
                exports: [
                    ConvaiChecker,
                    PerspectiveStatus
                ],
                imports: [
                    BrowserAnimationsModule,
                    BrowserModule,
                    FormsModule,
                    HttpModule,
                    MatButtonModule,
                    MatFormFieldModule,
                    MatInputModule,
                    MatSelectModule,
                ],
                providers: [PerspectiveApiService, { provide: APP_BASE_HREF, useValue: '/' },],
                bootstrap: [ConvaiChecker]
            },] },
];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

// TODO(rachelrosen): Look into whether exporting from the angular elements
// module for convai-checker will produce packaged code that can be used with
// the angular elements webcomponent for convai-checker.

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * Generated bundle index. Do not edit.
 */

export { ConvaiCheckerModule, DEFAULT_DEMO_SETTINGS, ConvaiChecker, Shape, Emoji, Configuration, ConfigurationInput, ScoreThreshold, LoadingIconStyle, DEFAULT_FEEDBACK_TEXT, PerspectiveStatus, PerspectiveApiService as ɵa };
//# sourceMappingURL=conversationai-perspectiveapi-authorship-demo.js.map
