import { PerspectiveapiAuthorshipDemo2Page } from './app.po';

describe('perspectiveapi-authorship-demo2 App', () => {
  let page: PerspectiveapiAuthorshipDemo2Page;

  beforeEach(() => {
    page = new PerspectiveapiAuthorshipDemo2Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
