import {PerspectiveapiAuthorshipDemo2Page} from './app.po';

describe('perspectiveapi-authorship-demo2 App', () => {
  let page: PerspectiveapiAuthorshipDemo2Page;

  beforeEach(() => {
    page = new PerspectiveapiAuthorshipDemo2Page();
  });

  it('should navigate to and render the demo page', () => {
    page.navigateTo();
    page.getText('.demoTitle').then((text) => {
      expect(text).toEqual('Perspective Experiment');
    });
  });
});
