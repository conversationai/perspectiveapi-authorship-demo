import { AfterViewChecked, AfterViewInit, ElementRef, EventEmitter, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { TimelineMax, TweenMax } from 'gsap';
export declare enum Shape {
    CIRCLE = 0,
    SQUARE = 1,
    DIAMOND = 2,
}
export declare enum Emoji {
    SMILE = 0,
    NEUTRAL = 1,
    SAD = 2,
}
export declare enum Configuration {
    DEMO_SITE = 0,
    EXTERNAL = 1,
}
export declare const ConfigurationInput: {
    DEMO_SITE: string;
    EXTERNAL: string;
};
export declare const ScoreThreshold: {
    OKAY: number;
    BORDERLINE: number;
    UNCIVIL: number;
    MAX: number;
};
export declare const LoadingIconStyle: {
    CIRCLE_SQUARE_DIAMOND: string;
    EMOJI: string;
};
export declare const DEFAULT_FEEDBACK_TEXT = "likely to be perceived as \"toxic.\"";
export declare class PerspectiveStatus implements OnChanges, AfterViewInit, AfterViewChecked {
    private ngZone;
    private elementRef;
    indicatorWidth: number;
    indicatorHeight: number;
    configurationInput: string;
    hasScore: boolean;
    fontSize: number;
    gradientColors: string[];
    canAcceptFeedback: boolean;
    feedbackRequestInProgress: boolean;
    feedbackRequestSubmitted: boolean;
    feedbackRequestError: boolean;
    initializeErrorMessage: string;
    feedbackText: [string, string, string];
    scoreThresholds: [number, number, number];
    showPercentage: boolean;
    showMoreInfoLink: boolean;
    analyzeErrorMessage: string | null;
    userFeedbackPromptText: string;
    hideLoadingIconAfterLoad: boolean;
    hideLoadingIconForScoresBelowMinThreshold: boolean;
    alwaysHideLoadingIcon: boolean;
    loadingIconStyle: string;
    scoreChangeAnimationCompleted: EventEmitter<void>;
    modelInfoLinkClicked: EventEmitter<void>;
    commentFeedbackSubmitted: EventEmitter<CommentFeedback>;
    configurationEnum: typeof Configuration;
    configuration: Configuration;
    loadingIconStyleConst: {
        CIRCLE_SQUARE_DIAMOND: string;
        EMOJI: string;
    };
    score: number;
    currentLayerIndex: number;
    private layerAnimationHandles;
    private layerAnimationSelectors;
    private showFeedbackQuestion;
    isLoading: boolean;
    isPlayingLoadingAnimation: boolean;
    isPlayingFadeDetailsAnimation: boolean;
    isPlayingShowOrHideLoadingWidgetAnimation: boolean;
    shouldHideStatusWidget: boolean;
    showScore: boolean;
    currentShape: Shape;
    currentEmoji: Emoji;
    private showingMoreInfo;
    private circleSquareDiamondWidget;
    private emojiWidget;
    private container;
    private smileEmoji;
    private neutralEmoji;
    private sadEmoji;
    private widgetElement;
    private layerTextContainer;
    private interactiveLayerControlsContainer;
    layersAnimating: boolean;
    private layerHeightPixels;
    private updateDemoSettingsAnimation;
    private isPlayingUpdateShapeAnimation;
    private updateStatusWidgetVisibilityAnimation;
    private hideEmojiIconsForLoadingAnimation;
    private widgetReady;
    /** Variables to store state change flags to use in ngAfterViewChecked. */
    private loadingIconStyleChanged;
    private scoreThresholdsChanged;
    private hideLoadingIconAfterLoadChanged;
    private alwaysHideLoadingIconChanged;
    private stateChangeAnimations;
    private isPlayingStateChangeAnimations;
    private pendingPostLoadingStateChangeAnimations;
    private isPlayingPostLoadingStateChangeAnimations;
    private currentStateChangeAnimationId;
    private gradientColorScale;
    constructor(ngZone: NgZone, elementRef: ElementRef);
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    /**
     * Make any animation changes that require ViewChild updates in this lifecycle
     * callback, to ensure that the ViewChild has been updated.
     */
    ngAfterViewChecked(): void;
    getFirstGradientRatio(): number;
    getAdjustedGradientControlPoints(gradientPointCount: number): number[];
    /**
     * Updates the gradient color scale for the shape based on the
     * scoreThresholds.
     */
    updateGradient(): void;
    interpolateColors(score: number): string;
    private updateWidgetElement();
    private getShouldHideStatusWidget(loadStart);
    private getUpdateStatusWidgetVisibilityAnimation(loadStart);
    private getChangeLoadingIconVisibilityAnimation(hide);
    private getSetIconToNeutralStateAnimation();
    private getChangeLoadingIconXValueAnimation(hide);
    private getConfigurationFromInputString(inputString);
    private updateLayerElementContainers();
    shouldShowFeedback(score: number): boolean;
    parseEmojis(text: string): any;
    getFeedbackTextForScore(score: number): string;
    feedbackContainerClicked(): void;
    feedbackCompleted(success: boolean): void;
    hideFeedbackQuestion(): void;
    resetFeedback(): void;
    resetLayers(): void;
    submitFeedback(commentIsToxic: boolean): void;
    getResetRotationAnimation(): TweenMax;
    getShapeForScore(score: number): Shape;
    getEmojiForScore(score: number): Emoji;
    getUpdateShapeAnimation(score: number): TimelineMax;
    setShowMoreInfo(showMoreInfo: boolean): void;
    getAccessibilityDescriptionForEmoji(emoji: Emoji): string;
    getEmojiElementFromEmojiType(emojiType: Emoji): HTMLElement;
    getAnimationA11yLabel(loadingIconStyle: string, isPlayingLoadingAnimation: boolean): string;
    notifyModelInfoLinkClicked(): void;
    getUpdateWidgetStateAnimation(): TimelineMax;
    notifyScoreChange(score: number): void;
    setLoading(loading: boolean): void;
    getChangeOpacityAnimation(element: HTMLElement, timeSeconds: number, opacity: number): TweenMax;
    getShowEmojiAnimation(): TimelineMax;
    getHideEmojisAnimation(): TimelineMax;
    /** Loading animations to play before loading starts for emoji-style loading. */
    getStartAnimationsForEmojiWidgetLoading(): TimelineMax;
    /** Loopable loading animations to play for emoji-style loading. */
    getLoopAnimationForEmojiWidgetLoading(): TimelineMax;
    /** Loading animations to play when loading finishes for emoji-style loading. */
    getEndAnimationsForEmojiWidgetLoading(loadingTimeline: TimelineMax): TimelineMax;
    /**
     * Loading animations to play before loading starts for
     * circle/square/diamond-style loading.
     */
    getStartAnimationsForCircleSquareDiamondWidgetLoading(): TimelineMax;
    /**
     * Main loading animation to play on loop for the circle/square/diamond style
     * loading.
     */
    getLoopAnimationsForCircleSquareDiamondWidgetLoading(): TimelineMax;
    /**
     * Loading animations to play when loading finishes for
     * circle/square/diamond-style loading.
     */
    getEndAnimationsForCircleSquareDiamondWidgetLoading(loadingTimeline: TimelineMax): TimelineMax;
    setLoadingForEmojiWidget(loading: boolean): void;
    setLoadingForDefaultWidget(loading: boolean): void;
    private getNameFromShape(shape);
    private getAccessibilityDescriptionForShape(shape);
    private getUpdateGradientColorAnimation(timeSeconds);
    private getChangeColorAnimation(timeSeconds, color);
    private getTransitionToCircleAnimation(timeSeconds, endColor?);
    private getTransitionToSquareAnimation(timeSeconds);
    private getTransitionToDiamondAnimation(timeSeconds);
    private getRotateBackAndForthAnimation(timeSeconds, degrees);
    private getToFullScaleBounceAnimation(timeSeconds);
    private getToFullScaleAnimation(timeSeconds);
    private getToFullScaleCompleteRotationAnimation(timeSeconds, fromShape);
    private getTransitionToLayerAnimation(endLayerIndex, timeSeconds);
    private getShiftLayerVerticallyAnimation(layer, timeSeconds, startY, endY, fadeIn);
    private getCircleAnimation(timeSeconds, endColor?);
    private getSquareAnimation(timeSeconds);
    private getDiamondAnimation(timeSeconds);
    private getToGrayScaleAnimation(timeSeconds);
    private getFadeAndShrinkAnimation(timeSeconds, repeat);
    private getFadeDetailsAnimation(timeSeconds, hide, layerIndex);
}
export interface CommentFeedback {
    commentMarkedAsToxic: boolean;
}
