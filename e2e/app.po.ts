import {browser, element, by} from 'protractor';

export class PerspectiveapiAuthorshipDemo2Page {
  navigateTo() {
    return browser.get('/');
  }

  getText(selector: string) {
    return element(by.css(selector)).getText();
  }
}
