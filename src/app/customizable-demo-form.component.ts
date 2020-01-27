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
import * as _ from 'lodash';

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
  sliderScoreNeutralThreshold = ScoreThreshold.NEUTRAL;
  sliderScoreToxicThreshold = ScoreThreshold.TOXIC;
  // Custom score thresholds.
  neutralScoreThreshold = ScoreThreshold.NEUTRAL;
  toxicScoreThreshold = ScoreThreshold.TOXIC;
  customizeScoreThresholds = false;

  /** Loading icon style options. */
  loadingIconStyles = [
    LoadingIconStyle.CIRCLE_SQUARE_DIAMOND,
    LoadingIconStyle.EMOJI,
    LoadingIconStyle.NONE
  ];
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
  // Whether to show feedback for scores below the neutral threshold.
  showFeedbackForLowScores = true;
  // Whether to show feedback for scores above the neutral threshold and below
  // the toxic threshold.
  showFeedbackForNeutralScores = true;
  // The id of the community using the widget.
  communityId = '';
  // The name of the model to use.
  modelName = '';
  // Font family as used in a CSS font-family rule.
  fontFamily = '';

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
          this.neutralScoreThreshold = decodedDemoSettings.neutralScoreThreshold;
          this.toxicScoreThreshold = decodedDemoSettings.toxicScoreThreshold;
        } else {
          this.sliderScoreNeutralThreshold =
            decodedDemoSettings.neutralScoreThreshold;
          this.sliderScoreToxicThreshold =
            decodedDemoSettings.toxicScoreThreshold;
          this.sliderValue = (1 - this.sliderScoreNeutralThreshold) * 100;
        }

        this.showFeedbackForLowScores = decodedDemoSettings.showFeedbackForLowScores;
        this.showFeedbackForNeutralScores = decodedDemoSettings.showFeedbackForNeutralScores;
        this.selectedLoadingIconStyle = decodedDemoSettings.loadingIconStyle;
        this.fontFamily = decodedDemoSettings.fontFamily;
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
    this.sliderScoreNeutralThreshold = (change.source.max - change.value) / 100;
    this.sliderScoreToxicThreshold = (1 + this.sliderScoreNeutralThreshold) / 2;
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
      feedbackText: this.useCustomFeedbackText ?
        this.customFeedbackTextScheme : this.selectedFeedbackTextScheme.feedbackTextSet,
      neutralScoreThreshold: this.customizeScoreThresholds ?
        this.neutralScoreThreshold : this.sliderScoreNeutralThreshold,
      toxicScoreThreshold: this.customizeScoreThresholds ?
        this.toxicScoreThreshold : this.sliderScoreToxicThreshold,
      showFeedbackForLowScores: this.showFeedbackForLowScores,
      showFeedbackForNeutralScores: this.showFeedbackForNeutralScores,
      loadingIconStyle: this.selectedLoadingIconStyle,
      communityId: this.communityId,
      usePluginEndpoint: this.usePluginEndpoint,
      modelName: this.modelName,
      fontFamily: this.fontFamily
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


