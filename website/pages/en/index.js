/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
    render() {
        const {siteConfig, language = ''} = this.props;
        const {baseUrl, docsUrl} = siteConfig;
        const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
        const langPart = `${language ? `${language}/` : ''}`;
        const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

        const SplashContainer = props => (
            <div className="homeContainer">
                <div className="homeSplashFade">
                    <div className="wrapper homeWrapper">{props.children}</div>
                </div>
            </div>
        );

        const Logo = props => (
            <div className="projectLogo">
                <img src={props.img_src} alt="Project Logo" />
            </div>
        );

        const ProjectTitle = () => (
            <h2 className="projectTitle">
                {siteConfig.title}
                <small>{siteConfig.tagline}</small>
            </h2>
        );

        const PromoSection = props => (
            <div className="section promoSection">
                <div className="promoRow">
                    <div className="pluginRowBlock">{props.children}</div>
                </div>
            </div>
        );

        const Button = props => (
            <div className="pluginWrapper buttonWrapper">
                <a className="button" href={props.href} target={props.target}>
                    {props.children}
                </a>
            </div>
        );

        return (
            <SplashContainer>
                <Logo img_src={`${baseUrl}img/undraw_breaking_barriers_vnf3.svg`} />
                <div className="inner">
                    <ProjectTitle siteConfig={siteConfig} />
                    <PromoSection>
                        <Button href={docUrl('installing-elsa-core')}>Get Started</Button>
                    </PromoSection>
                </div>
            </SplashContainer>
        );
    }
}

class Index extends React.Component {
    render() {
        const {config: siteConfig, language = ''} = this.props;
        const {baseUrl} = siteConfig;

        const Block = props => (
            <Container
                padding={['bottom', 'top']}
                id={props.id}
                background={props.background}>
                <GridBlock
                    align={props.align || "left"}
                    contents={props.children}
                    layout={props.layout}
                    className={props.className}
                />
            </Container>
        );

        const ManageWorkflows = () => (
            <Block background="light">
                {[
                    {
                        content: 'Workflows can be defined using plain C# code. In addition to an increasing number of activities that you can choose from, Elsa is designed to be extensible with your own **custom activities**.',
                        image: `${baseUrl}img/undraw_data_trends_b0wg.svg`,
                        imageAlign: 'right',
                        title: 'Manage Workflows using the ASP.NET Core Dashboard Middleware',
                    },
                ]}
            </Block>
        );

        const DesignWorkflows = () => (
            <Block id="try">
                {[
                    {
                        content:
                            `The Workflow Designer is a **100% client-side web component** that can be **re-used** in any application, and allows you to easily design workflows. Workflows can be exported as JSON files, which can then be executed using the Elsa Core API.`,
                        image: `${baseUrl}img/undraw_software_engineer_lvl5.svg`,
                        imageAlign: 'left',
                        title: 'Design workflows using the reusable HTML5 Workflow Designer',
                    },
                ]}
            </Block>
        );

        const WorkflowsByCode = () => (
            <Block background="light">
                {[
                    {
                        content: 'Workflows can be defined using plain C# code. In addition to an increasing number of activities that you can choose from, Elsa is designed to be extensible with your own **custom activities**.\n\n' +
                            '```csharp\n' +
                            'public class HelloWorldWorkflow : IWorkflow\n' +
                            '{\n' +
                            '    public void Build(IWorkflowBuilder builder)\n' +
                            '    {\n' +
                            '        builder\n' +
                            '            .StartWith<HelloWorld>()\n' +
                            '            .Then<GoodByeWorld>();\n' +
                            '    }\n' +
                            '}\n' +
                            '```' +
                            '\n\n' +
                            'Short-running Workflows can be useful to implement a business rules engine, while long-running workflows greatly simplify the implementation of complex processes that involve coordinating between multiple agents (users & machines).',
                        image: `${baseUrl}img/undraw_Designer_by46.svg`,
                        imageAlign: 'right',
                        title: 'Craft workflows using C#',
                    },
                ]}
            </Block>
        );

        const Headlines = () => (
            <Block layout="threeColumn" className="feature-block">
                {[
                    {
                        content: 'Build workflows **in code** using the **fluent API** or **as data** using **JSON** or **YAML** syntax. Or use the **workflow designer** to design executable workflows visually.\n\n' +
                            'Elsa comes with an ASP.NET Core area that provides a **dashboard** to manage workflows and activities.',
                        title: 'Build',
                    },
                    {
                        content: 'Run workflows from within your application using simple to use APIs.\n\n' +
                            'Start or resume workflows manually, or automatically by invoking triggers.',
                        title: 'Run'
                    },
                    {
                        content: 'Make it your own by **extending** the set of activities with your own.\n\n' +
                            'Implementing custom activities allows for powerful workflows that can be implemented with ease.',
                        title: 'Extend'
                    }
                ]}
            </Block>
        );
        
        return (
            <div>
                <HomeSplash siteConfig={siteConfig} language={language} />
                <div className="mainContainer">
                    <Headlines />
                    <WorkflowsByCode />
                    <DesignWorkflows />
                    <ManageWorkflows />
                </div>
            </div>
        );
    }
}

module.exports = Index;
