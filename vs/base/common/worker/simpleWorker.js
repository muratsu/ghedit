var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", 'vs/base/common/errors', 'vs/base/common/lifecycle', 'vs/base/common/winjs.base'], function (require, exports, errors_1, lifecycle_1, winjs_base_1) {
    /*---------------------------------------------------------------------------------------------
     *  Copyright (c) Microsoft Corporation. All rights reserved.
     *  Licensed under the MIT License. See License.txt in the project root for license information.
     *--------------------------------------------------------------------------------------------*/
    'use strict';
    var INITIALIZE = '$initialize';
    var SimpleWorkerProtocol = (function () {
        function SimpleWorkerProtocol(handler) {
            this._workerId = -1;
            this._handler = handler;
            this._lastSentReq = 0;
            this._pendingReplies = Object.create(null);
        }
        SimpleWorkerProtocol.prototype.setWorkerId = function (workerId) {
            this._workerId = workerId;
        };
        SimpleWorkerProtocol.prototype.sendMessage = function (method, args) {
            var req = String(++this._lastSentReq);
            var reply = {
                c: null,
                e: null
            };
            var result = new winjs_base_1.TPromise(function (c, e, p) {
                reply.c = c;
                reply.e = e;
            }, function () {
                // Cancel not supported
            });
            this._pendingReplies[req] = reply;
            this._send({
                vsWorker: this._workerId,
                req: req,
                method: method,
                args: args
            });
            return result;
        };
        SimpleWorkerProtocol.prototype.handleMessage = function (serializedMessage) {
            var message;
            try {
                message = JSON.parse(serializedMessage);
            }
            catch (e) {
            }
            if (!message.vsWorker) {
                return;
            }
            if (this._workerId !== -1 && message.vsWorker !== this._workerId) {
                return;
            }
            this._handleMessage(message);
        };
        SimpleWorkerProtocol.prototype._handleMessage = function (msg) {
            var _this = this;
            if (msg.seq) {
                var replyMessage = msg;
                if (!this._pendingReplies[replyMessage.seq]) {
                    console.warn('Got reply to unknown seq');
                    return;
                }
                var reply = this._pendingReplies[replyMessage.seq];
                delete this._pendingReplies[replyMessage.seq];
                if (replyMessage.err) {
                    var err = replyMessage.err;
                    if (replyMessage.err.$isError) {
                        err = new Error();
                        err.name = replyMessage.err.name;
                        err.message = replyMessage.err.message;
                        err.stack = replyMessage.err.stack;
                    }
                    reply.e(err);
                    return;
                }
                reply.c(replyMessage.res);
                return;
            }
            var requestMessage = msg;
            var req = requestMessage.req;
            var result = this._handler.handleMessage(requestMessage.method, requestMessage.args);
            result.then(function (r) {
                _this._send({
                    vsWorker: _this._workerId,
                    seq: req,
                    res: r,
                    err: undefined
                });
            }, function (e) {
                _this._send({
                    vsWorker: _this._workerId,
                    seq: req,
                    res: undefined,
                    err: errors_1.transformErrorForSerialization(e)
                });
            });
        };
        SimpleWorkerProtocol.prototype._send = function (msg) {
            var strMsg = JSON.stringify(msg);
            // console.log('SENDING: ' + strMsg);
            this._handler.sendMessage(strMsg);
        };
        return SimpleWorkerProtocol;
    }());
    /**
     * Main thread side
     */
    var SimpleWorkerClient = (function (_super) {
        __extends(SimpleWorkerClient, _super);
        function SimpleWorkerClient(workerFactory, moduleId, ctor) {
            var _this = this;
            _super.call(this);
            this._lastRequestTimestamp = -1;
            this._worker = this._register(workerFactory.create('vs/base/common/worker/simpleWorker', function (msg) {
                _this._protocol.handleMessage(msg);
            }));
            this._protocol = new SimpleWorkerProtocol({
                sendMessage: function (msg) {
                    _this._worker.postMessage(msg);
                },
                handleMessage: function (method, args) {
                    // Intentionally not supporting worker -> main requests
                    return winjs_base_1.TPromise.as(null);
                }
            });
            this._protocol.setWorkerId(this._worker.getId());
            // Gather loader configuration
            var loaderConfiguration = null;
            var globalRequire = window.require;
            if (typeof globalRequire.getConfig === 'function') {
                // Get the configuration from the Monaco AMD Loader
                loaderConfiguration = globalRequire.getConfig();
            }
            else if (typeof window.requirejs !== 'undefined') {
                // Get the configuration from requirejs
                loaderConfiguration = window.requirejs.s.contexts._.config;
            }
            // Send initialize message
            this._onModuleLoaded = this._protocol.sendMessage(INITIALIZE, [
                this._worker.getId(),
                moduleId,
                loaderConfiguration
            ]);
            this._onModuleLoaded.then(null, function (e) { return _this._onError('Worker failed to load ' + moduleId, e); });
            // Create proxy to loaded code
            var proxyMethodRequest = function (method, args) {
                return _this._request(method, args);
            };
            var createProxyMethod = function (method, proxyMethodRequest) {
                return function () {
                    var args = Array.prototype.slice.call(arguments, 0);
                    return proxyMethodRequest(method, args);
                };
            };
            this._proxy = {};
            for (var prop in ctor.prototype) {
                if (ctor.prototype.hasOwnProperty(prop)) {
                    if (typeof ctor.prototype[prop] === 'function') {
                        this._proxy[prop] = createProxyMethod(prop, proxyMethodRequest);
                    }
                }
            }
        }
        SimpleWorkerClient.prototype.get = function () {
            return this._proxy;
        };
        SimpleWorkerClient.prototype.getLastRequestTimestamp = function () {
            return this._lastRequestTimestamp;
        };
        SimpleWorkerClient.prototype._request = function (method, args) {
            var _this = this;
            return new winjs_base_1.TPromise(function (c, e, p) {
                _this._onModuleLoaded.then(function () {
                    _this._lastRequestTimestamp = Date.now();
                    _this._protocol.sendMessage(method, args).then(c, e);
                }, e);
            }, function () {
                // Cancel intentionally not supported
            });
        };
        SimpleWorkerClient.prototype._onError = function (message, error) {
            console.error(message);
            console.info(error);
        };
        return SimpleWorkerClient;
    }(lifecycle_1.Disposable));
    exports.SimpleWorkerClient = SimpleWorkerClient;
    /**
     * Worker side
     */
    var SimpleWorkerServer = (function () {
        function SimpleWorkerServer(postSerializedMessage) {
            var _this = this;
            this._protocol = new SimpleWorkerProtocol({
                sendMessage: function (msg) {
                    postSerializedMessage(msg);
                },
                handleMessage: function (method, args) { return _this._handleMessage(method, args); }
            });
        }
        SimpleWorkerServer.prototype.onmessage = function (msg) {
            this._protocol.handleMessage(msg);
        };
        SimpleWorkerServer.prototype._handleMessage = function (method, args) {
            if (method === INITIALIZE) {
                return this.initialize(args[0], args[1], args[2]);
            }
            if (!this._requestHandler || typeof this._requestHandler[method] !== 'function') {
                return winjs_base_1.TPromise.wrapError(new Error('Missing requestHandler or method: ' + method));
            }
            try {
                return winjs_base_1.TPromise.as(this._requestHandler[method].apply(this._requestHandler, args));
            }
            catch (e) {
                return winjs_base_1.TPromise.wrapError(e);
            }
        };
        SimpleWorkerServer.prototype.initialize = function (workerId, moduleId, loaderConfig) {
            var _this = this;
            this._protocol.setWorkerId(workerId);
            // TODO@Alex: share this code with workerServer
            if (loaderConfig) {
                // Remove 'baseUrl', handling it is beyond scope for now
                if (typeof loaderConfig.baseUrl !== 'undefined') {
                    delete loaderConfig['baseUrl'];
                }
                if (typeof loaderConfig.paths !== 'undefined') {
                    if (typeof loaderConfig.paths.vs !== 'undefined') {
                        delete loaderConfig.paths['vs'];
                    }
                }
                var nlsConfig_1 = loaderConfig['vs/nls'];
                // We need to have pseudo translation
                if (nlsConfig_1 && nlsConfig_1.pseudo) {
                    require(['vs/nls'], function (nlsPlugin) {
                        nlsPlugin.setPseudoTranslation(nlsConfig_1.pseudo);
                    });
                }
                // Since this is in a web worker, enable catching errors
                loaderConfig.catchError = true;
                self.require.config(loaderConfig);
            }
            var cc;
            var ee;
            var r = new winjs_base_1.TPromise(function (c, e, p) {
                cc = c;
                ee = e;
            });
            require([moduleId], function () {
                var result = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    result[_i - 0] = arguments[_i];
                }
                var handlerModule = result[0];
                _this._requestHandler = handlerModule.create();
                cc(null);
            }, ee);
            return r;
        };
        return SimpleWorkerServer;
    }());
    exports.SimpleWorkerServer = SimpleWorkerServer;
    /**
     * Called on the worker side
     */
    function create(postMessage) {
        return new SimpleWorkerServer(postMessage);
    }
    exports.create = create;
});
//# sourceMappingURL=simpleWorker.js.map