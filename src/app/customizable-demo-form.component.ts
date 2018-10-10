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

const RAISED_EYEBROW_EMOJI = "🤨 ";

/** Settings about the UI state that should be encoded in the URL. */
export interface UISettings {
  useCustomColorScheme: boolean,
  useCustomFeedbackText: boolean,
  customizeScoreThresholds: boolean,
  showDemoSettings: boolean
};

/** Describes a configuration for demo colors. */
export interface ColorScheme {
  name: string,
  colors: string[],
};

/** Names of color scheme options for the checker. */
const ColorSchemes = {
  DEFAULT: 'default',
  TRAFFIC_LIGHT: 'traffic lights',
};

/** Arrays of colors that can be used as colors in a ColorScheme. */
const DEFAULT_COLORS = ["#25C1F9", "#7C4DFF", "#D400F9"];
const TRAFFIC_LIGHT_COLORS = ["#4CAF50", "#FDD835", "#D50000"];

/** Describes a configuration for feedback text to use in the demo. */
export interface FeedbackTextScheme {
  name: string,
  feedbackTextSet: [string, string, string],
};

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
export class CustomizableDemoForm implements OnInit {
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
  sliderValue: number = (1 - ScoreThreshold.BORDERLINE) * 100;
  // Score thresholds determined from the slider value.
  sliderScoreThresholds: [number, number, number] = [
    ScoreThreshold.BORDERLINE,
    ScoreThreshold.BORDERLINE,
    ScoreThreshold.UNCIVIL
  ];
  // Custom score thresholds.
  scoreThresholds: [number, number, number] = [
    ScoreThreshold.OKAY,
    ScoreThreshold.BORDERLINE,
    ScoreThreshold.UNCIVIL
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

  /** Configuration (correction UI) options. */

  // Configuration options for the checker that determine the style of the UI
  // for submitting corrections for bad scores.
  configurations = [ConfigurationInput.DEMO_SITE, ConfigurationInput.EXTERNAL];
  // Configuration selected from the dropdown menu.
  configuration: string = 'default';

  /** Other settings. */

  // Whether to use gapi to make direct API calls instead of going through the
  // server. Requires an API key.
  useGapi: boolean = false;
  // Whether to use the endpoint for the plugin.
  usePluginEndpoint = false;
  // URL to use for the plugin endpoint (for debugging and local tests).
  pluginEndpointUrl = '';
  // API key to use when making gapi calls.
  apiKey: string = '';
  // Whether to show the percentage next to the feedback text.
  showPercentage = true;
  // Whether to show a "more info" link next to the feedback text.
  showMoreInfoLink = true;
  // The text to use to prompt users to submit feedback.
  userFeedbackPromptText = 'Seem wrong?';
  // Whether to hide the loading icon after loading completes.
  hideLoadingIconAfterLoad = false;
  // Whether to hide the loading icon when the score is below the minimum
  // threshold to show feedback.
  hideLoadingIconForScoresBelowMinThreshold = false;
  // Whether to always hide the loading icon.
  alwaysHideLoadingIcon = false;
  // The id of the community using the widget.
  communityId = '';
  // The name of the model to use.
  modelName = '';

  demoSettings: DemoSettings|null = null;
  demoSettingsJson: string = '';
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
        this.configuration = decodedDemoSettings.configuration;
        if (this.useCustomColorScheme) {
          this.customColorScheme = decodedDemoSettings.gradientColors;
        } else {
          // If the color setting wasn't custom, then it must be one of the ones
          // in our selection list. Iterate over the color schemes in the
          // selection list and find the one that equals the color scheme passed
          // in via the URL parameters.
          for (let i = 0; i < this.colorSchemes.length; i++) {
            let colorScheme = this.colorSchemes[i];
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
            let feedbackTextScheme = this.feedbackTextSchemes[i];
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
          this.sliderValue = (1 - this.sliderScoreThresholds[1]) * 100;
        }

        this.showPercentage = decodedDemoSettings.showPercentage;
        this.showMoreInfoLink = decodedDemoSettings.showMoreInfoLink;
        this.useGapi = decodedDemoSettings.useGapi;
        this.apiKey = decodedDemoSettings.apiKey;
        this.hideLoadingIconAfterLoad = decodedDemoSettings.hideLoadingIconAfterLoad;
        this.hideLoadingIconForScoresBelowMinThreshold =
          decodedDemoSettings.hideLoadingIconForScoresBelowMinThreshold;
        this.userFeedbackPromptText = decodedDemoSettings.userFeedbackPromptText;
        this.alwaysHideLoadingIcon = decodedDemoSettings.alwaysHideLoadingIcon;
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

  /** Clears the API key field when the "Use gapi" option is toggled off. */
  updateApiKey(event: MatSlideToggleChange) {
    if (!event.checked) {
      this.apiKey = '';
    }
  }

  /**
   * Updates the score thresholds from the slider value.
   * When using the slider, the first two thresholds should be the same, as the
   * minimum score to show feedback is also the threshold for medium toxicity
   * (by default that there is no desired feedback text for low toxicity). The
   * threshold for high toxicity is the average of the threshold for medium
   * toxicity and the max toxicity score.
   *
   * Note that the slider is inverted for UI reasons, which is why each value
   * is subtracted from the max slider value. Values are also divided by 100 to
   * fall between 0 and 1.
   */
  onSliderValueChange(change: MatSliderChange) {
    this.sliderScoreThresholds[0] = (change.source.max - change.value) / 100;
    this.sliderScoreThresholds[1] = (change.source.max - change.value) / 100;
    this.sliderScoreThresholds[2] = (1 + this.sliderScoreThresholds[1]) / 2;
  }

  onSettingsChanged() {
    let newDemoSettings = this.getDemoSettings();
    let newUISettings = this.getUISettings();
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
      configuration: this.configuration,
      gradientColors: this.useCustomColorScheme ?
        this.customColorScheme : this.selectedColorScheme.colors,
      showPercentage: this.showPercentage,
      showMoreInfoLink: this.showMoreInfoLink,
      feedbackText: this.useCustomFeedbackText ?
        this.customFeedbackTextScheme : this.selectedFeedbackTextScheme.feedbackTextSet,
      scoreThresholds: this.customizeScoreThresholds ?
        this.scoreThresholds : this.sliderScoreThresholds,
      useGapi: this.useGapi,
      apiKey: this.apiKey,
      hideLoadingIconAfterLoad: this.hideLoadingIconAfterLoad,
      hideLoadingIconForScoresBelowMinThreshold:
        this.hideLoadingIconForScoresBelowMinThreshold,
      userFeedbackPromptText: this.userFeedbackPromptText,
      alwaysHideLoadingIcon: this.alwaysHideLoadingIcon,
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


