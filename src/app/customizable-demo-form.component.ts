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
  OnInit,
} from '@angular/core';
import {MatSlideToggleChange, MatSliderChange} from '@angular/material';
import {DemoSettings} from './modules/convai-checker/convai-checker.component';
import {
  ConfigurationInput,
  LoadingIconStyle,
  ScoreThreshold,
  DEFAULT_FEEDBACK_TEXT
} from './modules/convai-checker/perspective-status.component';
import {ActivatedRoute, Params, Router} from '@angular/router';
import emoji from 'node-emoji';
import * as _ from 'lodash';

const RAISED_EYEBROW_EMOJI = '🤨 ';

/** Settings about the UI state that should be encoded in the URL. */
export interface UISettings {
  useCustomColorScheme: boolean;
  useCustomFeedbackText: boolean;
  customizeScoreThresholds: boolean;
  showDemoSettings: boolean;
}

/** Describes a configuration for demo colors. */
export interface ColorScheme {
  name: string;
  colors: string[];
}

/** Names of color scheme options for the checker. */
const ColorSchemes = {
  DEFAULT: 'default',
  TRAFFIC_LIGHT: 'traffic lights',
};

/** Arrays of colors that can be used as colors in a ColorScheme. */
const DEFAULT_COLORS = ['#25C1F9', '#7C4DFF', '#D400F9'];
const TRAFFIC_LIGHT_COLORS = ['#4CAF50', '#FDD835', '#D50000'];

/** Describes a configuration for feedback text to use in the demo. */
export interface FeedbackTextScheme {
  name: string;
  feedbackTextSet: [string, string, string];
}

/** Names of feedback text options for the checker. */
const TextFeedbackSchemes = {
  DEFAULT_FEEDBACK_TEXT: DEFAULT_FEEDBACK_TEXT,
  PLEASE_REVIEW_FEEDBACK_TEXT: 'Please review before posting.',
  EMOJI: 'Emoji',
};

/**
 * Arrays of feedback text strings that can be used as a feedbackTextSet in a
 * FeedbackTextScheme.
 */
const DEFAULT_FEEDBACK_TEST_SET: [string, string, string] = [
  DEFAULT_FEEDBACK_TEXT,
  DEFAULT_FEEDBACK_TEXT,
  DEFAULT_FEEDBACK_TEXT
];

const PLEASE_REVIEW_FEEDBACK_TEST_SET: [string, string, string] = [
  TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT,
  TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT,
  TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT
];

const EMOJIES: [string, string, string] = [
  emoji.emojify(':blush: :smile: :smiley:'),
  emoji.emojify(RAISED_EYEBROW_EMOJI + ' :neutral_face: :thinking_face:'),
  emoji.emojify(':cry: :scream: :angry:'),
];

function arraysEqual<T>(array1: T[], array2: T[]): boolean {
  return array1.length === array2.length &&
    array1.every((element, index) => element === array2[index]);
}


@Component({
  selector: 'customizable-demo-form',
  templateUrl: './customizable-demo-form.component.html',
  styleUrls: ['./customizable-demo-form.component.css'],
})
export class CustomizableDemoFormComponent implements OnInit {
  /** Whether to show the expanded demo settings. */
  showDemoSettings = true;

  /** Color scheme options. */
  colorSchemes: ColorScheme[] = [
    {name: ColorSchemes.DEFAULT, colors: DEFAULT_COLORS},
    {name: ColorSchemes.TRAFFIC_LIGHT, colors: TRAFFIC_LIGHT_COLORS},
  ];
  // Color scheme selected from the dropdown menu.
  selectedColorScheme: ColorScheme = this.colorSchemes[0];
  useCustomColorScheme = false;
  // Color scheme selected with the color pickers.
  customColorScheme = DEFAULT_COLORS.slice();

  /** Score threshold options. */
  // Value of the slider; note that the slider is inverted for stylistic
  // reasons, so when using this value take 100 - sliderValue.
  sliderValue: number = (1 - ScoreThreshold.NEUTRAL) * 100;
  // Score thresholds determined from the slider value.
  sliderScoreThresholds: [number, number] = [
    ScoreThreshold.NEUTRAL,
    ScoreThreshold.TOXIC
  ];
  // Custom score thresholds.
  scoreThresholds: [number, number] = [
    ScoreThreshold.NEUTRAL,
    ScoreThreshold.TOXIC
  ];
  customizeScoreThresholds = false;

  /** Loading icon style options. */
  loadingIconStyles =
    [LoadingIconStyle.CIRCLE_SQUARE_DIAMOND, LoadingIconStyle.EMOJI];
  selectedLoadingIconStyle = LoadingIconStyle.CIRCLE_SQUARE_DIAMOND;

  /** Feedback text options. */
  feedbackTextSchemes: FeedbackTextScheme[] = [
    {
      name: TextFeedbackSchemes.DEFAULT_FEEDBACK_TEXT,
      feedbackTextSet: DEFAULT_FEEDBACK_TEST_SET
    },
    {
      name: TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT,
      feedbackTextSet: PLEASE_REVIEW_FEEDBACK_TEST_SET,
    },
    {
      name: TextFeedbackSchemes.EMOJI,
      feedbackTextSet: EMOJIES
    }
  ];
  // FeedbackTextScheme selected from the dropdown menu.
  selectedFeedbackTextScheme: FeedbackTextScheme = this.feedbackTextSchemes[0];
  // Custom FeedbackTextScheme specified by user input.
  customFeedbackTextScheme: [string, string, string] = DEFAULT_FEEDBACK_TEST_SET;
  useCustomFeedbackText = false;

  /** Other settings. */

  // Whether to use the endpoint for the plugin.
  usePluginEndpoint = false;
  // URL to use for the plugin endpoint (for debugging and local tests).
  pluginEndpointUrl = '';
  // Whether to show the percentage next to the feedback text.
  showPercentage = true;
  // Whether to show a "more info" link next to the feedback text.
  showMoreInfoLink = true;
  // The text to use to prompt users to submit feedback.
  userFeedbackPromptText = 'Seem wrong?';
  // Whether to show feedback for scores below the neutral threshold.
  showFeedbackForLowScores = true;
  // Whether to show feedback for scores above the neutral threshold and below
  // the toxic threshold.
  showFeedbackForNeutralScores = true;
  // The id of the community using the widget.
  communityId = '';
  // The name of the model to use.
  modelName = '';

  demoSettings: DemoSettings|null = null;
  demoSettingsJson = '';
  uiSettings: UISettings|null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      if (params['uiSettings']) {
        const decodedUISettings: UISettings = JSON.parse(
              decodeURIComponent(params['uiSettings'] as string));
        this.useCustomColorScheme = decodedUISettings.useCustomColorScheme;
        this.useCustomFeedbackText = decodedUISettings.useCustomFeedbackText;
        this.customizeScoreThresholds = decodedUISettings.customizeScoreThresholds;
        this.showDemoSettings = decodedUISettings.showDemoSettings;
      }
      if (params['encodedDemoSettings']) {
        const decodedDemoSettings: DemoSettings = JSON.parse(
            decodeURIComponent(params['encodedDemoSettings'] as string));
        console.debug('I see demo settings in the url:', decodedDemoSettings);
        if (this.useCustomColorScheme) {
          this.customColorScheme = decodedDemoSettings.gradientColors;
        } else {
          // If the color setting wasn't custom, then it must be one of the ones
          // in our selection list. Iterate over the color schemes in the
          // selection list and find the one that equals the color scheme passed
          // in via the URL parameters.
          for (let i = 0; i < this.colorSchemes.length; i++) {
            const colorScheme = this.colorSchemes[i];
            if (arraysEqual(
              colorScheme.colors, decodedDemoSettings.gradientColors)) {
              this.selectedColorScheme = this.colorSchemes[i];
            }
          }
        }

        if (this.useCustomFeedbackText) {
          this.customFeedbackTextScheme = decodedDemoSettings.feedbackText;
        } else {
          // If the feedback text setting wasn't custom, then it must be one of
          // the ones in our selection list. Iterate over the feedback text
          // schemes in the selection list and find the one that equals the
          // feedback text passed in via the URL parameters.
          for (let i = 0; i < this.feedbackTextSchemes.length; i++) {
            const feedbackTextScheme = this.feedbackTextSchemes[i];
            if (arraysEqual(feedbackTextScheme.feedbackTextSet,
                            decodedDemoSettings.feedbackText)) {
              this.selectedFeedbackTextScheme = this.feedbackTextSchemes[i];
            }
          }
        }

        if (this.customizeScoreThresholds) {
          this.scoreThresholds = decodedDemoSettings.scoreThresholds;
        } else {
          this.sliderScoreThresholds = decodedDemoSettings.scoreThresholds;
          this.sliderValue = (1 - this.sliderScoreThresholds[0]) * 100;
        }

        this.showPercentage = decodedDemoSettings.showPercentage;
        this.showMoreInfoLink = decodedDemoSettings.showMoreInfoLink;
        this.showFeedbackForLowScores = decodedDemoSettings.showFeedbackForLowScores;
        this.showFeedbackForNeutralScores = decodedDemoSettings.showFeedbackForNeutralScores;
        this.userFeedbackPromptText = decodedDemoSettings.userFeedbackPromptText;
        this.selectedLoadingIconStyle = decodedDemoSettings.loadingIconStyle;
      }
    });
    this.demoSettings = this.getDemoSettings();
    this.demoSettingsJson = JSON.stringify(this.demoSettings);
    this.uiSettings = this.getUISettings();
    console.debug('Updating this.demoSettings (init)', this.demoSettings);
  }

  /** Resets the custom color scheme UI to use the default color scheme. */
  resetToDefaultColors() {
    this.customColorScheme = DEFAULT_COLORS.slice();
  }

  /**
   * Updates the score thresholds from the slider value.
   * When using the slider, the position of the slider value equals the
   * threshold for a neutral toxicity score. The threshold for high toxicity is
   * the average of the threshold for neutral toxicity and the max toxicity
   * score.
   *
   * Note that the slider is inverted for UI reasons, which is why each value
   * is subtracted from the max slider value. Values are also divided by 100 to
   * fall between 0 and 1.
   */
  onSliderValueChange(change: MatSliderChange) {
    this.sliderScoreThresholds[0] = (change.source.max - change.value) / 100;
    this.sliderScoreThresholds[1] = (1 + this.sliderScoreThresholds[0]) / 2;
  }

  onSettingsChanged() {
    const newDemoSettings = this.getDemoSettings();
    const newUISettings = this.getUISettings();
    if (!_.isEqual(this.demoSettings, newDemoSettings)
        || !_.isEqual(this.uiSettings, newUISettings)) {
      console.debug('Updating this.demoSettings', newDemoSettings);
      console.debug('Updating this.uiSettings', newUISettings);
      this.demoSettings = newDemoSettings;
      this.demoSettingsJson = JSON.stringify(this.demoSettings);
      this.uiSettings = newUISettings;

      const encodedUISettings =
        encodeURIComponent(JSON.stringify(this.uiSettings));
      const encodedDemoSettings =
        encodeURIComponent(JSON.stringify(this.demoSettings));

      this.router.navigate(
        ['/customize', encodedUISettings, encodedDemoSettings]);
    } else {
      console.debug(
        'Calling onSettingsChanged(), but settings are unchanged', newDemoSettings);
    }
  }

  /**
   * Note: This function must be called to update this.demoSettings for Angular
   * to notice the change, because Angular will only call change detection if
   * the entire object has changed, and will not listen to sub-properties by
   * default.
   */
  private getDemoSettings(): DemoSettings {
    return JSON.parse(JSON.stringify({
      gradientColors: this.useCustomColorScheme ?
        this.customColorScheme : this.selectedColorScheme.colors,
      showPercentage: this.showPercentage,
      showMoreInfoLink: this.showMoreInfoLink,
      feedbackText: this.useCustomFeedbackText ?
        this.customFeedbackTextScheme : this.selectedFeedbackTextScheme.feedbackTextSet,
      scoreThresholds: this.customizeScoreThresholds ?
        this.scoreThresholds : this.sliderScoreThresholds,
      showFeedbackForLowScores: this.showFeedbackForLowScores,
      showFeedbackForNeutralScores: this.showFeedbackForNeutralScores,
      userFeedbackPromptText: this.userFeedbackPromptText,
      loadingIconStyle: this.selectedLoadingIconStyle,
      communityId: this.communityId,
      usePluginEndpoint: this.usePluginEndpoint,
      modelName: this.modelName
    }));
  }

  private getUISettings(): UISettings {
    return {
      useCustomColorScheme: this.useCustomColorScheme,
      useCustomFeedbackText: this.useCustomFeedbackText,
      customizeScoreThresholds: this.customizeScoreThresholds,
      showDemoSettings: this.showDemoSettings
    };
  }
}


