var __extends=this&&this.__extends||function(t,e){function r(){this.constructor=t}for(var o in e)e.hasOwnProperty(o)&&(t[o]=e[o]);t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)},__decorate=this&&this.__decorate||function(t,e,r,o){var i,n=arguments.length,s=n<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(t,e,r,o);else for(var c=t.length-1;c>=0;c--)(i=t[c])&&(s=(n<3?i(s):n>3?i(e,r,s):i(e,r))||s);return n>3&&s&&Object.defineProperty(e,r,s),s},__param=this&&this.__param||function(t,e){return function(r,o){e(r,o,t)}};define(["require","exports","vs/platform/contextview/browser/contextView","vs/platform/keybinding/common/keybinding","vs/editor/browser/editorBrowserExtensions","vs/editor/contrib/find/browser/findWidget","vs/editor/contrib/find/common/findController"],function(t,e,r,o,i,n,s){/*---------------------------------------------------------------------------------------------
     *  Copyright (c) Microsoft Corporation. All rights reserved.
     *  Licensed under the MIT License. See License.txt in the project root for license information.
     *--------------------------------------------------------------------------------------------*/
"use strict";var c=function(t){function e(e,r,o){t.call(this,e,o),this._widget=this._register(new n.FindWidget(e,this,this._state,r,o))}return __extends(e,t),e.prototype._start=function(e){t.prototype._start.call(this,e),e.shouldFocus===s.FindStartFocusAction.FocusReplaceInput?this._widget.focusReplaceInput():e.shouldFocus===s.FindStartFocusAction.FocusFindInput&&this._widget.focusFindInput()},e=__decorate([__param(1,r.IContextViewService),__param(2,o.IKeybindingService)],e)}(s.CommonFindController);i.EditorBrowserRegistry.registerEditorContribution(c),i.EditorBrowserRegistry.registerEditorContribution(s.SelectionHighlighter)});