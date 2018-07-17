(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('d3-interpolate'), require('toxiclibsjs'), require('gsap'), require('twemoji'), require('@angular/http'), require('rxjs'), require('rxjs/operators'), require('@angular/platform-browser/animations'), require('@angular/platform-browser'), require('@angular/common'), require('@angular/forms'), require('@angular/material'), require('@angular/material/form-field'), require('@angular/material/select')) :
	typeof define === 'function' && define.amd ? define('@conversationai/perspectiveapi-authorship-demo', ['exports', '@angular/core', 'd3-interpolate', 'toxiclibsjs', 'gsap', 'twemoji', '@angular/http', 'rxjs', 'rxjs/operators', '@angular/platform-browser/animations', '@angular/platform-browser', '@angular/common', '@angular/forms', '@angular/material', '@angular/material/form-field', '@angular/material/select'], factory) :
	(factory((global.conversationai = global.conversationai || {}, global.conversationai['perspectiveapi-authorship-demo'] = {}),global.ng.core,global.d3,global.toxicLibsJS,global.gsap,global.twemoji,global.ng.http,global.rxjs,global.Rx.Observable.prototype,global.ng.platformBrowser.animations,global.ng.platformBrowser,global.ng.common,global.ng.forms,global.ng.material,global.ng.material['form-field'],global.ng.material.select));
}(this, (function (exports,core,d3Interpolate,toxiclibsjs,gsap,twemoji,http,rxjs,operators,animations,platformBrowser,common,forms,material,formField,select) { 'use strict';

twemoji = twemoji && twemoji.hasOwnProperty('default') ? twemoji['default'] : twemoji;

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */









function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

var Shape = {
    CIRCLE: 0,
    SQUARE: 1,
    DIAMOND: 2,
};
Shape[Shape.CIRCLE] = "CIRCLE";
Shape[Shape.SQUARE] = "SQUARE";
Shape[Shape.DIAMOND] = "DIAMOND";
var Emoji = {
    SMILE: 0,
    NEUTRAL: 1,
    SAD: 2,
};
Emoji[Emoji.SMILE] = "SMILE";
Emoji[Emoji.NEUTRAL] = "NEUTRAL";
Emoji[Emoji.SAD] = "SAD";
var Configuration = {
    DEMO_SITE: 0,
    EXTERNAL: 1,
};
Configuration[Configuration.DEMO_SITE] = "DEMO_SITE";
Configuration[Configuration.EXTERNAL] = "EXTERNAL";
var ConfigurationInput = {
    DEMO_SITE: 'default',
    EXTERNAL: 'external',
};
var ScoreThreshold = {
    OKAY: 0,
    BORDERLINE: 0.20,
    UNCIVIL: 0.76,
    MAX: 1,
};
var LoadingIconStyle = {
    CIRCLE_SQUARE_DIAMOND: 'circle_square_diamond',
    EMOJI: 'emoji',
};
var DEFAULT_FEEDBACK_TEXT = 'likely to be perceived as "toxic."';
var FADE_START_LABEL = "fadeStart";
var LOADING_START_ANIMATIONS_LABEL = "loadingAnimationStart";
var SHAPE_MORPH_TIME_SECONDS = 1;
var FADE_DETAILS_TIME_SECONDS = 0.4;
var FADE_ANIMATION_TIME_SECONDS = 0.3;
var GRAYSCALE_ANIMATION_TIME_SECONDS = 0.2;
var LAYER_TRANSITION_TIME_SECONDS = 0.5;
var FADE_WIDGET_TIME_SECONDS = 0.4;
var WIDGET_PADDING_PX = 4;
var WIDGET_RIGHT_MARGIN_PX = 10;
var EMOJI_MAIN_LOADING_ANIMATION_LABEL = "emojiMainLoadingAnimation";
var FADE_EMOJI_TIME_SECONDS = 0.5;
var EMOJI_BOUNCE_IN_TIME_SECONDS = 1;
var COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS = 0.5;
var FIRST_GRADIENT_RATIO = 0.9;
var QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS = 0.2;
var NEUTRAL_GRAY_COLOR = '#cccccc';
var GRAY_COLOR_CIRCLE_LOADING = "rgba(227,229,230,1)";
var EMOJI_COLOR = "#ffcc4d";
var PerspectiveStatus = /** @class */ (function () {
    function PerspectiveStatus(ngZone, elementRef) {
        this.ngZone = ngZone;
        this.elementRef = elementRef;
        this.indicatorWidth = 13;
        this.indicatorHeight = 13;
        this.configurationInput = ConfigurationInput.DEMO_SITE;
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
        this.scoreChangeAnimationCompleted = new core.EventEmitter();
        this.modelInfoLinkClicked = new core.EventEmitter();
        this.commentFeedbackSubmitted = new core.EventEmitter();
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
    PerspectiveStatus.prototype.ngOnInit = function () {
        this.configuration = this.getConfigurationFromInputString(this.configurationInput);
        try {
            for (var _a = __values(this.layerAnimationSelectors), _b = _a.next(); !_b.done; _b = _a.next()) {
                var layerAnimationSelector = _b.value;
                this.layerAnimationHandles.push(this.elementRef.nativeElement.querySelector(layerAnimationSelector));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.updateLayerElementContainers();
        this.updateGradient();
        var e_1, _c;
    };
    PerspectiveStatus.prototype.ngAfterViewInit = function () {
        var _this = this;
        this.widgetReady = Promise.resolve().then(function () {
            _this.updateWidgetElement();
            _this.getUpdateWidgetStateAnimation().play();
        });
    };
    PerspectiveStatus.prototype.ngOnChanges = function (changes) {
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
            var valuesChanged = false;
            var scoreThresholdChanges = changes['scoreThresholds'];
            for (var i = 0; i < scoreThresholdChanges.previousValue.length; i++) {
                if (scoreThresholdChanges.currentValue[i]
                    !== scoreThresholdChanges.previousValue[i]) {
                    valuesChanged = true;
                    break;
                }
            }
            if (valuesChanged) {
                this.updateGradient();
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
    };
    PerspectiveStatus.prototype.ngAfterViewChecked = function () {
        var _this = this;
        if (this.scoreThresholdsChanged
            || this.loadingIconStyleChanged
            || this.hideLoadingIconAfterLoadChanged
            || this.alwaysHideLoadingIconChanged) {
            if (this.isPlayingStateChangeAnimations) {
                this.stateChangeAnimations.kill();
                console.debug('Killing pending state change animation.');
            }
            else if (this.isPlayingPostLoadingStateChangeAnimations) {
                this.pendingPostLoadingStateChangeAnimations.kill();
                this.isPlayingPostLoadingStateChangeAnimations = false;
                console.debug('Killing pending post-loading state change animation');
            }
            var afterChangesTimeline_1 = new gsap.TimelineMax({
                onStart: function () {
                    _this.ngZone.run(function () {
                        _this.isPlayingStateChangeAnimations = true;
                        console.debug('Starting state change animation');
                    });
                },
                onComplete: function () {
                    _this.ngZone.run(function () {
                        _this.isPlayingStateChangeAnimations = false;
                        console.debug('Completing state change animation');
                    });
                }
            });
            if (this.isLoading) {
                this.pendingPostLoadingStateChangeAnimations = new gsap.TimelineMax({
                    onStart: function () {
                        _this.ngZone.run(function () {
                            _this.isPlayingPostLoadingStateChangeAnimations = true;
                            console.debug('Started postLoadingStateChangeAnimations');
                        });
                    },
                    onComplete: function () {
                        _this.ngZone.run(function () {
                            _this.isPlayingPostLoadingStateChangeAnimations = false;
                            console.debug('Completing postLoadingStateChangeAnimations');
                        });
                    }
                });
            }
            else {
                this.pendingPostLoadingStateChangeAnimations = null;
            }
            Promise.resolve().then(function () {
                if (_this.hideLoadingIconAfterLoadChanged
                    || _this.alwaysHideLoadingIconChanged) {
                    if (_this.hideLoadingIconAfterLoadChanged) {
                        console.debug('Setting hideLoadingIconAfterLoadChanged to false');
                        _this.hideLoadingIconAfterLoadChanged = false;
                    }
                    if (_this.alwaysHideLoadingIconChanged) {
                        console.debug('Setting alwaysHideLoadingIconChanged to false');
                        _this.alwaysHideLoadingIconChanged = false;
                    }
                    if (!_this.loadingIconStyleChanged) {
                        if (_this.isLoading) {
                            _this.pendingPostLoadingStateChangeAnimations.add(_this.getUpdateWidgetStateAnimation());
                        }
                        else {
                            afterChangesTimeline_1.add(_this.getUpdateWidgetStateAnimation());
                        }
                    }
                }
                if (_this.loadingIconStyleChanged) {
                    _this.updateWidgetElement();
                    if (_this.shouldHideStatusWidget) {
                        _this.widgetElement.style.transform =
                            'matrix(1,0,0,1,' + (-1 * (_this.indicatorWidth + WIDGET_PADDING_PX + WIDGET_RIGHT_MARGIN_PX)) + ',0)';
                    }
                    console.debug('Setting loadingIconStyleChanged to false');
                    _this.loadingIconStyleChanged = false;
                    var loadingIconStyleChangedTimeline = new gsap.TimelineMax({});
                    loadingIconStyleChangedTimeline.add(_this.getUpdateWidgetStateAnimation());
                    if (_this.isLoading) {
                        _this.pendingPostLoadingStateChangeAnimations.add(loadingIconStyleChangedTimeline);
                    }
                    else {
                        afterChangesTimeline_1.add(loadingIconStyleChangedTimeline);
                    }
                }
                else if (_this.scoreThresholdsChanged) {
                    console.debug('Setting scoreThresholdsChanged to false');
                    _this.scoreThresholdsChanged = false;
                    _this.updateDemoSettingsAnimation = _this.getUpdateWidgetStateAnimation();
                    if (_this.isLoading) {
                        _this.pendingPostLoadingStateChangeAnimations.add(_this.updateDemoSettingsAnimation);
                    }
                    else {
                        afterChangesTimeline_1.add(_this.updateDemoSettingsAnimation);
                    }
                }
                _this.stateChangeAnimations = afterChangesTimeline_1;
                _this.stateChangeAnimations.play();
            });
        }
    };
    PerspectiveStatus.prototype.getFirstGradientRatio = function () {
        return FIRST_GRADIENT_RATIO;
    };
    PerspectiveStatus.prototype.getAdjustedGradientControlPoints = function (gradientPointCount) {
        var gradientPoints = [
            Math.floor(gradientPointCount * (this.scoreThresholds[0] + FIRST_GRADIENT_RATIO * (this.scoreThresholds[1] - this.scoreThresholds[0]))),
            Math.floor(gradientPointCount * this.scoreThresholds[1]),
            Math.floor(gradientPointCount * this.scoreThresholds[2])
        ];
        for (var i = gradientPoints.length - 1; i >= 0; i--) {
            if (gradientPoints[i] >= gradientPoints[i + 1]) {
                gradientPoints[i] -= (gradientPoints[i] - gradientPoints[i + 1] + 1);
            }
        }
        return gradientPoints;
    };
    PerspectiveStatus.prototype.updateGradient = function () {
        var gradientPointCount = 100;
        var gradientPoints = this.getAdjustedGradientControlPoints(gradientPointCount);
        var sliderGradient = new toxiclibsjs.color.ColorGradient();
        for (var i = 0; i < gradientPoints.length; i++) {
            if (gradientPoints[i] >= 0) {
                sliderGradient.addColorAt(gradientPoints[i], toxiclibsjs.color.TColor.newHex(this.gradientColors[i]));
            }
        }
        this.gradientColorScale =
            sliderGradient.calcGradient(0, gradientPointCount).colors
                .map(function (tColor) { return tColor.toRGBCSS(); });
    };
    PerspectiveStatus.prototype.interpolateColors = function (score) {
        var scoreLowerIndex = Math.min(Math.floor(score * 100), this.gradientColorScale.length - 1);
        var scoreUpperIndex = Math.min(Math.ceil(score * 100), this.gradientColorScale.length - 1);
        var interpolatorFn = d3Interpolate.interpolateRgb(this.gradientColorScale[scoreLowerIndex], this.gradientColorScale[scoreUpperIndex]);
        return interpolatorFn((score * 100) - scoreLowerIndex);
    };
    PerspectiveStatus.prototype.updateWidgetElement = function () {
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
    };
    PerspectiveStatus.prototype.getShouldHideStatusWidget = function (loadStart) {
        var shouldHide = false;
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
    };
    PerspectiveStatus.prototype.getUpdateStatusWidgetVisibilityAnimation = function (loadStart) {
        var _this = this;
        var hide = this.getShouldHideStatusWidget(loadStart);
        var forceAnimation = false;
        if (this.isPlayingShowOrHideLoadingWidgetAnimation) {
            console.debug('Calling getUpdateStatusWidgetVisibility while '
                + 'isPlayingShowOrHideLoadingWidgetAnimation = true. ');
            forceAnimation = true;
        }
        if (hide === this.shouldHideStatusWidget && !forceAnimation) {
            console.debug('Returning without update status widget visibility animation.');
            return new gsap.TimelineMax({});
        }
        else {
            console.debug('Getting update status widget visibility animation.');
        }
        this.isPlayingShowOrHideLoadingWidgetAnimation = true;
        var updateStatusWidgetVisibilityAnimation = new gsap.TimelineMax({
            onStart: function () {
                _this.ngZone.run(function () {
                    console.debug('Updating status widget visibility to '
                        + (hide ? 'hidden' : 'visible') + ' from '
                        + (_this.shouldHideStatusWidget ? 'hidden' : 'visible'));
                    _this.shouldHideStatusWidget = false;
                });
            },
            onComplete: function () {
                _this.ngZone.run(function () {
                    console.debug('Changing status widget visibility complete, hide=', hide);
                    _this.isPlayingShowOrHideLoadingWidgetAnimation = false;
                    _this.shouldHideStatusWidget = hide;
                });
            },
        });
        updateStatusWidgetVisibilityAnimation.add([
            this.getChangeLoadingIconVisibilityAnimation(hide),
            this.getChangeLoadingIconXValueAnimation(hide)
        ]);
        return updateStatusWidgetVisibilityAnimation;
    };
    PerspectiveStatus.prototype.getChangeLoadingIconVisibilityAnimation = function (hide) {
        return gsap.TweenMax.to(this.widgetElement, FADE_WIDGET_TIME_SECONDS, { opacity: hide ? 0 : 1 });
    };
    PerspectiveStatus.prototype.getSetIconToNeutralStateAnimation = function () {
        var timeline = new gsap.TimelineMax({});
        if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
            timeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
            timeline.add(this.getTransitionToCircleAnimation(SHAPE_MORPH_TIME_SECONDS, NEUTRAL_GRAY_COLOR));
        }
        else if (this.loadingIconStyle === LoadingIconStyle.EMOJI) {
            timeline.add(this.getHideEmojisAnimation());
            timeline.add(this.getChangeColorAnimation(QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, NEUTRAL_GRAY_COLOR));
        }
        return timeline;
    };
    PerspectiveStatus.prototype.getChangeLoadingIconXValueAnimation = function (hide) {
        var timeline = new gsap.TimelineMax({});
        var translateXAnimations = [];
        translateXAnimations.push(gsap.TweenMax.to(this.widgetElement, FADE_WIDGET_TIME_SECONDS, { x: hide ? -1 * (this.indicatorWidth
                + WIDGET_PADDING_PX
                + WIDGET_RIGHT_MARGIN_PX)
                : 0 }));
        if (this.configuration === Configuration.DEMO_SITE) {
            var layer0TextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[0] + ' .layerText');
            var layer1TextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[1] + ' .layerText');
            var layer2InteractiveContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[2] + ' .interactiveElement');
            var translateXSettings = {
                x: hide ? -1 * (this.indicatorWidth
                    + WIDGET_PADDING_PX
                    + WIDGET_RIGHT_MARGIN_PX)
                    : 0
            };
            translateXAnimations.push(gsap.TweenMax.to(layer0TextContainer, FADE_WIDGET_TIME_SECONDS, translateXSettings));
            translateXAnimations.push(gsap.TweenMax.to(layer1TextContainer, FADE_WIDGET_TIME_SECONDS, translateXSettings));
            translateXAnimations.push(gsap.TweenMax.to(layer2InteractiveContainer, FADE_WIDGET_TIME_SECONDS, translateXSettings));
        }
        timeline.add(translateXAnimations);
        return timeline;
    };
    PerspectiveStatus.prototype.getConfigurationFromInputString = function (inputString) {
        if (inputString === ConfigurationInput.EXTERNAL) {
            return Configuration.EXTERNAL;
        }
        else {
            return Configuration.DEMO_SITE;
        }
    };
    PerspectiveStatus.prototype.updateLayerElementContainers = function () {
        this.layerTextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[this.currentLayerIndex] + ' .layerText');
        this.interactiveLayerControlsContainer =
            this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[this.currentLayerIndex]
                + ' .interactiveElement');
    };
    PerspectiveStatus.prototype.shouldShowFeedback = function (score) {
        return score >= this.scoreThresholds[0];
    };
    PerspectiveStatus.prototype.parseEmojis = function (text) {
        return twemoji.parse(text);
    };
    PerspectiveStatus.prototype.getFeedbackTextForScore = function (score) {
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
    };
    PerspectiveStatus.prototype.feedbackContainerClicked = function () {
        if (this.configuration === Configuration.DEMO_SITE) {
            this.getTransitionToLayerAnimation(1, LAYER_TRANSITION_TIME_SECONDS).play();
        }
        else if (this.configuration === Configuration.EXTERNAL) {
            this.showFeedbackQuestion = true;
        }
    };
    PerspectiveStatus.prototype.feedbackCompleted = function (success) {
        if (success) {
            this.feedbackRequestSubmitted = true;
        }
        else {
            this.feedbackRequestError = true;
        }
        if (this.configuration === Configuration.DEMO_SITE) {
            var feedbackCompletedTimeline = new gsap.TimelineMax({});
            feedbackCompletedTimeline.add([
                this.getTransitionToLayerAnimation(2, LAYER_TRANSITION_TIME_SECONDS),
                this.getSetIconToNeutralStateAnimation()
            ]);
            feedbackCompletedTimeline.play();
        }
    };
    PerspectiveStatus.prototype.hideFeedbackQuestion = function () {
        this.showFeedbackQuestion = false;
    };
    PerspectiveStatus.prototype.resetFeedback = function () {
        this.showFeedbackQuestion = false;
        this.feedbackRequestInProgress = false;
        this.feedbackRequestSubmitted = false;
        this.feedbackRequestError = false;
    };
    PerspectiveStatus.prototype.resetLayers = function () {
        this.resetFeedback();
        var resetAnimationTimeline = new gsap.TimelineMax({});
        resetAnimationTimeline.add(this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
        resetAnimationTimeline.add(this.getUpdateWidgetStateAnimation());
        resetAnimationTimeline.play();
    };
    PerspectiveStatus.prototype.submitFeedback = function (commentIsToxic) {
        this.feedbackRequestError = false;
        this.commentFeedbackSubmitted.emit({ commentMarkedAsToxic: commentIsToxic });
    };
    PerspectiveStatus.prototype.getResetRotationAnimation = function () {
        return gsap.TweenMax.to(this.widgetElement, 0.1, {
            rotation: this.currentShape === Shape.DIAMOND ? 45 : 0,
        });
    };
    PerspectiveStatus.prototype.getShapeForScore = function (score) {
        if (score > this.scoreThresholds[2]) {
            return Shape.DIAMOND;
        }
        else if (score > this.scoreThresholds[1]) {
            return Shape.SQUARE;
        }
        else {
            return Shape.CIRCLE;
        }
    };
    PerspectiveStatus.prototype.getEmojiForScore = function (score) {
        if (score > this.scoreThresholds[2]) {
            return Emoji.SAD;
        }
        else if (score > this.scoreThresholds[1]) {
            return Emoji.NEUTRAL;
        }
        else {
            return Emoji.SMILE;
        }
    };
    PerspectiveStatus.prototype.getUpdateShapeAnimation = function (score) {
        var _this = this;
        if (this.loadingIconStyle !== LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
            console.debug('Calling getUpdateShapeAnimation(), but the loading icon'
                + 'style is not set to circle/square/diamond. Returning an'
                + 'empty timeline.');
            return new gsap.TimelineMax({});
        }
        var updateShapeAnimationTimeline = new gsap.TimelineMax({
            onStart: function () {
                _this.isPlayingUpdateShapeAnimation = true;
            },
            onComplete: function () {
                _this.isPlayingUpdateShapeAnimation = false;
            },
        });
        updateShapeAnimationTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
        if (score > this.scoreThresholds[2]) {
            updateShapeAnimationTimeline.add(this.getTransitionToDiamondAnimation(.8 * SHAPE_MORPH_TIME_SECONDS));
        }
        else if (score > this.scoreThresholds[1]) {
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
    };
    PerspectiveStatus.prototype.setShowMoreInfo = function (showMoreInfo) {
        this.getTransitionToLayerAnimation(showMoreInfo ? 1 : 0, LAYER_TRANSITION_TIME_SECONDS).play();
    };
    PerspectiveStatus.prototype.getAccessibilityDescriptionForEmoji = function (emoji) {
        if (emoji === Emoji.SMILE) {
            return "Smile emoji";
        }
        else if (emoji === Emoji.NEUTRAL) {
            return "Neutral emoji";
        }
        else {
            return "Sad emoji";
        }
    };
    PerspectiveStatus.prototype.getEmojiElementFromEmojiType = function (emojiType) {
        if (emojiType === Emoji.SMILE) {
            return this.smileEmoji.nativeElement;
        }
        else if (emojiType === Emoji.NEUTRAL) {
            return this.neutralEmoji.nativeElement;
        }
        else {
            return this.sadEmoji.nativeElement;
        }
    };
    PerspectiveStatus.prototype.getAnimationA11yLabel = function (loadingIconStyle, isPlayingLoadingAnimation) {
        if (isPlayingLoadingAnimation) {
            return "Computing score animation";
        }
        else if (loadingIconStyle === LoadingIconStyle.EMOJI) {
            return this.getAccessibilityDescriptionForEmoji(this.currentEmoji);
        }
        else {
            return this.getAccessibilityDescriptionForShape(this.currentShape);
        }
    };
    PerspectiveStatus.prototype.notifyModelInfoLinkClicked = function () {
        this.modelInfoLinkClicked.emit();
    };
    PerspectiveStatus.prototype.getUpdateWidgetStateAnimation = function () {
        var _this = this;
        var updateScoreCompletedTimeline = new gsap.TimelineMax({
            onStart: function () {
                _this.ngZone.run(function () {
                    console.debug('Starting animation for getUpdateWidgetStateAnimation');
                });
            },
            onComplete: function () {
                _this.ngZone.run(function () {
                    console.debug('Completing animation for getUpdateWidgetStateAnimation');
                    _this.scoreChangeAnimationCompleted.emit();
                });
            }
        });
        if (this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
            console.debug('Update widget state for default style');
            var updateScoreCompletedTimeline_1 = new gsap.TimelineMax({
                onComplete: function () {
                    _this.ngZone.run(function () {
                        console.debug(_this.scoreChangeAnimationCompleted);
                        _this.scoreChangeAnimationCompleted.emit();
                    });
                }
            });
            updateScoreCompletedTimeline_1.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
            updateScoreCompletedTimeline_1.add(this.getUpdateShapeAnimation(this.score));
            return updateScoreCompletedTimeline_1;
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
            return new gsap.TimelineMax({});
        }
    };
    PerspectiveStatus.prototype.notifyScoreChange = function (score) {
        console.debug('Setting this.score =', score);
        this.score = score;
        if (this.isPlayingLoadingAnimation) {
            this.setLoading(false);
        }
        else {
            console.debug('Updating shape from notifyScoreChange');
            this.getUpdateWidgetStateAnimation().play();
        }
    };
    PerspectiveStatus.prototype.setLoading = function (loading) {
        var _this = this;
        this.widgetReady.then(function () {
            console.debug('Calling setLoading(' + loading + ')');
            if (_this.widgetElement === null) {
                console.error('this.widgetElement = null in call to setLoading');
                return;
            }
            _this.isLoading = loading;
            if (_this.loadingIconStyle === LoadingIconStyle.CIRCLE_SQUARE_DIAMOND) {
                _this.setLoadingForDefaultWidget(loading);
            }
            else if (_this.loadingIconStyle === LoadingIconStyle.EMOJI) {
                _this.setLoadingForEmojiWidget(loading);
            }
            else {
                console.error('Calling setLoading for unknown loadingIconStyle: ' + _this.loadingIconStyle);
            }
        });
    };
    PerspectiveStatus.prototype.getChangeOpacityAnimation = function (element, timeSeconds, opacity) {
        return gsap.TweenMax.to(element, timeSeconds, { opacity: opacity });
    };
    PerspectiveStatus.prototype.getShowEmojiAnimation = function () {
        var _this = this;
        if (this.loadingIconStyle !== LoadingIconStyle.EMOJI) {
            console.debug('Calling getShowEmojiAnimation() but loading icon style is'
                + 'not emoji style, returning an empty timeline');
            return new gsap.TimelineMax({});
        }
        var emojiType = null;
        if (this.score > this.scoreThresholds[2]) {
            emojiType = Emoji.SAD;
        }
        else if (this.score > this.scoreThresholds[1]) {
            emojiType = Emoji.NEUTRAL;
        }
        else {
            emojiType = Emoji.SMILE;
        }
        var emojiElementToShow = this.getEmojiElementFromEmojiType(emojiType);
        var showEmojiTimeline = new gsap.TimelineMax({
            onStart: function () {
                _this.ngZone.run(function () {
                    _this.hideEmojiIconsForLoadingAnimation = false;
                });
            },
            onComplete: function () {
                _this.ngZone.run(function () {
                    _this.currentEmoji = emojiType;
                });
            }
        });
        var resetBackgroundColorAnimation = this.getChangeColorAnimation(QUICK_COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, EMOJI_COLOR);
        showEmojiTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, false));
        showEmojiTimeline.add([
            resetBackgroundColorAnimation,
            this.getToFullScaleBounceAnimation(EMOJI_BOUNCE_IN_TIME_SECONDS),
            this.getChangeOpacityAnimation(emojiElementToShow, FADE_EMOJI_TIME_SECONDS, 1)
        ]);
        return showEmojiTimeline;
    };
    PerspectiveStatus.prototype.getHideEmojisAnimation = function () {
        var _this = this;
        var hideEmojiTimeline = new gsap.TimelineMax({
            onComplete: function () {
                _this.ngZone.run(function () {
                    _this.hideEmojiIconsForLoadingAnimation = true;
                });
            }
        });
        hideEmojiTimeline.add([
            this.getChangeOpacityAnimation(this.smileEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0),
            this.getChangeOpacityAnimation(this.neutralEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0),
            this.getChangeOpacityAnimation(this.sadEmoji.nativeElement, FADE_EMOJI_TIME_SECONDS, 0)
        ]);
        return hideEmojiTimeline;
    };
    PerspectiveStatus.prototype.getStartAnimationsForEmojiWidgetLoading = function () {
        var loadingStartTimeline = new gsap.TimelineMax({});
        if (this.currentLayerIndex !== 0) {
            loadingStartTimeline.add(this.getTransitionToLayerAnimation(0, LAYER_TRANSITION_TIME_SECONDS));
        }
        loadingStartTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(true));
        loadingStartTimeline.add(this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, true, 0));
        loadingStartTimeline.add([
            this.getHideEmojisAnimation(),
            this.getChangeColorAnimation(COLOR_CHANGE_LOADING_ANIMATION_TIME_SECONDS, EMOJI_COLOR)
        ]);
        return loadingStartTimeline;
    };
    PerspectiveStatus.prototype.getLoopAnimationForEmojiWidgetLoading = function () {
        var shrinkAndFadeTimeline = new gsap.TimelineMax({
            ease: gsap.Power3.easeInOut
        });
        shrinkAndFadeTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
        return shrinkAndFadeTimeline;
    };
    PerspectiveStatus.prototype.getEndAnimationsForEmojiWidgetLoading = function (loadingTimeline) {
        var _this = this;
        var loadingEndTimeline = new gsap.TimelineMax({
            onComplete: function () {
                _this.ngZone.run(function () {
                    console.debug('Setting this.isPlayingLoadingAnimation = false (emoji)');
                    _this.isPlayingLoadingAnimation = false;
                    loadingTimeline.clear();
                    _this.scoreChangeAnimationCompleted.emit();
                    if (_this.isLoading) {
                        console.debug('Restarting loading from ending animation completion');
                        _this.setLoading(true);
                    }
                    else if (_this.currentEmoji !== _this.getEmojiForScore(_this.score)) {
                        console.debug('Load ending animation completed, found an out of date shape');
                        _this.notifyScoreChange(_this.score);
                    }
                });
            }
        });
        var scoreCompletedAnimations = [];
        scoreCompletedAnimations.push(this.getShowEmojiAnimation());
        scoreCompletedAnimations.push(this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));
        if (!this.getShouldHideStatusWidget(false)) {
            loadingEndTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        loadingEndTimeline.add(scoreCompletedAnimations);
        if (this.getShouldHideStatusWidget(false)) {
            loadingEndTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        if (this.pendingPostLoadingStateChangeAnimations) {
            loadingEndTimeline.add(this.pendingPostLoadingStateChangeAnimations);
        }
        return loadingEndTimeline;
    };
    PerspectiveStatus.prototype.getStartAnimationsForCircleSquareDiamondWidgetLoading = function () {
        var startAnimationsTimeline = new gsap.TimelineMax({
            align: 'sequence',
        });
        var startAnimationsGroup0 = [];
        var startAnimationsGroup1 = [];
        var startAnimationsGroup2 = [];
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
    };
    PerspectiveStatus.prototype.getLoopAnimationsForCircleSquareDiamondWidgetLoading = function () {
        var shrinkAndFadeTimeline = new gsap.TimelineMax({
            ease: gsap.Power3.easeInOut
        });
        shrinkAndFadeTimeline.add(this.getFadeAndShrinkAnimation(FADE_ANIMATION_TIME_SECONDS, true));
        return shrinkAndFadeTimeline;
    };
    PerspectiveStatus.prototype.getEndAnimationsForCircleSquareDiamondWidgetLoading = function (loadingTimeline) {
        var _this = this;
        var updateScoreCompletedTimeline = new gsap.TimelineMax({
            onStart: function () {
                console.debug('Score change animation start');
            },
            onComplete: function () {
                _this.ngZone.run(function () {
                    console.debug('Score change animation end');
                    console.debug('Clearing loadingTimeline');
                    _this.isPlayingLoadingAnimation = false;
                    loadingTimeline.clear();
                    _this.scoreChangeAnimationCompleted.emit();
                    if (_this.isLoading) {
                        console.debug('Restarting loading from ending animation completion');
                        _this.setLoading(true);
                    }
                    else if (_this.currentShape !== _this.getShapeForScore(_this.score)) {
                        console.debug('Load ending animation completed, found an out of date shape');
                        _this.notifyScoreChange(_this.score);
                    }
                });
            }
        });
        var scoreCompletedAnimations = [];
        scoreCompletedAnimations.push(this.getUpdateShapeAnimation(this.score));
        if (this.showScore) {
            scoreCompletedAnimations.push(this.getFadeDetailsAnimation(FADE_DETAILS_TIME_SECONDS, false, 0));
        }
        if (!this.getShouldHideStatusWidget(false)) {
            updateScoreCompletedTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        updateScoreCompletedTimeline.add(scoreCompletedAnimations);
        if (this.getShouldHideStatusWidget(false)) {
            updateScoreCompletedTimeline.add(this.getUpdateStatusWidgetVisibilityAnimation(false));
        }
        if (this.pendingPostLoadingStateChangeAnimations) {
            updateScoreCompletedTimeline.add(this.pendingPostLoadingStateChangeAnimations);
        }
        return updateScoreCompletedTimeline;
    };
    PerspectiveStatus.prototype.setLoadingForEmojiWidget = function (loading) {
        var _this = this;
        if (loading && !this.isPlayingLoadingAnimation) {
            this.isPlayingLoadingAnimation = true;
            var loadingTimeline_1 = new gsap.TimelineMax({
                paused: true,
                ease: gsap.Power3.easeInOut,
                onStart: function () {
                    _this.ngZone.run(function () {
                        console.debug('Starting timeline (emoji)');
                    });
                },
                onComplete: function () {
                    _this.ngZone.run(function () {
                        console.debug('Completing timeline (emoji)');
                        if (_this.isLoading) {
                            console.debug('Restarting main emoji loading animation');
                            loadingTimeline_1.seek(EMOJI_MAIN_LOADING_ANIMATION_LABEL, true);
                        }
                        else {
                            _this.getEndAnimationsForEmojiWidgetLoading(loadingTimeline_1).play();
                        }
                    });
                }
            });
            loadingTimeline_1.add(this.getStartAnimationsForEmojiWidgetLoading());
            loadingTimeline_1.add(this.getLoopAnimationForEmojiWidgetLoading(), EMOJI_MAIN_LOADING_ANIMATION_LABEL);
            loadingTimeline_1.play();
        }
    };
    PerspectiveStatus.prototype.setLoadingForDefaultWidget = function (loading) {
        var _this = this;
        if (loading && !this.isPlayingLoadingAnimation) {
            console.debug('About to create loadingTimeline');
            this.isPlayingLoadingAnimation = true;
            var loadingTimeline_2 = new gsap.TimelineMax({
                paused: true,
                ease: gsap.Power3.easeInOut,
                onStart: function () {
                    _this.ngZone.run(function () {
                        console.debug('Starting timeline');
                    });
                },
                onComplete: function () {
                    _this.ngZone.run(function () {
                        console.debug('Completing timeline');
                        console.debug('Updating shape from animation complete');
                        if (_this.isLoading) {
                            console.debug('Restarting loading to fade animation.');
                            loadingTimeline_2.seek(FADE_START_LABEL, true);
                        }
                        else {
                            console.debug('Loading complete');
                            console.debug('hasScore:', _this.hasScore);
                            var updateScoreCompletedTimeline = _this.getEndAnimationsForCircleSquareDiamondWidgetLoading(loadingTimeline_2);
                            updateScoreCompletedTimeline.play();
                        }
                    });
                },
            });
            var startAnimationsTimeline = this.getStartAnimationsForCircleSquareDiamondWidgetLoading();
            loadingTimeline_2.add(startAnimationsTimeline, LOADING_START_ANIMATIONS_LABEL);
            loadingTimeline_2.add(this.getLoopAnimationsForCircleSquareDiamondWidgetLoading(), FADE_START_LABEL);
            loadingTimeline_2.play();
        }
    };
    PerspectiveStatus.prototype.getNameFromShape = function (shape) {
        if (shape == Shape.CIRCLE) {
            return 'circle';
        }
        else if (shape == Shape.SQUARE) {
            return 'square';
        }
        else {
            return 'diamond';
        }
    };
    PerspectiveStatus.prototype.getAccessibilityDescriptionForShape = function (shape) {
        if (shape == Shape.CIRCLE) {
            return 'Low toxicity icon.';
        }
        else if (shape == Shape.SQUARE) {
            return 'Medium toxicity icon.';
        }
        else {
            return 'High toxicity icon.';
        }
    };
    PerspectiveStatus.prototype.getUpdateGradientColorAnimation = function (timeSeconds) {
        return this.getChangeColorAnimation(timeSeconds, this.interpolateColors(this.score));
    };
    PerspectiveStatus.prototype.getChangeColorAnimation = function (timeSeconds, color$$1) {
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            backgroundColor: color$$1,
        });
    };
    PerspectiveStatus.prototype.getTransitionToCircleAnimation = function (timeSeconds, endColor) {
        var circleAnimationTimeline = new gsap.TimelineMax({
            align: 'start',
            onStart: function () {
            },
            onComplete: function () {
            },
        });
        circleAnimationTimeline.add([
            this.getCircleAnimation(timeSeconds / 6, endColor),
            this.getToFullScaleBounceAnimation(timeSeconds)
        ]);
        return circleAnimationTimeline;
    };
    PerspectiveStatus.prototype.getTransitionToSquareAnimation = function (timeSeconds) {
        var _this = this;
        var squareAnimationTimeline = new gsap.TimelineMax({
            onStart: function () {
                var currentRotation = 0;
                var currentWidgetTransform = ((_this.widgetElement))._gsTransform;
                if (currentWidgetTransform !== undefined) {
                    currentRotation = currentWidgetTransform.rotation;
                }
                console.debug('getTransitionToSquare; Current rotation:', currentRotation);
            },
            onComplete: function () {
            },
        });
        var previousShape = this.currentShape;
        squareAnimationTimeline.add([
            this.getSquareAnimation(timeSeconds / 4),
            this.getToFullScaleCompleteRotationAnimation(timeSeconds, previousShape)
        ]);
        return squareAnimationTimeline;
    };
    PerspectiveStatus.prototype.getTransitionToDiamondAnimation = function (timeSeconds) {
        var diamondAnimationTimeline = new gsap.TimelineMax({
            onStart: function () {
            },
            onComplete: function () {
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
    };
    PerspectiveStatus.prototype.getRotateBackAndForthAnimation = function (timeSeconds, degrees) {
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            rotation: degrees,
            onStart: function () {
                console.debug('Starting rotate back and forth animation');
            },
            onComplete: function () {
                console.debug('Rotate back and forth animation completed');
            },
        });
    };
    PerspectiveStatus.prototype.getToFullScaleBounceAnimation = function (timeSeconds) {
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            scaleX: 1,
            scaleY: 1,
            ease: gsap.Elastic.easeOut.config(1, 0.3),
            onStart: function () {
                console.debug('Starting get to full scale bounce animation');
            },
            onComplete: function () {
                console.debug('Get to full scale bounce animation completed');
            },
        });
    };
    PerspectiveStatus.prototype.getToFullScaleAnimation = function (timeSeconds) {
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            scaleX: 1,
            scaleY: 1,
            onStart: function () {
                console.debug('Starting get to full scale animation');
            },
            onComplete: function () {
                console.debug('Get to full scale animation completed');
            },
        });
    };
    PerspectiveStatus.prototype.getToFullScaleCompleteRotationAnimation = function (timeSeconds, fromShape) {
        var currentRotation = 0;
        var currentWidgetTransform = ((this.widgetElement))._gsTransform;
        if (currentWidgetTransform !== undefined) {
            currentRotation = currentWidgetTransform.rotation;
        }
        console.debug('Current rotation:', currentRotation);
        console.debug('From shape:', this.getNameFromShape(fromShape));
        var rotationDegrees = fromShape === Shape.DIAMOND ? 315 : 360;
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            rotation: "+=" + rotationDegrees + "_ccw",
            scaleX: 1,
            scaleY: 1,
            ease: gsap.Elastic.easeOut.config(1, 0.3),
            onStart: function () {
                console.debug('Starting get to full scale complete rotation animation');
            },
            onComplete: function () {
                console.debug('Get to full scale complete rotation animation completed');
            },
        });
    };
    PerspectiveStatus.prototype.getTransitionToLayerAnimation = function (endLayerIndex, timeSeconds) {
        var _this = this;
        this.layerHeightPixels = this.layerAnimationHandles[this.currentLayerIndex].offsetHeight;
        var timeline = new gsap.TimelineMax({
            onStart: function () {
                _this.ngZone.run(function () {
                    console.debug('Transitioning from layer ' + _this.currentLayerIndex
                        + ' to layer ' + endLayerIndex);
                    _this.layersAnimating = true;
                });
            },
            onComplete: function () {
                _this.ngZone.run(function () {
                    _this.layersAnimating = false;
                    _this.currentLayerIndex = endLayerIndex;
                    console.debug('Finished transitioning to layer ' + _this.currentLayerIndex);
                    _this.showingMoreInfo = _this.currentLayerIndex === 1;
                    _this.updateLayerElementContainers();
                });
            },
        });
        if (this.currentLayerIndex === endLayerIndex) {
            return timeline;
        }
        var startLayer = this.layerAnimationHandles[this.currentLayerIndex];
        var endLayer = this.layerAnimationHandles[endLayerIndex];
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
    };
    PerspectiveStatus.prototype.getShiftLayerVerticallyAnimation = function (layer, timeSeconds, startY, endY, fadeIn) {
        return gsap.TweenMax.fromTo(layer, timeSeconds, { y: startY, opacity: fadeIn ? 0 : 1 }, { y: endY, opacity: fadeIn ? 1 : 0 });
    };
    PerspectiveStatus.prototype.getCircleAnimation = function (timeSeconds, endColor) {
        var _this = this;
        if (!endColor) {
            endColor = this.interpolateColors(this.score);
        }
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            rotation: 0,
            borderRadius: "50%",
            backgroundColor: endColor,
            onStart: function () {
                console.debug('Loading animation: Morphing to circle from '
                    + _this.getNameFromShape(_this.currentShape));
                _this.currentShape = Shape.CIRCLE;
            },
            onComplete: function () {
                console.debug('Loading animation: done morphing to circle.');
            },
        });
    };
    PerspectiveStatus.prototype.getSquareAnimation = function (timeSeconds) {
        var _this = this;
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            rotation: 0,
            borderRadius: 0,
            backgroundColor: this.interpolateColors(this.score),
            onStart: function () {
                console.debug('Morphing to square from ' + _this.getNameFromShape(_this.currentShape));
                _this.currentShape = Shape.SQUARE;
            },
            onComplete: function () {
                console.debug('Done morphing to square');
            },
        });
    };
    PerspectiveStatus.prototype.getDiamondAnimation = function (timeSeconds) {
        var _this = this;
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            borderRadius: 0,
            rotation: 45,
            backgroundColor: this.interpolateColors(this.score),
            onStart: function () {
                console.debug('Morphing to diamond from ' + _this.getNameFromShape(_this.currentShape));
                _this.currentShape = Shape.DIAMOND;
            },
            onComplete: function () {
                console.debug('Done morphing to diamond.');
            },
        });
    };
    PerspectiveStatus.prototype.getToGrayScaleAnimation = function (timeSeconds) {
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            backgroundColor: GRAY_COLOR_CIRCLE_LOADING,
        });
    };
    PerspectiveStatus.prototype.getFadeAndShrinkAnimation = function (timeSeconds, repeat) {
        return gsap.TweenMax.to(this.widgetElement, timeSeconds, {
            repeat: repeat ? 1 : 0,
            backgroundColor: "rgba(227,229,230,0.54)",
            scaleX: 0.5,
            scaleY: 0.5,
            yoyo: repeat,
            onStart: function () {
                console.debug('Loading animation: fade in and out start');
            },
            onComplete: function () {
                console.debug('Loading animation: fade in and out complete');
            },
        });
    };
    PerspectiveStatus.prototype.getFadeDetailsAnimation = function (timeSeconds, hide, layerIndex) {
        var _this = this;
        var timeline = new gsap.TimelineMax({
            onStart: function () {
                _this.ngZone.run(function () {
                    console.debug('Calling getFadeDetails animation, fadeOut=' + hide
                        + ' and current layer index = ' + _this.currentLayerIndex);
                    _this.isPlayingFadeDetailsAnimation = true;
                });
            },
            onComplete: function () {
                _this.ngZone.run(function () {
                    console.debug('Fade details animation complete');
                    _this.isPlayingFadeDetailsAnimation = false;
                });
            },
        });
        var interactiveLayerControlsContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[layerIndex] + ' .interactiveElement');
        var layerTextContainer = this.elementRef.nativeElement.querySelector(this.layerAnimationSelectors[layerIndex] + ' .layerText');
        timeline.add([
            gsap.TweenMax.to(interactiveLayerControlsContainer, timeSeconds, { opacity: (hide ? 0 : 1) }),
            gsap.TweenMax.to(layerTextContainer, timeSeconds, { opacity: (hide ? 0 : 1) }),
        ], 0, 'normal', 0);
        return timeline;
    };
    return PerspectiveStatus;
}());
PerspectiveStatus.decorators = [
    { type: core.Component, args: [{
                selector: 'perspective-status',
                template: "<div #widgetContainer id=\"widgetContainer\" class=\"horizontal-container\">\n  <link href=\"https://fonts.googleapis.com/icon?family=Material+Icons\"\n        rel=\"stylesheet\">\n  <!-- For items that need to be animated, hidden is used instead of *ngIf.\n       This is because *ngIf removes items from the DOM, which means they\n       cannot be found when the component is initializing if their display\n       conditions are not met. -->\n  <div id=\"animationContainer\">\n    <div *ngIf=\"loadingIconStyle === loadingIconStyleConst.CIRCLE_SQUARE_DIAMOND\"\n         id=\"circleSquareDiamondLoadingIconContainer\">\n      <div\n           #circleSquareDiamondWidget\n           id=\"circleSquareDiamondWidget\"\n           class=\"dot\"\n           [style.width]=\"indicatorWidth\"\n           [style.height]=\"indicatorHeight\"\n           [hidden]=\"shouldHideStatusWidget || alwaysHideLoadingIcon\"\n           [attr.aria-hidden]=\"shouldHideStatusWidget || isPlayingShowOrHideLoadingWidgetAnimation || alwaysHideLoadingIcon\"\n           [attr.aria-label]=\"getAnimationA11yLabel(loadingIconStyle, isPlayingLoadingAnimation)\"\n           tabindex=0>\n      </div>\n    </div>\n    <div *ngIf=\"loadingIconStyle === loadingIconStyleConst.EMOJI\">\n      <div\n           #emojiStatusWidget\n           id=\"emojiStatusWidget\"\n           class=\"dot emojiWidget\"\n           tabindex=0\n           [attr.aria-label]=\"getAnimationA11yLabel(loadingIconStyle, isPlayingLoadingAnimation)\">\n        <img #smileEmoji id=\"smileEmoji\" class=\"iconEmoji\"\n             [ngClass]=\"{hiddenEmoji: hideEmojiIconsForLoadingAnimation || score >= scoreThresholds[1]}\"\n             src=\"assets/grinning_face.png\">\n        <img #neutralEmoji id=\"neutralEmoji\" class=\"iconEmoji\"\n             [ngClass]=\"{hiddenEmoji: hideEmojiIconsForLoadingAnimation || (score < scoreThresholds[1] || score >= scoreThresholds[2])}\"\n             src=\"assets/thinking_face.png\">\n        <img #sadEmoji id=\"sadEmoji\" class=\"iconEmoji\"\n             [ngClass]=\"{hiddenEmoji: hideEmojiIconsForLoadingAnimation || score < scoreThresholds[2]}\"\n             src=\"assets/disappointed_face.png\">\n      </div>\n    </div>\n  </div>\n\n  <div class=\"layersContainer\">\n    <!-- TODO(rachelrosen): Check the necessity of specifying aria-hidden here and elsewhere. -->\n    <div id=\"layer1\" [ngClass]=\"{'horizontal-container': true,\n                                 'detailsContainer': true,\n                                 'layer': true,\n                                 'hiddenLayer': !layersAnimating && currentLayerIndex !== 0}\"\n                     [attr.aria-hidden]=\"currentLayerIndex !== 0\">\n      <div id=\"layerText\" class=\"layerText\">\n        <!-- For layer 1 text, configurations EXTERNAL and DEMO_SITE are the same.-->\n        <div>\n          <div id=\"noBorderButtonscoreInfo\"\n               class=\"widgetText\"\n               *ngIf=\"hasScore && !analyzeErrorMessage && shouldShowFeedback(score)\"\n               [style.fontSize]=\"fontSize\"\n               tabindex=0\n               role=\"status\"\n               [attr.aria-hidden]=\"!showScore || isPlayingLoadingAnimation || isPlayingFadeDetailsAnimation\">\n            <span id=\"feedbackText\" [innerHTML]=\"parseEmojis(getFeedbackTextForScore(score))\"></span><span *ngIf=\"showPercentage\" id=\"percentage\">({{score.toFixed(2)}})</span><span\n               *ngIf=\"showMoreInfoLink\"\n               class=\"link\"\n               role=\"link\"\n               tabindex=0\n               (keyup.enter)=\"notifyModelInfoLinkClicked()\"\n               (keyup.space)=\"notifyModelInfoLinkClicked()\"\n               (click)=\"notifyModelInfoLinkClicked()\">Learn more</span>\n          </div>\n\n          <div class=\"error\" *ngIf=\"initializeErrorMessage\">\n            {{initializeErrorMessage}}\n          </div>\n          <div class=\"error\" *ngIf=\"analyzeErrorMessage\">\n            {{analyzeErrorMessage}}\n          </div>\n        </div><!-- End configuration DEMO_SITE or EXTERNAL -->\n\n      </div> <!-- End layerText -->\n\n      <div class=\"interactiveElement\">\n        <div *ngIf=\"configuration === configurationEnum.EXTERNAL\">\n          <div id=\"infoButtonContainer\" class=\"infoButtonContainer\">\n            <button *ngIf=\"hasScore && shouldShowFeedback(score)\"\n              id=\"infoButton\"\n              class=\"infoButton\"\n              role=\"button\"\n              aria-label=\"Show score details\"\n              [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n              (click)=\"setShowMoreInfo(true)\"\n              tabindex=0>\n              <i class=\"material-icons md-dark md-18\">info</i>\n            </button>\n          </div>\n        </div> <!-- End configuration EXTERNAL-->\n\n        <div *ngIf=\"configuration === configurationEnum.DEMO_SITE\">\n          <button id=\"seemWrongButtonDemoConfig\"\n               *ngIf=\"canAcceptFeedback && shouldShowFeedback(score)\"\n               role=\"button\"\n               class=\"seemWrongButton purpleButton noBorderButton\"\n               [style.fontSize]=\"fontSize\"\n               [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n               (click)=\"feedbackContainerClicked()\"\n               tabindex=0>\n            {{userFeedbackPromptText}}\n          </button>\n        </div>\n\n      </div> <!-- End interactiveElement -->\n    </div> <!-- End layer1 -->\n\n    <div id=\"layer2\" [ngClass]=\"{'horizontal-container': true,\n                                 'detailsContainer': true,\n                                 'layer': true,\n                                 'hiddenLayer': !layersAnimating && currentLayerIndex !== 1}\"\n                     [attr.aria-hidden]=\"currentLayerIndex !== 1\">\n\n      <div class=\"layerText\">\n        <div *ngIf=\"configuration === configurationEnum.EXTERNAL\">\n          <div id=\"detailedScoreInfo\"\n               class=\"widgetText\"\n               role=\"status\"\n               tabindex=0>\n            <span>Scored {{(score.toFixed(2) * 100).toFixed(0)}}% by the <a href=\"https://conversationai.github.io/\">Perspective \"Toxicity\" analyzer</a>\n            </span>\n          </div>\n        </div> <!-- End configuration EXTERNAL-->\n\n        <div *ngIf=\"configuration === configurationEnum.DEMO_SITE\">\n          <div class=\"widgetText\"\n            tabindex=0>\n            <span>Is this comment\n              <span class=\"link\"\n                    role=\"link\"\n                    tabindex=0\n                    (keyup.enter)=\"notifyModelInfoLinkClicked()\"\n                    (keyup.space)=\"notifyModelInfoLinkClicked()\"\n                    (click)=\"notifyModelInfoLinkClicked()\">toxic</span>?\n            </span>\n          </div>\n        </div> <!-- End configuration DEMO_SITE -->\n\n      </div> <!-- End layerText -->\n\n      <div class=\"interactiveElement\">\n\n        <div *ngIf=\"configuration === configurationEnum.EXTERNAL\">\n          <div class=\"horizontal-container\">\n            <div class=\"feedbackContainer widgetText\"\n                 [style.fontSize]=\"fontSize\"\n                 [attr.aria-hidden]=\"!showScore || isPlayingLoadingAnimation\">\n              <button id=\"seemWrongButton\"\n                   *ngIf=\"canAcceptFeedback && !showFeedbackQuestion\n                      && !feedbackRequestInProgress && !feedbackRequestSubmitted && !feedbackRequestError\"\n                   role=\"button\"\n                   class=\"seemWrongButton greyButton noBorderButton\"\n                   [style.fontSize]=\"fontSize\"\n                   [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n                   (click)=\"feedbackContainerClicked()\"\n                   tabindex=0>\n                {{userFeedbackPromptText}}\n              </button>\n              <div id=\"seemWrongQuestion\" *ngIf=\"showFeedbackQuestion && !feedbackRequestInProgress\">\n                <div class=\"feedbackQuestion widgetText\" tabindex=0>Is this text toxic?</div>\n                <div class=\"yesNoButtonContainer horizontal-container\">\n                  <div>\n                    <button\n                      id=\"yesButtonExternalConfig\"\n                      class=\"yesNoButton greyButton underlineButton noBorderButton\"\n                      role=\"button\"\n                      [style.fontSize]=\"fontSize\"\n                      [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n                      (click)=\"submitFeedback(true)\"\n                      tabindex=0>\n                      Yes\n                    </button>\n                  </div>\n                  <div>\n                    <button\n                      id=\"noButtonExternalConfig\"\n                      class=\"yesNoButton greyButton underlineButton noBorderButton\"\n                      role=\"button\"\n                      [style.fontSize]=\"fontSize\"\n                      [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n                      (click)=\"submitFeedback(false)\"\n                      tabindex=0>\n                      No\n                    </button>\n                  </div>\n                </div>\n              </div>\n              <div id=\"feedbackSubmitting\"\n                   tabindex=0\n                   role=\"status\"\n                   *ngIf=\"feedbackRequestInProgress\">\n                Sending...\n              </div>\n              <div id=\"feedbackThanks\"\n                   tabindex=0\n                   role=\"status\"\n                   *ngIf=\"feedbackRequestSubmitted\">\n                Thanks for the feedback!\n              </div>\n              <div *ngIf=\"feedbackRequestError\">\n                <button\n                     class=\"error noBorderButton\"\n                     role=\"button\"\n                     [style.fontSize]=\"fontSize\"\n                     (click)=\"resetFeedback()\"\n                     tabindex=0>\n                  Error submitting feedback. Click to try again.\n                </button>\n              </div>\n            </div>\n            <div id=\"infoButtonContainer\" class=\"infoButtonContainer\">\n              <button *ngIf=\"hasScore\"\n                id=\"cancelButton\"\n                class=\"infoButton\"\n                role=\"button\"\n                aria-label=\"Hide score details\"\n                [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n                (click)=\"setShowMoreInfo(false)\"\n                tabindex=0>\n                <i class=\"material-icons md-dark md-18\">cancel</i>\n              </button>\n            </div>\n          </div>\n        </div> <!-- End configuration EXTERNAL -->\n\n        <div *ngIf=\"configuration === configurationEnum.DEMO_SITE\">\n          <div class=\"yesNoButtonContainer horizontal-container\"\n               *ngIf=\"!feedbackRequestInProgress && !feedbackRequestSubmitted && !feedbackRequestError\">\n            <div>\n              <button\n                id=\"yesButtonDemoConfig\"\n                class=\"yesNoButton purpleButton noBorderButton\"\n                role=\"button\"\n                [style.fontSize]=\"fontSize\"\n                [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n                (click)=\"submitFeedback(true)\"\n                tabindex=0>\n                Yes\n              </button>\n            </div>\n            <div>\n              <button\n                id=\"noButtonDemoConfig\"\n                class=\"yesNoButton purpleButton noBorderButton\"\n                role=\"button\"\n                [style.fontSize]=\"fontSize\"\n                [disabled]=\"!showScore || isPlayingLoadingAnimation || layersAnimating\"\n                (click)=\"submitFeedback(false)\"\n                tabindex=0>\n                No\n              </button>\n            </div>\n          </div>\n        </div> <!-- End configuration DEMO_SITE -->\n\n      </div> <!-- End layer2 interactive element -->\n\n    </div> <!-- End layer2 -->\n\n    <div id=\"layer3\" [ngClass]=\"{'horizontal-container': true,\n                                 'detailsContainer': true,\n                                 'hiddenLayer': !layersAnimating && currentLayerIndex !== 2}\">\n      <div class=\"interactiveElement\">\n\n        <div *ngIf=\"configuration === configurationEnum.DEMO_SITE\">\n            <div id=\"feedbackThanksDemoConfig\"\n                 class=\"widgetText\"\n                 tabindex=0\n                 role=\"status\"\n                 *ngIf=\"feedbackRequestSubmitted\">\n              <button\n                id=\"thanksForFeedbackButtonDemoConfig\"\n                class=\"noBorderButton feedbackResponseButton widgetText\"\n                role=\"button\"\n                (click)=\"resetLayers()\">\n                Thanks for your feedback!\n              </button>\n            </div>\n            <div *ngIf=\"feedbackRequestError\">\n              <button\n                   class=\"error noBorderButton feedbackResponseButton\"\n                   role=\"button\"\n                   [style.fontSize]=\"fontSize\"\n                   (click)=\"resetLayers()\"\n                   tabindex=0>\n                Error submitting feedback. Click to try again.\n              </button>\n            </div>\n        </div> <!-- End configuration DEMO_SITE. -->\n      </div> <!-- End interactiveElement. -->\n    </div> <!-- End layer3 -->\n\n  </div>\n</div>\n",
                styles: [".horizontal-container{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-ms-flex-direction:row;flex-direction:row}.center-perp-axis{-webkit-box-align:center;-ms-flex-align:center;align-items:center}.dot{border-radius:50%;border:0;background-color:#00bcd4;margin:2px;padding:0;width:13px;height:13px;vertical-align:top}#circleSquareDiamondLoadingIconContainer{padding-top:2px}.emojiWidget{background-color:#ffcc4d;width:16px;height:16px}.iconEmoji{width:16px;height:16px;opacity:0}.hiddenEmoji{display:none}#animationContainer{z-index:5;width:20px;height:22px;margin-right:10px}#scoreInfoContainer{padding-top:2px}.widgetText{color:#6e7378;font-size:12px;line-height:16px;letter-spacing:.05em;width:100%}#feedbackText,#percentage{margin-right:4px}.widgetText a{color:#6e7378!important}.link{text-decoration:underline;cursor:pointer}.layerText{padding-right:10px;padding-top:2px}#detailedScoreInfo a{width:40%;color:#6e7378!important}.feedbackQuestion{margin-right:4px}.seemWrongButton{font-size:12px;font-family:Roboto,sans-serif;line-height:16px;letter-spacing:.05em;-ms-flex-item-align:start;align-self:flex-start}.detailsContainer{-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;width:100%;margin-top:1px}.layersContainer{width:100%;position:relative}.layer{position:absolute}.hiddenLayer{display:none!important}.interactiveElement{vertical-align:top;text-align:end;margin-left:auto;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-pack:end;-ms-flex-pack:end;justify-content:flex-end;min-width:-webkit-fit-content;min-width:-moz-fit-content;min-width:fit-content;padding-top:1px}.interactiveElement .feedbackContainer{padding-top:2px}#layer3 .interactiveElement{-webkit-box-flex:0;-ms-flex:0 1 auto;flex:0 1 auto;margin-left:0;padding-top:2px}.noBorderButton{background-color:#fff;border:0;cursor:pointer;padding-top:0;font-family:Roboto,sans-serif}.feedbackResponseButton{padding-left:0}.purpleButton{color:#6200ea;text-transform:uppercase}.greyButton{color:#6e7378}.underlineButton{text-decoration:underline}.yesNoButton{font-size:12px;font-family:Roboto,sans-serif;line-height:16px;letter-spacing:.05em}.yesNoButton.purpleButton{margin-left:8px;margin-right:8px}.yesNoButtonContainer{-webkit-box-pack:end;-ms-flex-pack:end;justify-content:flex-end}#widgetContainer{height:50px}.error{font-size:12px;letter-spacing:.05em;line-height:16px;color:#f44336}.infoButtonContainer{margin-left:10px;width:26px;height:26px}.infoButton{background-color:transparent;border:none;cursor:pointer}.material-icons.md-18{font-size:18px}.material-icons.md-dark{color:#78909c}.material-icons.md-dark.md-inactive{color:rgba(0,0,0,.26)}"],
            },] },
    { type: core.Injectable },
];
PerspectiveStatus.ctorParameters = function () { return [
    { type: core.NgZone, },
    { type: core.ElementRef, },
]; };
PerspectiveStatus.propDecorators = {
    "indicatorWidth": [{ type: core.Input },],
    "indicatorHeight": [{ type: core.Input },],
    "configurationInput": [{ type: core.Input },],
    "hasScore": [{ type: core.Input },],
    "fontSize": [{ type: core.Input },],
    "gradientColors": [{ type: core.Input },],
    "canAcceptFeedback": [{ type: core.Input },],
    "feedbackRequestInProgress": [{ type: core.Input },],
    "feedbackRequestSubmitted": [{ type: core.Input },],
    "feedbackRequestError": [{ type: core.Input },],
    "initializeErrorMessage": [{ type: core.Input },],
    "feedbackText": [{ type: core.Input },],
    "scoreThresholds": [{ type: core.Input },],
    "showPercentage": [{ type: core.Input },],
    "showMoreInfoLink": [{ type: core.Input },],
    "analyzeErrorMessage": [{ type: core.Input },],
    "userFeedbackPromptText": [{ type: core.Input },],
    "hideLoadingIconAfterLoad": [{ type: core.Input },],
    "hideLoadingIconForScoresBelowMinThreshold": [{ type: core.Input },],
    "alwaysHideLoadingIcon": [{ type: core.Input },],
    "loadingIconStyle": [{ type: core.Input },],
    "scoreChangeAnimationCompleted": [{ type: core.Output },],
    "modelInfoLinkClicked": [{ type: core.Output },],
    "commentFeedbackSubmitted": [{ type: core.Output },],
    "circleSquareDiamondWidget": [{ type: core.ViewChild, args: ['circleSquareDiamondWidget',] },],
    "emojiWidget": [{ type: core.ViewChild, args: ['emojiStatusWidget',] },],
    "container": [{ type: core.ViewChild, args: ['widgetContainer',] },],
    "smileEmoji": [{ type: core.ViewChild, args: ['smileEmoji',] },],
    "neutralEmoji": [{ type: core.ViewChild, args: ['neutralEmoji',] },],
    "sadEmoji": [{ type: core.ViewChild, args: ['sadEmoji',] },],
};
var DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery'
    + '/rest?version=v1alpha1';
var TOXICITY_ATTRIBUTE = 'TOXICITY';
var PerspectiveApiService = /** @class */ (function () {
    function PerspectiveApiService(http$$1) {
        this.http = http$$1;
        this.gapiClient = null;
    }
    PerspectiveApiService.prototype.initGapiClient = function (apiKey) {
        var _this = this;
        if (!apiKey) {
            this.gapiClient = null;
        }
        gapi.load('client', function () {
            console.log('Starting to load gapi client');
            ((gapi.client)).init({
                'apiKey': apiKey,
                'discoveryDocs': [DISCOVERY_URL],
            }).then(function () {
                console.log('Finished loading gapi client');
                console.log(gapi.client);
                _this.gapiClient = (((gapi.client)));
            }, function (error) {
                console.error('Error loading gapi client:', error);
            });
        });
    };
    PerspectiveApiService.prototype.checkText = function (text, sessionId, communityId, makeDirectApiCall, serverUrl) {
        if (makeDirectApiCall && this.gapiClient === null) {
            console.error('No gapi client found; call initGapiClient with your API'
                + 'key to make a direct API call. Using server instead');
            makeDirectApiCall = false;
        }
        if (makeDirectApiCall) {
            console.debug('Making a direct API call with gapi');
            var requestedAttributes = {};
            requestedAttributes[TOXICITY_ATTRIBUTE] = {};
            var request = {
                comment: { text: text },
                requested_attributes: requestedAttributes,
                session_id: sessionId,
                community_id: communityId
            };
            return rxjs.from(this.gapiClient.commentanalyzer.comments.analyze(request))
                .pipe(operators.map(function (response) { return response.result; }));
        }
        else {
            if (serverUrl === undefined) {
                serverUrl = '';
                console.error('No server url specified for a non-direct API call.'
                    + ' Defaulting to current hosted address');
            }
            var headers = new http.Headers();
            headers.append('Content-Type', 'application/json');
            var data = {
                comment: text,
                sessionId: sessionId,
                communityId: communityId,
            };
            return this.http.post(serverUrl + '/check', JSON.stringify(data), { headers: headers })
                .pipe(operators.map(function (response) { return response.json(); }));
        }
    };
    PerspectiveApiService.prototype.suggestScore = function (text, sessionId, commentMarkedAsToxic, makeDirectApiCall, serverUrl) {
        if (makeDirectApiCall && this.gapiClient === null) {
            console.error('No gapi client found; call initGapiClient with your API'
                + 'key to make a direct API call. Using server instead');
            makeDirectApiCall = false;
        }
        if (makeDirectApiCall) {
            var attributeScores = {};
            attributeScores[TOXICITY_ATTRIBUTE] = {
                summaryScore: { value: commentMarkedAsToxic ? 1 : 0 }
            };
            var request = {
                comment: { text: text },
                attribute_scores: attributeScores,
                client_token: sessionId,
            };
            console.debug('Making a direct API call with gapi');
            return rxjs.from(this.gapiClient.commentanalyzer.comments.suggestscore(request))
                .pipe(operators.map(function (response) { return response.result; }));
        }
        else {
            if (serverUrl === undefined) {
                serverUrl = '';
                console.error('No server url specified for a non-direct API call.'
                    + ' Defaulting to current hosted address');
            }
            var headers = new http.Headers();
            headers.append('Content-Type', 'application/json');
            var data = {
                comment: text,
                sessionId: sessionId,
                commentMarkedAsToxic: commentMarkedAsToxic
            };
            return this.http.post(serverUrl + '/suggest_score', JSON.stringify(data), { headers: headers })
                .pipe(operators.map(function (response) { return response.json(); }));
        }
    };
    return PerspectiveApiService;
}());
PerspectiveApiService.decorators = [
    { type: core.Injectable },
];
PerspectiveApiService.ctorParameters = function () { return [
    { type: http.Http, },
]; };
var DEFAULT_DEMO_SETTINGS = {
    configuration: 'default',
    gradientColors: ["#25C1F9", "#7C4DFF", "#D400F9"],
    apiKey: '',
    useGapi: false,
    usePluginEndpoint: false,
    showPercentage: true,
    showMoreInfoLink: true,
    feedbackText: ([
        'Unlikely to be perceived as toxic',
        'Unsure if this will be perceived as toxic',
        'Likely to be perceived as toxic'
    ]),
    scoreThresholds: ([0, 0.4, 0.7]),
    hideLoadingIconAfterLoad: false,
    hideLoadingIconForScoresBelowMinThreshold: false,
    alwaysHideLoadingIcon: false,
    loadingIconStyle: LoadingIconStyle.CIRCLE_SQUARE_DIAMOND,
    userFeedbackPromptText: 'Seem wrong?'
};
var ConvaiChecker = /** @class */ (function () {
    function ConvaiChecker(elementRef, analyzeApiService) {
        this.elementRef = elementRef;
        this.analyzeApiService = analyzeApiService;
        this.fontSize = 12;
        this.demoSettings = DEFAULT_DEMO_SETTINGS;
        this.demoSettingsJson = null;
        this.pluginEndpointUrl = 'http://perspectiveapi.com';
        this.scoreChangeAnimationCompleted = new core.EventEmitter();
        this.scoreChanged = new core.EventEmitter();
        this.modelInfoLinkClicked = new core.EventEmitter();
        this.analyzeCommentResponseChanged = new core.EventEmitter();
        this.analyzeCommentResponse = null;
        this.analyzeErrorMessage = null;
        this.canAcceptFeedback = false;
        this.feedbackRequestInProgress = false;
        this.sessionId = null;
        this.gradientColors = ["#25C1F9", "#7C4DFF", "#D400F9"];
        this.inputId = this.elementRef.nativeElement.getAttribute('inputId');
        this.serverUrl =
            this.elementRef.nativeElement.getAttribute('serverUrl') || '';
    }
    ConvaiChecker.prototype.ngOnInit = function () {
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
    };
    ConvaiChecker.prototype.ngOnChanges = function (changes) {
        if (changes['demoSettings']) {
            if (this.demoSettings && this.demoSettings.apiKey &&
                this.apiKey !== this.demoSettings.apiKey) {
                console.debug('Api key changes detected in demoSettings');
                this.apiKey = this.demoSettings.apiKey;
                this.analyzeApiService.initGapiClient(this.apiKey);
            }
        }
    };
    ConvaiChecker.prototype.checkText = function (text) {
        this._handlePendingCheckRequest(text);
    };
    ConvaiChecker.prototype._handleInputEvent = function (event) {
        if (event.target.id === this.inputId) {
            this._handlePendingCheckRequest(event.target.value);
        }
    };
    ConvaiChecker.prototype._handlePendingCheckRequest = function (text) {
        var _this = this;
        if (text === this.lastRequestedText ||
            text === this.lastPendingRequestedText) {
            console.debug('Duplicate request text ' + text + '; returning');
            return;
        }
        console.debug('Clearing this.pendingRequest');
        clearTimeout(this.pendingRequest);
        this.analyzeErrorMessage = null;
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
        console.debug('Updating this.pendingRequest for text: ', text);
        this.pendingRequest = window.setTimeout(function () {
            _this._checkText(text);
        }, REQUEST_LIMIT_MS);
    };
    ConvaiChecker.prototype.onCommentFeedbackReceived = function (feedback) {
        if (this.analyzeCommentResponse === null) {
            return;
        }
        this.suggestCommentScore(this.lastRequestedText, feedback);
    };
    ConvaiChecker.prototype.handleScoreChangeAnimationCompleted = function () {
        this.scoreChangeAnimationCompleted.emit();
        console.debug('Score animation completed! Emitting an event');
    };
    ConvaiChecker.prototype.handleModelInfoLinkClicked = function () {
        this.modelInfoLinkClicked.emit();
    };
    ConvaiChecker.prototype.suggestCommentScore = function (text, feedback) {
        var _this = this;
        this.feedbackRequestInProgress = true;
        this.analyzeApiService.suggestScore(text, this.sessionId, feedback.commentMarkedAsToxic, this.demoSettings.useGapi, this.serverUrl).pipe(operators.finalize(function () {
            console.debug('Feedback request done');
            _this.statusWidget.hideFeedbackQuestion();
            _this.feedbackRequestInProgress = false;
        }))
            .subscribe(function (response) {
            _this.statusWidget.feedbackCompleted(true);
            console.log(response);
        }, function (error) {
            console.error('Error', error);
            _this.statusWidget.feedbackCompleted(false);
        });
    };
    ConvaiChecker.prototype._getErrorMessage = function (error) {
        var msg = 'Error scoring text. Please try again.';
        try {
            try {
                for (var _a = __values(error.json().errors), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var api_err = _b.value;
                    if (api_err.message.includes('does not support request languages')) {
                        msg = 'Sorry! Perspective needs more training data to work in this '
                            + 'language.';
                        break;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        catch (e) {
            console.warn('Failed to parse error. ', e);
        }
        return msg;
        var e_2, _c;
    };
    ConvaiChecker.prototype._checkText = function (text) {
        var _this = this;
        if (this.mostRecentRequestSubscription) {
            this.mostRecentRequestSubscription.unsubscribe();
        }
        this.statusWidget.resetFeedback();
        console.log('Checking text ' + text);
        this.lastRequestedText = text;
        this.checkInProgress = true;
        this.mostRecentRequestSubscription =
            this.analyzeApiService.checkText(text, this.sessionId, this.demoSettings.communityId, this.demoSettings.useGapi, this.demoSettings.usePluginEndpoint ? this.pluginEndpointUrl : this.serverUrl)
                .pipe(operators.finalize(function () {
                console.log('Request done');
                var newScore = _this.getMaxScore(_this.analyzeCommentResponse);
                _this.statusWidget.notifyScoreChange(newScore);
                _this.scoreChanged.emit(newScore);
                _this.mostRecentRequestSubscription = null;
            }))
                .subscribe(function (response) {
                _this.analyzeCommentResponse = response;
                _this.analyzeCommentResponseChanged.emit(_this.analyzeCommentResponse);
                console.log(_this.analyzeCommentResponse);
                _this.checkInProgress = false;
                _this.canAcceptFeedback = true;
            }, function (error) {
                console.error('Error', error);
                _this.checkInProgress = false;
                _this.canAcceptFeedback = false;
                _this.analyzeErrorMessage = _this._getErrorMessage(error);
                _this.analyzeCommentResponse = null;
            });
    };
    ConvaiChecker.prototype.getMaxScore = function (response) {
        var _this = this;
        if (response === null || response.attributeScores == null) {
            return 0;
        }
        var max = undefined;
        Object.keys(response.attributeScores).forEach(function (key) {
            var maxSpanScoreForAttribute = _this.getMaxSpanScore(response.attributeScores[key]);
            if (max === undefined || maxSpanScoreForAttribute > max) {
                max = maxSpanScoreForAttribute;
            }
        });
        if (max === undefined) {
            console.error('No "value" field found for score. Returning 0.');
            max = 0;
        }
        return max;
    };
    ConvaiChecker.prototype.getMaxSpanScore = function (spanScores) {
        var max = undefined;
        try {
            for (var _a = __values(spanScores.spanScores), _b = _a.next(); !_b.done; _b = _a.next()) {
                var spanScore = _b.value;
                if (max === undefined || spanScore.score.value > max) {
                    max = spanScore.score.value;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return max;
        var e_3, _c;
    };
    return ConvaiChecker;
}());
ConvaiChecker.decorators = [
    { type: core.Component, args: [{
                selector: 'convai-checker',
                template: "<div id=\"checkerContainer\">\n  <!-- TODO(rachelrosen): merge perspective-status and convai-checker\n       and move a large portion of the convai-checker code to the perspective-api service. -->\n  <perspective-status\n    [fontSize]=\"fontSize\"\n    [indicatorWidth]=\"13\"\n    [indicatorHeight]=\"13\"\n    [gradientColors]=\"demoSettings.gradientColors\"\n    [scoreThresholds]=\"demoSettings.scoreThresholds\"\n    [feedbackText]=\"demoSettings.feedbackText\"\n    [configurationInput]=\"demoSettings.configuration\"\n    [showPercentage]=\"demoSettings.showPercentage\"\n    [showMoreInfoLink]=\"demoSettings.showMoreInfoLink\"\n    [hasScore]=\"analyzeCommentResponse !== null\"\n    [canAcceptFeedback]=\"canAcceptFeedback\"\n    [feedbackRequestInProgress]=\"feedbackRequestInProgress\"\n    [initializeErrorMessage]=\"initializeErrorMessage\"\n    [analyzeErrorMessage]=\"analyzeErrorMessage\"\n    [userFeedbackPromptText]=\"demoSettings.userFeedbackPromptText\"\n    [hideLoadingIconAfterLoad]=\"demoSettings.hideLoadingIconAfterLoad\"\n    [hideLoadingIconForScoresBelowMinThreshold]=\"demoSettings.hideLoadingIconForScoresBelowMinThreshold\"\n    [alwaysHideLoadingIcon]=\"demoSettings.alwaysHideLoadingIcon\"\n    [loadingIconStyle]=\"demoSettings.loadingIconStyle\"\n    (commentFeedbackSubmitted)=\"onCommentFeedbackReceived($event)\"\n    (scoreChangeAnimationCompleted)=\"handleScoreChangeAnimationCompleted()\"\n    (modelInfoLinkClicked)=\"handleModelInfoLinkClicked()\">\n  </perspective-status>\n</div>\n",
                styles: ["#checkerContainer{font-family:Roboto,sans-serif;line-height:1}"],
                providers: [PerspectiveApiService],
                host: {
                    '(document:input)': '_handleInputEvent($event)',
                },
            },] },
];
ConvaiChecker.ctorParameters = function () { return [
    { type: core.ElementRef, },
    { type: PerspectiveApiService, },
]; };
ConvaiChecker.propDecorators = {
    "statusWidget": [{ type: core.ViewChild, args: [PerspectiveStatus,] },],
    "inputId": [{ type: core.Input },],
    "serverUrl": [{ type: core.Input },],
    "fontSize": [{ type: core.Input },],
    "demoSettings": [{ type: core.Input },],
    "demoSettingsJson": [{ type: core.Input },],
    "pluginEndpointUrl": [{ type: core.Input },],
    "scoreChangeAnimationCompleted": [{ type: core.Output },],
    "scoreChanged": [{ type: core.Output },],
    "modelInfoLinkClicked": [{ type: core.Output },],
    "analyzeCommentResponseChanged": [{ type: core.Output },],
};
var REQUEST_LIMIT_MS = 500;
var LOCAL_STORAGE_SESSION_ID_KEY = 'sessionId';
var ConvaiCheckerModule = /** @class */ (function () {
    function ConvaiCheckerModule() {
    }
    return ConvaiCheckerModule;
}());
ConvaiCheckerModule.decorators = [
    { type: core.NgModule, args: [{
                declarations: [
                    ConvaiChecker,
                    PerspectiveStatus,
                ],
                exports: [
                    ConvaiChecker,
                    PerspectiveStatus
                ],
                imports: [
                    animations.BrowserAnimationsModule,
                    platformBrowser.BrowserModule,
                    forms.FormsModule,
                    http.HttpModule,
                    material.MatButtonModule,
                    formField.MatFormFieldModule,
                    material.MatInputModule,
                    select.MatSelectModule,
                ],
                providers: [PerspectiveApiService, { provide: common.APP_BASE_HREF, useValue: '/' },],
                bootstrap: [ConvaiChecker]
            },] },
];

exports.ConvaiCheckerModule = ConvaiCheckerModule;
exports.DEFAULT_DEMO_SETTINGS = DEFAULT_DEMO_SETTINGS;
exports.ConvaiChecker = ConvaiChecker;
exports.Shape = Shape;
exports.Emoji = Emoji;
exports.Configuration = Configuration;
exports.ConfigurationInput = ConfigurationInput;
exports.ScoreThreshold = ScoreThreshold;
exports.LoadingIconStyle = LoadingIconStyle;
exports.DEFAULT_FEEDBACK_TEXT = DEFAULT_FEEDBACK_TEXT;
exports.PerspectiveStatus = PerspectiveStatus;
exports.ɵa = PerspectiveApiService;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=conversationai-perspectiveapi-authorship-demo.umd.js.map
