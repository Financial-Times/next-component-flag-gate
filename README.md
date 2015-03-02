# next-component-flag-gate
Interface for applying feature flags to features contained within components

## Motivation

When we include feature flag states explicitly within components it causes several problems

 - Makes it harder to reuse the component in different contexts where the desired behaviour should vary
 - Makes it harder to understand the component because flags affecting a component can be referenced in a product, in the component's js or in its templates. When used in templates this also leads to nested conditionals making the html harder to read and edit
 - Makes it harder to set up standalone demos exemplifying sifferent possible states of the component
 - Makes the path to converting it into an origami component harder

But taking flags out of components, and replacing them with config options, would lead to a lot of duplication of work (e.g. defining that `flags.get('video').isSwithcedOff` should turn off videos over and over again)

This module aims to provide a single place to define how flags should affect components, with a clear, easy to override interface available on both client and server side


## Usage

### Defining flag mappings

Each component may define an options object to be passed into it on initialisation e.g.


```javascript
{
	hasVideo: true,
	hasSummary: true,
	isSaveable: false
}
```

To allow flags to override these settings an entry must exist in this modules `models/components.js` file. In general use a camel-cased name, excluding common words such as 'next' and 'component'. For some or all of the properties accepted by the component's config add one the following.

* An object which may have 2 properties, 'off' and 'on', and each of which contains either a single flagname as a string, or an array of flagnames, all of which need to be on (or off, as appropriate) for the property to be allowed to be on
* A function, which expects an instance of the feature flags client as a parameter, and which returns a boolean

e.g.

``` javascript
{
	hasVideo: {on: 'brightcoveApi'},
	hasSummary: {on: ['wordyArticleCards', 'capi2Summaries'], off: 'visuallyEnhancedCards'},
	isSaveable: function (flags) {
		return flags.get('userPreferences').isSwitchedOn && (flags.get('saveForLater').isSwitchedOn) || (flags.get('saveV2').isSwitchedOn())
	}

}

```

### Using the gate in your product

```javascript
var flags = require('next-feature-flags-client').setUrl('http://host.com')
flags.init();
var flagGate = require('next-component-flag-gate').init(flags)
var cardConfig = {
	hasVideo: flags.get('useVideoInStream'), // easy to mixin flags that affect an isolated part of the app
	hasSummary: true,
	isSaveable: false,
	anyOtherProperty: 'a value' // won't be affected by the flag gate
};
var card = require('next-article-card').init(el, flagGate.gate('articleCard', cardConfig));

// this can also be overriden for experimenting within a product

var experimentalCardConfig = flagGate.gate('articleCard', cardConfig);

experimentalCardConfig.hasSummary = false; // force the summary to not appear

var card = require('next-article-card').init(experimentalEl, flagGate.gate('articleCard', cardConfig));

```