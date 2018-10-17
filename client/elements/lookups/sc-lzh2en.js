import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-ajax/iron-ajax.js';

import { ReduxMixin } from '/redux-store.js';
import { API_ROOT } from '../../constants.js';

class SCChineseLookup extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
    <iron-ajax
        id="ajax"
        handle-as="json"
        loading="{{loadingDict}}"
        last-response="{{dictData}}"></iron-ajax>

    <iron-ajax
        id="fallback_ajax"
        handle-as="json"
        loading="{{loadingFallbackDictData}}"
        last-response="{{fallbackDictData}}"></iron-ajax>`;
  }

  static get properties() {
    return {
      loadedLanguage: {
        type: String
      },
      toLang: {
        type: String,
        statePath: 'textOptions.chineseLookupTargetLanguage',
        observer: '_targetLanguageChanged'
      },
      dictData: {
        type: Object
      },
      loadingDict: {
        type: Boolean,
        value: true
      },
      loadingFallbackDictData: {
        type: Boolean,
        value: true
      },
      fallbackDictData: {
        type: Object
      }
    }
  }

  getNewDict() {
    this.$.ajax.url = this._computeUrl();
    this.loadedLanguage = this.toLang;
    if (this.toLang === 'en') {
      this.$.fallback_ajax.url = this._computeUrl(true);
      this.$.fallback_ajax.generateRequest();
    }
    return this.$.ajax.generateRequest();
  }

  lookupWord(graphs) {
    let definition = '';
    let length = 1;
    for (let i = graphs.length; i > 0; i--) {
      let snip = graphs.slice(0, i);
      definition += this._lookupWord(snip);
      if (definition && i > length) {
        length = i;
      }
    }
    return { html: definition, length: length };
  }

  _lookupWord(graph) {
    if (!this.dictData) {
      return;
    }
    graph = graph.replace(/\u2060/, '');
    if (this.dictData.dictionary[graph]) {
      return this._constructDictEntry(graph);
    } else if (this.fallbackDictData.dictionary[graph]) {
      return this._constructFallbackEntry(graph);
    }
    return '';
  }

  _constructDictEntry(graph) {
    const href = `http://www.buddhism-dict.net/cgi-bin/xpr-ddb.pl?q=${encodeURI(graph)}`;
    return `<div class="definition">
              <span class="ideograph">
                <a title="Go to full entry at the DDB. Login with user name ‘guest’" 
                    href="${href}" target="_blank" rel="noopener" class="lookup-link">${graph}</a>
              </span>
              <span class="meaning"> 
                ${this.dictData.dictionary[graph][0]}: ${this.dictData.dictionary[graph][1]}
              </span>
              <hr class="separator">
            </div>`;
  }

  _constructFallbackEntry(graph) {
    const href = `http://www.buddhism-dict.net/cgi-bin/dealt-lookup?q=${encodeURI(graph)}`;
    return `<div class="fallback definition">
              <span class="ideograph">
                <a title="Go to full entry at the CJKV. Login with user name ‘guest’"
                    href="${href}" target="_blank" rel="noopener" class="lookup-link">${graph}</a>
              </span>
              <span class="meaning">
                ${this.fallbackDictData.dictionary[graph][0]}: ${this.fallbackDictData.dictionary[graph][1]} [modern chinese]
              </span>
              <hr class="separator">
            </div>`
  }

  _computeUrl(fallback) {
    fallback = fallback || false;
    return `${API_ROOT}/dictionaries/lookup?from=lzh&to=${this.toLang}&fallback=${fallback}`;
  }

  _targetLanguageChanged() {
    if (!this.toLang) {
      return
    }
    if (typeof this.toLang !== 'undefined' && this.toLang !== this.loadedLanguage) {
      this.getNewDict();
    }
  }
}

customElements.define('sc-chinese-lookup', SCChineseLookup);
