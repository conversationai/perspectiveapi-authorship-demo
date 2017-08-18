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
} from '@angular/core';
import {MdSlideToggleChange, MdSliderChange} from '@angular/material';
import {DemoSettings} from './convai-checker.component';
import {
  ConfigurationInput,
  ScoreThreshold,
  DEFAULT_FEEDBACK_TEXT
} from './perspective-status.component';
import emoji from 'node-emoji';
import twemoji from 'twemoji';

const RAISED_EYEBROW_EMOJI = "🤨 ";

const EMOJIES: [string, string, string] = [
  twemoji.parse(emoji.emojify(':blush: :smile: :smiley:')),
  twemoji.parse(emoji.emojify(RAISED_EYEBROW_EMOJI + ' :neutral_face: :thinking_face:')),
  twemoji.parse(emoji.emojify(':cry: :scream: :angry:')),
];

const ColorSchemes = {
  DEFAULT: 'default',
  TRAFFIC_LIGHT: 'traffic lights',
};

const TextFeedbackSchemes = {
  DEFAULT_FEEDBACK_TEXT: DEFAULT_FEEDBACK_TEXT,
  PLEASE_REVIEW_FEEDBACK_TEXT: 'Please review before posting.',
  EMOJI: 'Emoji',
};

interface ColorScheme {
  name: string,
  colors: string[],
};

interface FeedbackTextScheme {
  name: string,
  feedbackTextSet: [string, string, string],
};

@Component({
  selector: 'customizable-demo-form',
  templateUrl: './customizable-demo-form.component.html',
  styleUrls: ['./customizable-demo-form.component.css'],
})
export class CustomizableDemoForm {
  // Color scheme
  defaultColors = ["#25C1F9", "#7C4DFF", "#D400F9"];
  trafficLightColors = ["#4CAF50", "#FDD835", "#D50000"];

  colorSchemes: ColorScheme[] = [
    {name: ColorSchemes.DEFAULT, colors: this.defaultColors},
    {name: ColorSchemes.TRAFFIC_LIGHT, colors: this.trafficLightColors},
  ];
  selectedColorScheme: ColorScheme = this.colorSchemes[0];
  useCustomColorScheme = false;
  customColorScheme = this.defaultColors.slice();

  // Score thresholds
  customizeScoreThresholds = false;
  sliderValue: number = 100 - (ScoreThreshold.BORDERLINE * 100);
  scoreThresholds: [number, number, number] = [
    ScoreThreshold.OKAY,
    ScoreThreshold.BORDERLINE,
    ScoreThreshold.UNCIVIL
  ];
  sliderScoreThresholds: [number, number, number] = [
    ScoreThreshold.BORDERLINE,
    ScoreThreshold.BORDERLINE,
    ScoreThreshold.UNCIVIL
  ];

  // Feedback text.
  defaultFeedbackTextSet: [string, string, string] = [
    DEFAULT_FEEDBACK_TEXT,
    DEFAULT_FEEDBACK_TEXT,
    DEFAULT_FEEDBACK_TEXT
  ];
  pleaseReviewFeedbackTextSet: [string, string, string] = [
    TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT,
    TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT,
    TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT
  ];
  emojiFeedbackTextSet: [string, string, string] = [
    "😊", "😐", "😱"
  ];
  feedbackTextSchemes: FeedbackTextScheme[] = [
    {
      name: TextFeedbackSchemes.DEFAULT_FEEDBACK_TEXT,
      feedbackTextSet: this.defaultFeedbackTextSet
    },
    {
      name: TextFeedbackSchemes.PLEASE_REVIEW_FEEDBACK_TEXT,
      feedbackTextSet: this.pleaseReviewFeedbackTextSet,
    },
    {
      name: TextFeedbackSchemes.EMOJI,
      feedbackTextSet: EMOJIES
    }
  ];
  selectedFeedbackTextScheme: FeedbackTextScheme = this.feedbackTextSchemes[0];
  customFeedbackTextScheme: [string, string, string] = this.defaultFeedbackTextSet;
  useCustomFeedbackText = false;

  // Other settings.
  useGapi: boolean = false;
  apiKey: string = '';
  showPercentage = true;
  showMoreInfoLink = true;

  configurations = [ConfigurationInput.DEMO_SITE, ConfigurationInput.EXTERNAL];
  configuration: string = 'default';

  constructor() {
    console.log('EMOJIES');
    console.log(EMOJIES);
  }

  resetToDefaultColors() {
    this.customColorScheme = this.defaultColors.slice();
  }

  /** Clears the API key field when the "Use gapi" option is toggled off. */
  updateApiKey(event: MdSlideToggleChange) {
    if (!event.checked) {
      this.apiKey = '';
    }
  }

  /** The slider is inverted for UI reasons; subtract each value from the max. */
  onSliderValueChange(change: MdSliderChange) {
    this.sliderScoreThresholds[0] = (change.source.max - change.value) / 100;
    this.sliderScoreThresholds[1] = (change.source.max - change.value) / 100;
    this.sliderScoreThresholds[2] = (1 + this.sliderScoreThresholds[1]) / 2;
  }

  /**
   * Use a function to get the demo settings rather than storing it in a member
   * variable because Angular will only call change detection if the entire
   * object has changed, and will not listen to sub-properties by default.
   */
  getDemoSettings() {
    return {
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
    };
  }
}
