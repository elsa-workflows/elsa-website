/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    return `${baseUrl}${docsPart}${langPart}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="50"
                height="50"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl('next/installation/installing-elsa-core')}>
              Getting Started
            </a>
            <a href={this.docUrl('next/concepts/concepts-workflows')}>
              Concepts
            </a>
            <a href={this.docUrl('next/quickstarts/quickstarts-console-hello-world')}>
              Quickstarts
            </a>
            <a href={this.docUrl('next/guides/guides-recurring-tasks')}>
              Guides
            </a>
          </div>
          <div>
            <h5>Community</h5>
            {/*<a href={this.pageUrl('users.html', this.props.language)}>*/}
            {/*  User Showcase*/}
            {/*</a>*/}
            <a
              href="https://stackoverflow.com/questions/tagged/elsa-workflows"
              target="_blank"
              rel="noreferrer noopener">
              Stack Overflow
            </a>
            <a
                href="https://discord.gg/hhChk5H472"
                target="_blank"
                rel="noreferrer noopener">
              Discord
            </a>
          </div>
          <div>
            <h5>More</h5>
            {/*<a href={`${this.props.config.baseUrl}blog`}>Blog</a>*/}
            <a href={this.props.config.repoUrl}>GitHub</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/facebook/docusaurus/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub">
              Star
            </a>
          </div>
        </section>

        <a
          href="https://dotnetfoundation.org"
          target="_blank"
          rel="noreferrer noopener"
          className="dotnetfoundation"
          title="Supported by the .NET Foundation">
          <img
            src={`${this.props.config.baseUrl}img/dotnetfoundation.png`}
            alt="Supported by the .NET Foundation"
            width="100"
            height="100"
          />
        </a>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    );
  }
}

module.exports = Footer;
