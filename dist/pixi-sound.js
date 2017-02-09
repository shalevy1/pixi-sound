(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sound = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var index_1 = require("./index");
var AUDIO_EXTENSIONS = ['wav', 'mp3', 'ogg', 'oga'];
function middleware(resource, next) {
    if (resource.data && AUDIO_EXTENSIONS.indexOf(resource._getExtension()) > -1) {
        resource.sound = index_1.default.add(resource.name, {
            srcBuffer: resource.data,
            preload: true,
            loaded: next
        });
    }
    else {
        next();
    }
}
function middlewareFactory() {
    return middleware;
}
function install() {
    var Resource = PIXI.loaders.Resource;
    AUDIO_EXTENSIONS.forEach(function (ext) {
        Resource.setExtensionXhrType(ext, Resource.XHR_RESPONSE_TYPE.BUFFER);
        Resource.setExtensionLoadType(ext, Resource.LOAD_TYPE.XHR);
    });
    PIXI.loaders.Loader.addPixiMiddleware(middlewareFactory);
    PIXI.loader.use(middleware);
}
exports.install = install;

},{"./index":15}],2:[function(require,module,exports){
"use strict";
var SoundNodes_1 = require("./SoundNodes");
var SoundInstance_1 = require("./SoundInstance");
var index_1 = require("./index");
var Sound = (function () {
    function Sound(context, options) {
        if (typeof options === "string" || options instanceof ArrayBuffer) {
            options = { src: options };
        }
        else if (options instanceof ArrayBuffer) {
            options = { srcBuffer: options };
        }
        options = Object.assign({
            autoPlay: false,
            singleInstance: false,
            src: null,
            preload: false,
            volume: 1,
            speed: 1,
            complete: null,
            loaded: null,
            loop: false,
            useXHR: true
        }, options || {});
        this._context = context;
        this._nodes = new SoundNodes_1.default(this._context);
        this._source = this._nodes.bufferSource;
        this.isLoaded = false;
        this.isPlaying = false;
        this.autoPlay = options.autoPlay;
        this.singleInstance = options.singleInstance;
        this.preload = options.preload || this.autoPlay;
        this.complete = options.complete;
        this.loaded = options.loaded;
        this.src = options.src;
        this.srcBuffer = options.srcBuffer;
        this.useXHR = options.useXHR;
        this._instances = [];
        this.volume = options.volume;
        this.loop = options.loop;
        this.speed = options.speed;
        if (this.preload) {
            this._beginPreload();
        }
    }
    Sound.from = function (options) {
        return new Sound(index_1.default.context, options);
    };
    Sound.prototype.destroy = function () {
        this._nodes.destroy();
        this._nodes = null;
        this._context = null;
        this._source = null;
        this._removeInstances();
        this._instances = null;
    };
    Object.defineProperty(Sound.prototype, "isPlayable", {
        get: function () {
            return this.isLoaded && !!this._source && !!this._source.buffer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "context", {
        get: function () {
            return this._context;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "volume", {
        get: function () {
            return this._nodes.gainNode.gain.value;
        },
        set: function (volume) {
            this._nodes.gainNode.gain.value = volume;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "loop", {
        get: function () {
            return this._source.loop;
        },
        set: function (loop) {
            this._source.loop = !!loop;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "buffer", {
        get: function () {
            return this._source.buffer;
        },
        set: function (buffer) {
            this._source.buffer = buffer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "duration", {
        get: function () {
            console.assert(this.isPlayable, 'Sound not yet playable, no duration');
            return this._source.buffer.duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "nodes", {
        get: function () {
            return this._nodes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "filters", {
        get: function () {
            return this._nodes.filters;
        },
        set: function (filters) {
            this._nodes.filters = filters;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "speed", {
        get: function () {
            return this._source.playbackRate.value;
        },
        set: function (value) {
            this._source.playbackRate.value = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sound.prototype, "instances", {
        get: function () {
            return this._instances;
        },
        enumerable: true,
        configurable: true
    });
    Sound.prototype.play = function (options) {
        var _this = this;
        if (typeof options === "function") {
            options = { complete: options };
        }
        options = Object.assign({
            complete: null,
            loaded: null,
            offset: 0
        }, options || {});
        if (!this.isPlayable) {
            this.autoPlay = true;
            if (!this.isLoaded) {
                var loaded = options.loaded;
                if (loaded) {
                    this.loaded = loaded;
                }
                this._beginPreload();
            }
            return;
        }
        if (this.singleInstance) {
            this._removeInstances();
        }
        var instance = SoundInstance_1.default.create(this);
        this._instances.push(instance);
        this.isPlaying = true;
        instance.once('end', function () {
            if (options.complete) {
                options.complete(_this);
            }
            _this._onComplete(instance);
        });
        instance.once('stop', function () {
            _this._onComplete(instance);
        });
        instance.play(options.offset);
        return instance;
    };
    Sound.prototype.stop = function () {
        if (!this.isPlayable) {
            this.autoPlay = false;
            return this;
        }
        this.isPlaying = false;
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].stop();
        }
        return this;
    };
    Sound.prototype.pause = function () {
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].paused = true;
        }
        this.isPlaying = false;
        return this;
    };
    ;
    Sound.prototype.resume = function () {
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].paused = false;
        }
        this.isPlaying = this._instances.length > 0;
        return this;
    };
    Sound.prototype._beginPreload = function () {
        if (this.src) {
            this.useXHR ? this._loadUrl() : this._loadPath();
        }
        else if (this.srcBuffer) {
            this._decode(this.srcBuffer);
        }
        else if (this.loaded) {
            this.loaded(new Error("sound.src or sound.srcBuffer must be set"));
        }
        else {
            console.error('sound.src or sound.srcBuffer must be set');
        }
    };
    Sound.prototype._onComplete = function (instance) {
        if (this._instances) {
            var index = this._instances.indexOf(instance);
            if (index > -1) {
                this._instances.splice(index, 1);
            }
            this.isPlaying = this._instances.length > 0;
        }
        instance.destroy();
    };
    Sound.prototype._removeInstances = function () {
        for (var i = this._instances.length - 1; i >= 0; i--) {
            this._instances[i].destroy();
        }
        this._instances.length = 0;
    };
    Sound.prototype._loadUrl = function () {
        var _this = this;
        var request = new XMLHttpRequest();
        var src = this.src;
        request.open('GET', src, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
            _this.isLoaded = true;
            _this.srcBuffer = request.response;
            _this._decode(request.response);
        };
        request.send();
    };
    Sound.prototype._loadPath = function () {
        var _this = this;
        var fs = require('fs');
        var src = this.src;
        fs.readFile(src, function (err, data) {
            if (err) {
                console.error(err);
                if (_this.loaded) {
                    _this.loaded(new Error("File not found " + _this.src));
                }
                return;
            }
            var arrayBuffer = new ArrayBuffer(data.length);
            var view = new Uint8Array(arrayBuffer);
            for (var i = 0; i < data.length; ++i) {
                view[i] = data[i];
            }
            _this._decode(arrayBuffer);
        });
    };
    Sound.prototype._decode = function (arrayBuffer) {
        var _this = this;
        this._context.decode(arrayBuffer, function (err, buffer) {
            if (err) {
                _this.loaded(err);
            }
            else {
                _this.isLoaded = true;
                _this.buffer = buffer;
                if (_this.loaded) {
                    _this.loaded(null, _this);
                }
                if (_this.autoPlay) {
                    _this.play(_this.complete);
                }
            }
        });
    };
    return Sound;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sound;

},{"./SoundInstance":4,"./SoundNodes":6,"./index":15,"fs":undefined}],3:[function(require,module,exports){
"use strict";
var webAudioIOS = require("web-audio-ios");
var SoundContext = (function () {
    function SoundContext() {
        this._ctx = new SoundContext.AudioContext();
        this._offlineCtx = new SoundContext.OfflineAudioContext(1, 2, this._ctx.sampleRate);
        this._gainNode = this._ctx.createGain();
        this._compressor = this._ctx.createDynamicsCompressor();
        this._gainNode.connect(this._compressor);
        this._compressor.connect(this._ctx.destination);
        this.volume = 1;
        this.muted = false;
        this.paused = false;
        webAudioIOS(window, this._ctx, function () { });
    }
    Object.defineProperty(SoundContext, "AudioContext", {
        get: function () {
            var win = window;
            return (win.AudioContext ||
                win.webkitAudioContext ||
                null);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext, "OfflineAudioContext", {
        get: function () {
            var win = window;
            return (win.OfflineAudioContext ||
                win.webkitOfflineAudioContext ||
                null);
        },
        enumerable: true,
        configurable: true
    });
    SoundContext.prototype.destroy = function () {
        var ctx = this._ctx;
        if (typeof ctx.close !== 'undefined') {
            ctx.close();
        }
        this._gainNode.disconnect();
        this._compressor.disconnect();
        this._offlineCtx = null;
        this._ctx = null;
        this._gainNode = null;
        this._compressor = null;
    };
    Object.defineProperty(SoundContext.prototype, "audioContext", {
        get: function () {
            return this._ctx;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "offlineContext", {
        get: function () {
            return this._offlineCtx;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "muted", {
        get: function () {
            return this._muted;
        },
        set: function (muted) {
            this._muted = !!muted;
            this._gainNode.gain.value = this._muted ? 0 : this._volume;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "volume", {
        get: function () {
            return this._volume;
        },
        set: function (volume) {
            this._volume = volume;
            if (!this._muted) {
                this._gainNode.gain.value = this._volume;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "paused", {
        get: function () {
            return this._paused;
        },
        set: function (paused) {
            if (paused && this._ctx.state === 'running') {
                this._ctx.suspend();
            }
            else if (!paused && this._ctx.state === 'suspended') {
                this._ctx.resume();
            }
            this._paused = paused;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundContext.prototype, "destination", {
        get: function () {
            return this._gainNode;
        },
        enumerable: true,
        configurable: true
    });
    SoundContext.prototype.toggleMute = function () {
        this.muted = !this.muted;
        return this._muted;
    };
    SoundContext.prototype.decode = function (arrayBuffer, callback) {
        this._offlineCtx.decodeAudioData(arrayBuffer, function (buffer) {
            callback(null, buffer);
        }, function () {
            callback(new Error('Unable to decode file'));
        });
    };
    return SoundContext;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundContext;

},{"web-audio-ios":21}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var id = 0;
var SoundInstance = (function (_super) {
    __extends(SoundInstance, _super);
    function SoundInstance(parent) {
        var _this = _super.call(this) || this;
        _this.id = id++;
        _this._parent = null;
        _this._startTime = 0;
        _this._paused = false;
        _this._position = 0;
        _this._duration = 0;
        _this._progress = 0;
        _this._init(parent);
        return _this;
    }
    SoundInstance.create = function (parent) {
        if (SoundInstance._pool.length > 0) {
            var sound = SoundInstance._pool.pop();
            sound._init(parent);
            return sound;
        }
        else {
            return new SoundInstance(parent);
        }
    };
    SoundInstance.prototype.stop = function () {
        if (this._source) {
            this._internalStop();
            this.emit('stop');
        }
    };
    SoundInstance.prototype.play = function (offset) {
        if (offset === void 0) { offset = 0; }
        this._progress = 0;
        this._paused = false;
        this._position = offset;
        this._source = this._parent.nodes.cloneBufferSource();
        this._duration = this._source.buffer.duration;
        this._startTime = this._now;
        this._source.onended = this._onComplete.bind(this);
        this._source.start(0, offset);
        this.emit('start');
        this.emit('progress', 0);
        this._onUpdate();
    };
    SoundInstance.prototype._onUpdate = function (enabled) {
        var _this = this;
        if (enabled === void 0) { enabled = true; }
        this._parent.nodes.scriptNode.onaudioprocess = !enabled ? null : function () {
            _this._update();
        };
    };
    Object.defineProperty(SoundInstance.prototype, "progress", {
        get: function () {
            return this._progress;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundInstance.prototype, "paused", {
        get: function () {
            return this._paused;
        },
        set: function (paused) {
            if (paused !== this._paused) {
                this._paused = paused;
                if (paused) {
                    this._internalStop();
                    var speed = 1;
                    if (this._source) {
                        speed = this._source.playbackRate.value;
                    }
                    this._position = (this._now - this._startTime) * speed;
                    this.emit('paused');
                }
                else {
                    this.emit('resumed');
                    this.play(this._position);
                }
                this.emit('pause', paused);
            }
        },
        enumerable: true,
        configurable: true
    });
    SoundInstance.prototype.destroy = function () {
        this.removeAllListeners();
        this._internalStop();
        if (this._source) {
            this._source.onended = null;
        }
        this._source = null;
        this._parent = null;
        this._startTime = 0;
        this._paused = false;
        this._position = 0;
        this._duration = 0;
        if (SoundInstance._pool.indexOf(this) < 0) {
            SoundInstance._pool.push(this);
        }
    };
    SoundInstance.prototype.toString = function () {
        return '[SoundInstance id=' + this.id + ']';
    };
    Object.defineProperty(SoundInstance.prototype, "_now", {
        get: function () {
            return this._parent.context.audioContext.currentTime;
        },
        enumerable: true,
        configurable: true
    });
    SoundInstance.prototype._update = function () {
        if (this._duration) {
            var speed = this._source.playbackRate.value;
            var position = this._paused ? this._position : (this._now - this._startTime);
            this._progress = Math.max(0, Math.min(1, (position / this._duration) * speed));
            this.emit('progress', this._progress);
        }
    };
    SoundInstance.prototype._init = function (parent) {
        this._parent = parent;
    };
    SoundInstance.prototype._internalStop = function () {
        if (this._source) {
            this._onUpdate(false);
            this._source.onended = null;
            this._source.stop();
            this._source = null;
        }
    };
    SoundInstance.prototype._onComplete = function () {
        if (this._source) {
            this._onUpdate(false);
            this._source.onended = null;
        }
        this._source = null;
        this._progress = 1;
        this.emit('progress', 1);
        this.emit('end', this);
    };
    return SoundInstance;
}(PIXI.utils.EventEmitter));
SoundInstance._pool = [];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundInstance;

},{}],5:[function(require,module,exports){
"use strict";
var SoundContext_1 = require("./SoundContext");
var Sound_1 = require("./Sound");
var SoundInstance_1 = require("./SoundInstance");
var SoundUtils_1 = require("./SoundUtils");
var filters = require("./filters");
var SoundLibrary = (function () {
    function SoundLibrary() {
        if (this.supported) {
            this._context = new SoundContext_1.default();
        }
        this._sounds = {};
        this.utils = SoundUtils_1.default;
        this.filters = filters;
        this.Sound = Sound_1.default;
        this.SoundInstance = SoundInstance_1.default;
        this.SoundLibrary = SoundLibrary;
    }
    Object.defineProperty(SoundLibrary.prototype, "context", {
        get: function () {
            return this._context;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundLibrary.prototype, "supported", {
        get: function () {
            return SoundContext_1.default.AudioContext !== null;
        },
        enumerable: true,
        configurable: true
    });
    SoundLibrary.prototype.add = function (alias, options) {
        console.assert(!this._sounds[alias], "Sound with alias " + alias + " already exists.");
        var sound;
        if (options instanceof Sound_1.default) {
            sound = this._sounds[alias] = options;
        }
        else {
            sound = this._sounds[alias] = new Sound_1.default(this.context, options);
        }
        return sound;
    };
    SoundLibrary.prototype.addMap = function (map, globalOptions) {
        var results = {};
        for (var alias in map) {
            var options = void 0;
            var sound = map[alias];
            if (typeof sound === "string") {
                options = { src: sound };
            }
            else if (sound instanceof ArrayBuffer) {
                options = { srcBuffer: sound };
            }
            else {
                options = sound;
            }
            results[alias] = this.add(alias, Object.assign(options, globalOptions || {}));
        }
        return results;
    };
    SoundLibrary.prototype.remove = function (alias) {
        this.exists(alias, true);
        this._sounds[alias].destroy();
        delete this._sounds[alias];
        return this;
    };
    Object.defineProperty(SoundLibrary.prototype, "volumeAll", {
        get: function () {
            return this._context.volume;
        },
        set: function (volume) {
            this._context.volume = volume;
        },
        enumerable: true,
        configurable: true
    });
    SoundLibrary.prototype.pauseAll = function () {
        this._context.paused = true;
        return this;
    };
    SoundLibrary.prototype.resumeAll = function () {
        this._context.paused = false;
        return this;
    };
    SoundLibrary.prototype.muteAll = function () {
        this._context.muted = true;
        return this;
    };
    SoundLibrary.prototype.unmuteAll = function () {
        this._context.muted = false;
        return this;
    };
    SoundLibrary.prototype.removeAll = function () {
        for (var alias in this._sounds) {
            this._sounds[alias].destroy();
            delete this._sounds[alias];
        }
        return this;
    };
    SoundLibrary.prototype.stopAll = function () {
        for (var alias in this._sounds) {
            this._sounds[alias].stop();
        }
        return this;
    };
    SoundLibrary.prototype.exists = function (alias, assert) {
        if (assert === void 0) { assert = false; }
        var exists = !!this._sounds[alias];
        if (assert) {
            console.assert(exists, "No sound matching alias '" + alias + "'.");
        }
        return exists;
    };
    SoundLibrary.prototype.find = function (alias) {
        this.exists(alias, true);
        return this._sounds[alias];
    };
    SoundLibrary.prototype.play = function (alias, options) {
        return this.find(alias).play(options);
    };
    SoundLibrary.prototype.stop = function (alias) {
        return this.find(alias).stop();
    };
    SoundLibrary.prototype.pause = function (alias) {
        return this.find(alias).pause();
    };
    SoundLibrary.prototype.resume = function (alias) {
        return this.find(alias).resume();
    };
    SoundLibrary.prototype.volume = function (alias, volume) {
        var sound = this.find(alias);
        if (volume !== undefined) {
            sound.volume = volume;
        }
        return sound.volume;
    };
    SoundLibrary.prototype.duration = function (alias) {
        return this.find(alias).duration;
    };
    SoundLibrary.prototype.destroy = function () {
        this.removeAll();
        this._sounds = null;
        this._context = null;
    };
    return SoundLibrary;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundLibrary;

},{"./Sound":2,"./SoundContext":3,"./SoundInstance":4,"./SoundUtils":7,"./filters":14}],6:[function(require,module,exports){
"use strict";
var SoundNodes = (function () {
    function SoundNodes(context) {
        this.context = context;
        var audioContext = this.context.audioContext;
        var bufferSource = audioContext.createBufferSource();
        var scriptNode = audioContext.createScriptProcessor(SoundNodes.BUFFER_SIZE);
        var gainNode = audioContext.createGain();
        var analyser = audioContext.createAnalyser();
        gainNode.connect(this.context.destination);
        scriptNode.connect(this.context.destination);
        analyser.connect(gainNode);
        bufferSource.connect(analyser);
        this.bufferSource = bufferSource;
        this.scriptNode = scriptNode;
        this.gainNode = gainNode;
        this.analyser = analyser;
        this.destination = analyser;
    }
    Object.defineProperty(SoundNodes.prototype, "filters", {
        get: function () {
            return this._filters;
        },
        set: function (filters) {
            var _this = this;
            if (this._filters) {
                this._filters.forEach(function (filter) {
                    filter && filter.disconnect();
                });
                this._filters = null;
                this.analyser.connect(this.gainNode);
            }
            if (filters && filters.length) {
                this._filters = filters.slice(0);
                this.analyser.disconnect();
                var prevFilter_1 = null;
                filters.forEach(function (filter) {
                    if (prevFilter_1 === null) {
                        _this.analyser.connect(filter.destination);
                    }
                    else {
                        prevFilter_1.connect(filter.destination);
                    }
                    prevFilter_1 = filter;
                });
                prevFilter_1.connect(this.gainNode);
            }
        },
        enumerable: true,
        configurable: true
    });
    SoundNodes.prototype.destroy = function () {
        this.filters = null;
        this.bufferSource.disconnect();
        this.scriptNode.disconnect();
        this.gainNode.disconnect();
        this.analyser.disconnect();
        this.bufferSource = null;
        this.scriptNode = null;
        this.gainNode = null;
        this.analyser = null;
        this.context = null;
    };
    SoundNodes.prototype.cloneBufferSource = function () {
        var orig = this.bufferSource;
        var clone = this.context.audioContext.createBufferSource();
        clone.buffer = orig.buffer;
        clone.playbackRate.value = orig.playbackRate.value;
        clone.loop = orig.loop;
        clone.connect(this.destination);
        return clone;
    };
    return SoundNodes;
}());
SoundNodes.BUFFER_SIZE = 256;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundNodes;

},{}],7:[function(require,module,exports){
"use strict";
var Sound_1 = require("./Sound");
var index_1 = require("./index");
var uuid = require("uuid");
var SoundUtils = (function () {
    function SoundUtils() {
    }
    SoundUtils.sineTone = function (hertz, seconds) {
        if (hertz === void 0) { hertz = 200; }
        if (seconds === void 0) { seconds = 1; }
        var soundContext = index_1.default.context;
        var soundInstance = new Sound_1.default(soundContext, {
            singleInstance: true
        });
        var nChannels = 1;
        var sampleRate = 48000;
        var amplitude = 2;
        var buffer = soundContext.audioContext.createBuffer(nChannels, seconds * sampleRate, sampleRate);
        var fArray = buffer.getChannelData(0);
        for (var i = 0; i < fArray.length; i++) {
            var time = i / buffer.sampleRate;
            var angle = hertz * time * Math.PI;
            fArray[i] = Math.sin(angle) * amplitude;
        }
        soundInstance.buffer = buffer;
        soundInstance.isLoaded = true;
        return soundInstance;
    };
    SoundUtils.playOnce = function (src, callback) {
        var alias = uuid.v4();
        index_1.default.add(alias, {
            src: src,
            preload: true,
            autoPlay: true,
            loaded: function (err) {
                if (err) {
                    console.error(err);
                    index_1.default.remove(alias);
                    if (callback) {
                        callback(err);
                    }
                }
            },
            complete: function () {
                index_1.default.remove(alias);
                if (callback) {
                    callback(null);
                }
            }
        });
        return alias;
    };
    return SoundUtils;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundUtils;

},{"./Sound":2,"./index":15,"uuid":16}],8:[function(require,module,exports){
"use strict";
var SoundLibrary_1 = require("./SoundLibrary");
var Sound_1 = require("./Sound");
var SoundLibraryPrototype = SoundLibrary_1.default.prototype;
var SoundPrototype = Sound_1.default.prototype;
SoundLibraryPrototype.sound = function sound(alias) {
    console.warn('PIXI.sound.sound is deprecated, use PIXI.sound.find');
    return this.find(alias);
};
SoundLibraryPrototype.panning = function (alias, panning) {
    console.warn('PIXI.sound.panning is deprecated, use PIXI.sound.filters.StereoPan');
    return 0;
};
Object.defineProperty(SoundLibraryPrototype, 'SoundUtils', {
    get: function () {
        console.warn('PIXI.sound.SoundUtils is deprecated, use PIXI.sound.utils');
        return this.utils;
    }
});
Object.defineProperty(SoundPrototype, 'block', {
    get: function () {
        console.warn('PIXI.sound.Sound.prototype.block is deprecated, use singleInstance instead');
        return this.singleInstance;
    },
    set: function (value) {
        console.warn('PIXI.sound.Sound.prototype.block is deprecated, use singleInstance instead');
        this.singleInstance = value;
    }
});

},{"./Sound":2,"./SoundLibrary":5}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var DistortionFilter = (function (_super) {
    __extends(DistortionFilter, _super);
    function DistortionFilter(amount) {
        if (amount === void 0) { amount = 0; }
        var _this = this;
        var distortion = index_1.default.context.audioContext.createWaveShaper();
        _this = _super.call(this, distortion) || this;
        _this._distortion = distortion;
        _this.amount = amount;
        return _this;
    }
    Object.defineProperty(DistortionFilter.prototype, "amount", {
        get: function () {
            return this._amount;
        },
        set: function (value) {
            value *= 1000;
            this._amount = value;
            var samples = 44100;
            var curve = new Float32Array(samples);
            var deg = Math.PI / 180;
            var i = 0;
            var x;
            for (; i < samples; ++i) {
                x = i * 2 / samples - 1;
                curve[i] = (3 + value) * x * 20 * deg / (Math.PI + value * Math.abs(x));
            }
            this._distortion.curve = curve;
            this._distortion.oversample = '4x';
        },
        enumerable: true,
        configurable: true
    });
    DistortionFilter.prototype.destroy = function () {
        this._distortion = null;
        _super.prototype.destroy.call(this);
    };
    return DistortionFilter;
}(Filter_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DistortionFilter;

},{"../index":15,"./Filter":11}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var EqualizerFilter = (function (_super) {
    __extends(EqualizerFilter, _super);
    function EqualizerFilter(f32, f64, f125, f250, f500, f1k, f2k, f4k, f8k, f16k) {
        if (f32 === void 0) { f32 = 0; }
        if (f64 === void 0) { f64 = 0; }
        if (f125 === void 0) { f125 = 0; }
        if (f250 === void 0) { f250 = 0; }
        if (f500 === void 0) { f500 = 0; }
        if (f1k === void 0) { f1k = 0; }
        if (f2k === void 0) { f2k = 0; }
        if (f4k === void 0) { f4k = 0; }
        if (f8k === void 0) { f8k = 0; }
        if (f16k === void 0) { f16k = 0; }
        var _this = this;
        var equalizerBands = [
            {
                f: EqualizerFilter.F32,
                type: 'lowshelf',
                gain: f32
            },
            {
                f: EqualizerFilter.F64,
                type: 'peaking',
                gain: f64
            },
            {
                f: EqualizerFilter.F125,
                type: 'peaking',
                gain: f125
            },
            {
                f: EqualizerFilter.F250,
                type: 'peaking',
                gain: f250
            },
            {
                f: EqualizerFilter.F500,
                type: 'peaking',
                gain: f500
            },
            {
                f: EqualizerFilter.F1K,
                type: 'peaking',
                gain: f1k
            },
            {
                f: EqualizerFilter.F2K,
                type: 'peaking',
                gain: f2k
            },
            {
                f: EqualizerFilter.F4K,
                type: 'peaking',
                gain: f4k
            },
            {
                f: EqualizerFilter.F8K,
                type: 'peaking',
                gain: f8k
            },
            {
                f: EqualizerFilter.F16K,
                type: 'highshelf',
                gain: f16k
            }
        ];
        var bands = equalizerBands.map(function (band) {
            var filter = index_1.default.context.audioContext.createBiquadFilter();
            filter.type = band.type;
            filter.gain.value = band.gain;
            filter.Q.value = 1;
            filter.frequency.value = band.f;
            return filter;
        });
        _this = _super.call(this, bands[0], bands[bands.length - 1]) || this;
        _this.bands = bands;
        _this.bandsMap = {};
        for (var i = 0; i < _this.bands.length; i++) {
            var node = _this.bands[i];
            if (i > 0) {
                _this.bands[i - 1].connect(node);
            }
            _this.bandsMap[node.frequency.value] = node;
        }
        return _this;
    }
    EqualizerFilter.prototype.setGain = function (frequency, gain) {
        if (gain === void 0) { gain = 0; }
        if (!this.bandsMap[frequency]) {
            throw 'No band found for frequency ' + frequency;
        }
        this.bandsMap[frequency].gain.value = gain;
    };
    EqualizerFilter.prototype.reset = function () {
        this.bands.forEach(function (band) {
            band.gain.value = 0;
        });
    };
    EqualizerFilter.prototype.destroy = function () {
        this.bands.forEach(function (band) {
            band.disconnect();
        });
        this.bands = null;
        this.bandsMap = null;
    };
    return EqualizerFilter;
}(Filter_1.default));
EqualizerFilter.F32 = 32;
EqualizerFilter.F64 = 64;
EqualizerFilter.F125 = 125;
EqualizerFilter.F250 = 250;
EqualizerFilter.F500 = 500;
EqualizerFilter.F1K = 1000;
EqualizerFilter.F2K = 2000;
EqualizerFilter.F4K = 4000;
EqualizerFilter.F8K = 8000;
EqualizerFilter.F16K = 16000;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EqualizerFilter;

},{"../index":15,"./Filter":11}],11:[function(require,module,exports){
"use strict";
var Filter = (function () {
    function Filter(destination, source) {
        this.destination = destination;
        this.source = source || destination;
    }
    Filter.prototype.connect = function (destination) {
        this.source.connect(destination);
    };
    Filter.prototype.disconnect = function () {
        this.source.disconnect();
    };
    Filter.prototype.destroy = function () {
        this.disconnect();
        this.destination = null;
        this.source = null;
    };
    return Filter;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Filter;

},{}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var ReverbFilter = (function (_super) {
    __extends(ReverbFilter, _super);
    function ReverbFilter(seconds, decay, reverse) {
        if (seconds === void 0) { seconds = 3; }
        if (decay === void 0) { decay = 2; }
        if (reverse === void 0) { reverse = false; }
        var _this = this;
        var convolver = index_1.default.context.audioContext.createConvolver();
        _this = _super.call(this, convolver) || this;
        _this._convolver = convolver;
        _this._seconds = _this._clamp(seconds, 1, 50);
        _this._decay = _this._clamp(decay, 0, 100);
        _this._reverse = reverse;
        _this._rebuild();
        return _this;
    }
    ReverbFilter.prototype._clamp = function (value, min, max) {
        return Math.min(max, Math.max(min, value));
    };
    Object.defineProperty(ReverbFilter.prototype, "seconds", {
        get: function () {
            return this._seconds;
        },
        set: function (seconds) {
            this._seconds = this._clamp(seconds, 1, 50);
            this._rebuild();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReverbFilter.prototype, "decay", {
        get: function () {
            return this._decay;
        },
        set: function (decay) {
            this._decay = this._clamp(decay, 0, 100);
            this._rebuild();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ReverbFilter.prototype, "reverse", {
        get: function () {
            return this._reverse;
        },
        set: function (reverse) {
            this._reverse = reverse;
            this._rebuild();
        },
        enumerable: true,
        configurable: true
    });
    ReverbFilter.prototype._rebuild = function () {
        var context = index_1.default.context.audioContext;
        var rate = context.sampleRate;
        var length = rate * this._seconds;
        var impulse = context.createBuffer(2, length, rate);
        var impulseL = impulse.getChannelData(0);
        var impulseR = impulse.getChannelData(1);
        var n;
        for (var i = 0; i < length; i++) {
            n = this._reverse ? length - i : i;
            impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this._decay);
            impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this._decay);
        }
        this._convolver.buffer = impulse;
    };
    ReverbFilter.prototype.destroy = function () {
        this._convolver = null;
        _super.prototype.destroy.call(this);
    };
    return ReverbFilter;
}(Filter_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReverbFilter;

},{"../index":15,"./Filter":11}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Filter_1 = require("./Filter");
var index_1 = require("../index");
var StereoFilter = (function (_super) {
    __extends(StereoFilter, _super);
    function StereoFilter(pan) {
        if (pan === void 0) { pan = 0; }
        var _this = this;
        var stereo;
        var panner;
        var destination;
        var audioContext = index_1.default.context.audioContext;
        if (audioContext.createStereoPanner) {
            stereo = audioContext.createStereoPanner();
            destination = stereo;
        }
        else {
            panner = audioContext.createPanner();
            panner.panningModel = 'equalpower';
            destination = panner;
        }
        _this = _super.call(this, destination) || this;
        _this._stereo = stereo;
        _this._panner = panner;
        _this.pan = pan;
        return _this;
    }
    Object.defineProperty(StereoFilter.prototype, "pan", {
        get: function () {
            return this._pan;
        },
        set: function (value) {
            this._pan = value;
            if (this._stereo) {
                this._stereo.pan.value = value;
            }
            else {
                this._panner.setPosition(value, 0, 1 - Math.abs(value));
            }
        },
        enumerable: true,
        configurable: true
    });
    StereoFilter.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this._stereo = null;
        this._panner = null;
    };
    return StereoFilter;
}(Filter_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StereoFilter;

},{"../index":15,"./Filter":11}],14:[function(require,module,exports){
"use strict";
var Filter_1 = require("./Filter");
exports.Filter = Filter_1.default;
var EqualizerFilter_1 = require("./EqualizerFilter");
exports.EqualizerFilter = EqualizerFilter_1.default;
var DistortionFilter_1 = require("./DistortionFilter");
exports.DistortionFilter = DistortionFilter_1.default;
var StereoFilter_1 = require("./StereoFilter");
exports.StereoFilter = StereoFilter_1.default;
var ReverbFilter_1 = require("./ReverbFilter");
exports.ReverbFilter = ReverbFilter_1.default;

},{"./DistortionFilter":9,"./EqualizerFilter":10,"./Filter":11,"./ReverbFilter":12,"./StereoFilter":13}],15:[function(require,module,exports){
(function (global){
"use strict";
var SoundLibrary_1 = require("./SoundLibrary");
var LoaderMiddleware_1 = require("./LoaderMiddleware");
require("./deprecations");
var sound = new SoundLibrary_1.default();
if (global.PIXI === undefined) {
    throw "pixi.js is required";
}
if (PIXI.loaders !== undefined) {
    LoaderMiddleware_1.install();
}
Object.defineProperty(PIXI, 'sound', {
    get: function () { return sound; }
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sound;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LoaderMiddleware":1,"./SoundLibrary":5,"./deprecations":8}],16:[function(require,module,exports){
var v1 = require('./v1');
var v4 = require('./v4');

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;

},{"./v1":19,"./v4":20}],17:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],18:[function(require,module,exports){
(function (global){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

module.exports = rng;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],19:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;

},{"./lib/bytesToUuid":17,"./lib/rng":18}],20:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":17,"./lib/rng":18}],21:[function(require,module,exports){
module.exports = function (el, ac, cb) {
  function handleIOS(e) {
    var buffer = ac.createBuffer(1, 1, 22050)
    var source = ac.createBufferSource()
    source.buffer = buffer
    source.connect(ac.destination)
    source.start(ac.currentTime)
    setTimeout(function() {
      el.removeEventListener('mousedown', handleIOS, false)
      el.removeEventListener('touchend', handleIOS, false)
      cb(source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)
    }, 1)
  }
  el.addEventListener('mousedown', handleIOS, false)
  el.addEventListener('touchend', handleIOS, false)
}

},{}]},{},[15])(15)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTG9hZGVyTWlkZGxld2FyZS5qcyIsImxpYi9Tb3VuZC5qcyIsImxpYi9Tb3VuZENvbnRleHQuanMiLCJsaWIvU291bmRJbnN0YW5jZS5qcyIsImxpYi9Tb3VuZExpYnJhcnkuanMiLCJsaWIvU291bmROb2Rlcy5qcyIsImxpYi9Tb3VuZFV0aWxzLmpzIiwibGliL2RlcHJlY2F0aW9ucy5qcyIsImxpYi9maWx0ZXJzL0Rpc3RvcnRpb25GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9FcXVhbGl6ZXJGaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9SZXZlcmJGaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9TdGVyZW9GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9pbmRleC5qcyIsImxpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL2J5dGVzVG9VdWlkLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL3JuZy1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvdjEuanMiLCJub2RlX21vZHVsZXMvdXVpZC92NC5qcyIsIm5vZGVfbW9kdWxlcy93ZWItYXVkaW8taW9zL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi9pbmRleFwiKTtcbnZhciBBVURJT19FWFRFTlNJT05TID0gWyd3YXYnLCAnbXAzJywgJ29nZycsICdvZ2EnXTtcbmZ1bmN0aW9uIG1pZGRsZXdhcmUocmVzb3VyY2UsIG5leHQpIHtcbiAgICBpZiAocmVzb3VyY2UuZGF0YSAmJiBBVURJT19FWFRFTlNJT05TLmluZGV4T2YocmVzb3VyY2UuX2dldEV4dGVuc2lvbigpKSA+IC0xKSB7XG4gICAgICAgIHJlc291cmNlLnNvdW5kID0gaW5kZXhfMS5kZWZhdWx0LmFkZChyZXNvdXJjZS5uYW1lLCB7XG4gICAgICAgICAgICBzcmNCdWZmZXI6IHJlc291cmNlLmRhdGEsXG4gICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgbG9hZGVkOiBuZXh0XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1pZGRsZXdhcmVGYWN0b3J5KCkge1xuICAgIHJldHVybiBtaWRkbGV3YXJlO1xufVxuZnVuY3Rpb24gaW5zdGFsbCgpIHtcbiAgICB2YXIgUmVzb3VyY2UgPSBQSVhJLmxvYWRlcnMuUmVzb3VyY2U7XG4gICAgQVVESU9fRVhURU5TSU9OUy5mb3JFYWNoKGZ1bmN0aW9uIChleHQpIHtcbiAgICAgICAgUmVzb3VyY2Uuc2V0RXh0ZW5zaW9uWGhyVHlwZShleHQsIFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJVRkZFUik7XG4gICAgICAgIFJlc291cmNlLnNldEV4dGVuc2lvbkxvYWRUeXBlKGV4dCwgUmVzb3VyY2UuTE9BRF9UWVBFLlhIUik7XG4gICAgfSk7XG4gICAgUElYSS5sb2FkZXJzLkxvYWRlci5hZGRQaXhpTWlkZGxld2FyZShtaWRkbGV3YXJlRmFjdG9yeSk7XG4gICAgUElYSS5sb2FkZXIudXNlKG1pZGRsZXdhcmUpO1xufVxuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUxvYWRlck1pZGRsZXdhcmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU291bmROb2Rlc18xID0gcmVxdWlyZShcIi4vU291bmROb2Rlc1wiKTtcbnZhciBTb3VuZEluc3RhbmNlXzEgPSByZXF1aXJlKFwiLi9Tb3VuZEluc3RhbmNlXCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi9pbmRleFwiKTtcbnZhciBTb3VuZCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU291bmQoY29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIgfHwgb3B0aW9ucyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICBvcHRpb25zID0geyBzcmM6IG9wdGlvbnMgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRpb25zIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyY0J1ZmZlcjogb3B0aW9ucyB9O1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIGF1dG9QbGF5OiBmYWxzZSxcbiAgICAgICAgICAgIHNpbmdsZUluc3RhbmNlOiBmYWxzZSxcbiAgICAgICAgICAgIHNyYzogbnVsbCxcbiAgICAgICAgICAgIHByZWxvYWQ6IGZhbHNlLFxuICAgICAgICAgICAgdm9sdW1lOiAxLFxuICAgICAgICAgICAgc3BlZWQ6IDEsXG4gICAgICAgICAgICBjb21wbGV0ZTogbnVsbCxcbiAgICAgICAgICAgIGxvYWRlZDogbnVsbCxcbiAgICAgICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICAgICAgdXNlWEhSOiB0cnVlXG4gICAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBuZXcgU291bmROb2Rlc18xLmRlZmF1bHQodGhpcy5fY29udGV4dCk7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IHRoaXMuX25vZGVzLmJ1ZmZlclNvdXJjZTtcbiAgICAgICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF1dG9QbGF5ID0gb3B0aW9ucy5hdXRvUGxheTtcbiAgICAgICAgdGhpcy5zaW5nbGVJbnN0YW5jZSA9IG9wdGlvbnMuc2luZ2xlSW5zdGFuY2U7XG4gICAgICAgIHRoaXMucHJlbG9hZCA9IG9wdGlvbnMucHJlbG9hZCB8fCB0aGlzLmF1dG9QbGF5O1xuICAgICAgICB0aGlzLmNvbXBsZXRlID0gb3B0aW9ucy5jb21wbGV0ZTtcbiAgICAgICAgdGhpcy5sb2FkZWQgPSBvcHRpb25zLmxvYWRlZDtcbiAgICAgICAgdGhpcy5zcmMgPSBvcHRpb25zLnNyYztcbiAgICAgICAgdGhpcy5zcmNCdWZmZXIgPSBvcHRpb25zLnNyY0J1ZmZlcjtcbiAgICAgICAgdGhpcy51c2VYSFIgPSBvcHRpb25zLnVzZVhIUjtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VzID0gW107XG4gICAgICAgIHRoaXMudm9sdW1lID0gb3B0aW9ucy52b2x1bWU7XG4gICAgICAgIHRoaXMubG9vcCA9IG9wdGlvbnMubG9vcDtcbiAgICAgICAgdGhpcy5zcGVlZCA9IG9wdGlvbnMuc3BlZWQ7XG4gICAgICAgIGlmICh0aGlzLnByZWxvYWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2JlZ2luUHJlbG9hZCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFNvdW5kLmZyb20gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gbmV3IFNvdW5kKGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LCBvcHRpb25zKTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9ub2Rlcy5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuX25vZGVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3JlbW92ZUluc3RhbmNlcygpO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXMgPSBudWxsO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJpc1BsYXlhYmxlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc0xvYWRlZCAmJiAhIXRoaXMuX3NvdXJjZSAmJiAhIXRoaXMuX3NvdXJjZS5idWZmZXI7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiY29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwidm9sdW1lXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5nYWluTm9kZS5nYWluLnZhbHVlID0gdm9sdW1lO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImxvb3BcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UubG9vcDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAobG9vcCkge1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLmxvb3AgPSAhIWxvb3A7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiYnVmZmVyXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc291cmNlLmJ1ZmZlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UuYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImR1cmF0aW9uXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydCh0aGlzLmlzUGxheWFibGUsICdTb3VuZCBub3QgeWV0IHBsYXlhYmxlLCBubyBkdXJhdGlvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvdXJjZS5idWZmZXIuZHVyYXRpb247XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwibm9kZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2RlcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJmaWx0ZXJzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXMuZmlsdGVycztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMuZmlsdGVycyA9IGZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwic3BlZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImluc3RhbmNlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmQucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHsgY29tcGxldGU6IG9wdGlvbnMgfTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBjb21wbGV0ZTogbnVsbCxcbiAgICAgICAgICAgIGxvYWRlZDogbnVsbCxcbiAgICAgICAgICAgIG9mZnNldDogMFxuICAgICAgICB9LCBvcHRpb25zIHx8IHt9KTtcbiAgICAgICAgaWYgKCF0aGlzLmlzUGxheWFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1BsYXkgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxvYWRlZCA9IG9wdGlvbnMubG9hZGVkO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkZWQgPSBsb2FkZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luUHJlbG9hZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNpbmdsZUluc3RhbmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVJbnN0YW5jZXMoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSBTb3VuZEluc3RhbmNlXzEuZGVmYXVsdC5jcmVhdGUodGhpcyk7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcy5wdXNoKGluc3RhbmNlKTtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICBpbnN0YW5jZS5vbmNlKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuY29tcGxldGUoX3RoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuX29uQ29tcGxldGUoaW5zdGFuY2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5zdGFuY2Uub25jZSgnc3RvcCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLl9vbkNvbXBsZXRlKGluc3RhbmNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGluc3RhbmNlLnBsYXkob3B0aW9ucy5vZmZzZXQpO1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUGxheWFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b1BsYXkgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuX2luc3RhbmNlc1tpXS5zdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuX2luc3RhbmNlc1tpXS5wYXVzZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgO1xuICAgIFNvdW5kLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuX2luc3RhbmNlc1tpXS5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggPiAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fYmVnaW5QcmVsb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5zcmMpIHtcbiAgICAgICAgICAgIHRoaXMudXNlWEhSID8gdGhpcy5fbG9hZFVybCgpIDogdGhpcy5fbG9hZFBhdGgoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnNyY0J1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5fZGVjb2RlKHRoaXMuc3JjQnVmZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLmxvYWRlZCkge1xuICAgICAgICAgICAgdGhpcy5sb2FkZWQobmV3IEVycm9yKFwic291bmQuc3JjIG9yIHNvdW5kLnNyY0J1ZmZlciBtdXN0IGJlIHNldFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdzb3VuZC5zcmMgb3Igc291bmQuc3JjQnVmZmVyIG11c3QgYmUgc2V0Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICBpZiAodGhpcy5faW5zdGFuY2VzKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9pbnN0YW5jZXMuaW5kZXhPZihpbnN0YW5jZSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoID4gMDtcbiAgICAgICAgfVxuICAgICAgICBpbnN0YW5jZS5kZXN0cm95KCk7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX3JlbW92ZUluc3RhbmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoID0gMDtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fbG9hZFVybCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgdmFyIHNyYyA9IHRoaXMuc3JjO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oJ0dFVCcsIHNyYywgdHJ1ZSk7XG4gICAgICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgICAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICBfdGhpcy5zcmNCdWZmZXIgPSByZXF1ZXN0LnJlc3BvbnNlO1xuICAgICAgICAgICAgX3RoaXMuX2RlY29kZShyZXF1ZXN0LnJlc3BvbnNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX2xvYWRQYXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICB2YXIgc3JjID0gdGhpcy5zcmM7XG4gICAgICAgIGZzLnJlYWRGaWxlKHNyYywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmxvYWRlZChuZXcgRXJyb3IoXCJGaWxlIG5vdCBmb3VuZCBcIiArIF90aGlzLnNyYykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoZGF0YS5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2aWV3W2ldID0gZGF0YVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLl9kZWNvZGUoYXJyYXlCdWZmZXIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fZGVjb2RlID0gZnVuY3Rpb24gKGFycmF5QnVmZmVyKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2NvbnRleHQuZGVjb2RlKGFycmF5QnVmZmVyLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5sb2FkZWQoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIF90aGlzLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBfdGhpcy5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgaWYgKF90aGlzLmxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5sb2FkZWQobnVsbCwgX3RoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMuYXV0b1BsYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucGxheShfdGhpcy5jb21wbGV0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBTb3VuZDtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHdlYkF1ZGlvSU9TID0gcmVxdWlyZShcIndlYi1hdWRpby1pb3NcIik7XG52YXIgU291bmRDb250ZXh0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZENvbnRleHQoKSB7XG4gICAgICAgIHRoaXMuX2N0eCA9IG5ldyBTb3VuZENvbnRleHQuQXVkaW9Db250ZXh0KCk7XG4gICAgICAgIHRoaXMuX29mZmxpbmVDdHggPSBuZXcgU291bmRDb250ZXh0Lk9mZmxpbmVBdWRpb0NvbnRleHQoMSwgMiwgdGhpcy5fY3R4LnNhbXBsZVJhdGUpO1xuICAgICAgICB0aGlzLl9nYWluTm9kZSA9IHRoaXMuX2N0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzb3IgPSB0aGlzLl9jdHguY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk7XG4gICAgICAgIHRoaXMuX2dhaW5Ob2RlLmNvbm5lY3QodGhpcy5fY29tcHJlc3Nvcik7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzb3IuY29ubmVjdCh0aGlzLl9jdHguZGVzdGluYXRpb24pO1xuICAgICAgICB0aGlzLnZvbHVtZSA9IDE7XG4gICAgICAgIHRoaXMubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgd2ViQXVkaW9JT1Mod2luZG93LCB0aGlzLl9jdHgsIGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQsIFwiQXVkaW9Db250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgd2luID0gd2luZG93O1xuICAgICAgICAgICAgcmV0dXJuICh3aW4uQXVkaW9Db250ZXh0IHx8XG4gICAgICAgICAgICAgICAgd2luLndlYmtpdEF1ZGlvQ29udGV4dCB8fFxuICAgICAgICAgICAgICAgIG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LCBcIk9mZmxpbmVBdWRpb0NvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB3aW4gPSB3aW5kb3c7XG4gICAgICAgICAgICByZXR1cm4gKHdpbi5PZmZsaW5lQXVkaW9Db250ZXh0IHx8XG4gICAgICAgICAgICAgICAgd2luLndlYmtpdE9mZmxpbmVBdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICBudWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRDb250ZXh0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICBpZiAodHlwZW9mIGN0eC5jbG9zZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN0eC5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2dhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5fY29tcHJlc3Nvci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuX29mZmxpbmVDdHggPSBudWxsO1xuICAgICAgICB0aGlzLl9jdHggPSBudWxsO1xuICAgICAgICB0aGlzLl9nYWluTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzb3IgPSBudWxsO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwiYXVkaW9Db250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY3R4O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJvZmZsaW5lQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29mZmxpbmVDdHg7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcIm11dGVkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbXV0ZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKG11dGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9tdXRlZCA9ICEhbXV0ZWQ7XG4gICAgICAgICAgICB0aGlzLl9nYWluTm9kZS5nYWluLnZhbHVlID0gdGhpcy5fbXV0ZWQgPyAwIDogdGhpcy5fdm9sdW1lO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJ2b2x1bWVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZvbHVtZSkge1xuICAgICAgICAgICAgdGhpcy5fdm9sdW1lID0gdm9sdW1lO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9tdXRlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dhaW5Ob2RlLmdhaW4udmFsdWUgPSB0aGlzLl92b2x1bWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcInBhdXNlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocGF1c2VkKSB7XG4gICAgICAgICAgICBpZiAocGF1c2VkICYmIHRoaXMuX2N0eC5zdGF0ZSA9PT0gJ3J1bm5pbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3R4LnN1c3BlbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCFwYXVzZWQgJiYgdGhpcy5fY3R4LnN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N0eC5yZXN1bWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BhdXNlZCA9IHBhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwiZGVzdGluYXRpb25cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nYWluTm9kZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRDb250ZXh0LnByb3RvdHlwZS50b2dnbGVNdXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm11dGVkID0gIXRoaXMubXV0ZWQ7XG4gICAgICAgIHJldHVybiB0aGlzLl9tdXRlZDtcbiAgICB9O1xuICAgIFNvdW5kQ29udGV4dC5wcm90b3R5cGUuZGVjb2RlID0gZnVuY3Rpb24gKGFycmF5QnVmZmVyLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLl9vZmZsaW5lQ3R4LmRlY29kZUF1ZGlvRGF0YShhcnJheUJ1ZmZlciwgZnVuY3Rpb24gKGJ1ZmZlcikge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgYnVmZmVyKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdVbmFibGUgdG8gZGVjb2RlIGZpbGUnKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kQ29udGV4dDtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZENvbnRleHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZENvbnRleHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBpZCA9IDA7XG52YXIgU291bmRJbnN0YW5jZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFNvdW5kSW5zdGFuY2UsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU291bmRJbnN0YW5jZShwYXJlbnQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuaWQgPSBpZCsrO1xuICAgICAgICBfdGhpcy5fcGFyZW50ID0gbnVsbDtcbiAgICAgICAgX3RoaXMuX3N0YXJ0VGltZSA9IDA7XG4gICAgICAgIF90aGlzLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuX3Bvc2l0aW9uID0gMDtcbiAgICAgICAgX3RoaXMuX2R1cmF0aW9uID0gMDtcbiAgICAgICAgX3RoaXMuX3Byb2dyZXNzID0gMDtcbiAgICAgICAgX3RoaXMuX2luaXQocGFyZW50KTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBTb3VuZEluc3RhbmNlLmNyZWF0ZSA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKFNvdW5kSW5zdGFuY2UuX3Bvb2wubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHNvdW5kID0gU291bmRJbnN0YW5jZS5fcG9vbC5wb3AoKTtcbiAgICAgICAgICAgIHNvdW5kLl9pbml0KHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gc291bmQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFNvdW5kSW5zdGFuY2UocGFyZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5faW50ZXJuYWxTdG9wKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3N0b3AnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgICAgICAgaWYgKG9mZnNldCA9PT0gdm9pZCAwKSB7IG9mZnNldCA9IDA7IH1cbiAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAwO1xuICAgICAgICB0aGlzLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fcG9zaXRpb24gPSBvZmZzZXQ7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IHRoaXMuX3BhcmVudC5ub2Rlcy5jbG9uZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgICB0aGlzLl9kdXJhdGlvbiA9IHRoaXMuX3NvdXJjZS5idWZmZXIuZHVyYXRpb247XG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IHRoaXMuX25vdztcbiAgICAgICAgdGhpcy5fc291cmNlLm9uZW5kZWQgPSB0aGlzLl9vbkNvbXBsZXRlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX3NvdXJjZS5zdGFydCgwLCBvZmZzZXQpO1xuICAgICAgICB0aGlzLmVtaXQoJ3N0YXJ0Jyk7XG4gICAgICAgIHRoaXMuZW1pdCgncHJvZ3Jlc3MnLCAwKTtcbiAgICAgICAgdGhpcy5fb25VcGRhdGUoKTtcbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9vblVwZGF0ZSA9IGZ1bmN0aW9uIChlbmFibGVkKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChlbmFibGVkID09PSB2b2lkIDApIHsgZW5hYmxlZCA9IHRydWU7IH1cbiAgICAgICAgdGhpcy5fcGFyZW50Lm5vZGVzLnNjcmlwdE5vZGUub25hdWRpb3Byb2Nlc3MgPSAhZW5hYmxlZCA/IG51bGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgIH07XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwicHJvZ3Jlc3NcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wcm9ncmVzcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLCBcInBhdXNlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocGF1c2VkKSB7XG4gICAgICAgICAgICBpZiAocGF1c2VkICE9PSB0aGlzLl9wYXVzZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXVzZWQgPSBwYXVzZWQ7XG4gICAgICAgICAgICAgICAgaWYgKHBhdXNlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNwZWVkID0gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BlZWQgPSB0aGlzLl9zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Bvc2l0aW9uID0gKHRoaXMuX25vdyAtIHRoaXMuX3N0YXJ0VGltZSkgKiBzcGVlZDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdwYXVzZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzdW1lZCcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkodGhpcy5fcG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3BhdXNlJywgcGF1c2VkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5faW50ZXJuYWxTdG9wKCk7XG4gICAgICAgIGlmICh0aGlzLl9zb3VyY2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5vbmVuZGVkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9zdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fcG9zaXRpb24gPSAwO1xuICAgICAgICB0aGlzLl9kdXJhdGlvbiA9IDA7XG4gICAgICAgIGlmIChTb3VuZEluc3RhbmNlLl9wb29sLmluZGV4T2YodGhpcykgPCAwKSB7XG4gICAgICAgICAgICBTb3VuZEluc3RhbmNlLl9wb29sLnB1c2godGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJ1tTb3VuZEluc3RhbmNlIGlkPScgKyB0aGlzLmlkICsgJ10nO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLCBcIl9ub3dcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuY29udGV4dC5hdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl91cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9kdXJhdGlvbikge1xuICAgICAgICAgICAgdmFyIHNwZWVkID0gdGhpcy5fc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuX3BhdXNlZCA/IHRoaXMuX3Bvc2l0aW9uIDogKHRoaXMuX25vdyAtIHRoaXMuX3N0YXJ0VGltZSk7XG4gICAgICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIChwb3NpdGlvbiAvIHRoaXMuX2R1cmF0aW9uKSAqIHNwZWVkKSk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3Byb2dyZXNzJywgdGhpcy5fcHJvZ3Jlc3MpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuX2ludGVybmFsU3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5fb25VcGRhdGUoZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLm9uZW5kZWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLnN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9vbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9vblVwZGF0ZShmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc291cmNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAxO1xuICAgICAgICB0aGlzLmVtaXQoJ3Byb2dyZXNzJywgMSk7XG4gICAgICAgIHRoaXMuZW1pdCgnZW5kJywgdGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRJbnN0YW5jZTtcbn0oUElYSS51dGlscy5FdmVudEVtaXR0ZXIpKTtcblNvdW5kSW5zdGFuY2UuX3Bvb2wgPSBbXTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kSW5zdGFuY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZEluc3RhbmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNvdW5kQ29udGV4dF8xID0gcmVxdWlyZShcIi4vU291bmRDb250ZXh0XCIpO1xudmFyIFNvdW5kXzEgPSByZXF1aXJlKFwiLi9Tb3VuZFwiKTtcbnZhciBTb3VuZEluc3RhbmNlXzEgPSByZXF1aXJlKFwiLi9Tb3VuZEluc3RhbmNlXCIpO1xudmFyIFNvdW5kVXRpbHNfMSA9IHJlcXVpcmUoXCIuL1NvdW5kVXRpbHNcIik7XG52YXIgZmlsdGVycyA9IHJlcXVpcmUoXCIuL2ZpbHRlcnNcIik7XG52YXIgU291bmRMaWJyYXJ5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZExpYnJhcnkoKSB7XG4gICAgICAgIGlmICh0aGlzLnN1cHBvcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IG5ldyBTb3VuZENvbnRleHRfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc291bmRzID0ge307XG4gICAgICAgIHRoaXMudXRpbHMgPSBTb3VuZFV0aWxzXzEuZGVmYXVsdDtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gZmlsdGVycztcbiAgICAgICAgdGhpcy5Tb3VuZCA9IFNvdW5kXzEuZGVmYXVsdDtcbiAgICAgICAgdGhpcy5Tb3VuZEluc3RhbmNlID0gU291bmRJbnN0YW5jZV8xLmRlZmF1bHQ7XG4gICAgICAgIHRoaXMuU291bmRMaWJyYXJ5ID0gU291bmRMaWJyYXJ5O1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRMaWJyYXJ5LnByb3RvdHlwZSwgXCJjb250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kTGlicmFyeS5wcm90b3R5cGUsIFwic3VwcG9ydGVkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gU291bmRDb250ZXh0XzEuZGVmYXVsdC5BdWRpb0NvbnRleHQgIT09IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGFsaWFzLCBvcHRpb25zKSB7XG4gICAgICAgIGNvbnNvbGUuYXNzZXJ0KCF0aGlzLl9zb3VuZHNbYWxpYXNdLCBcIlNvdW5kIHdpdGggYWxpYXMgXCIgKyBhbGlhcyArIFwiIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICAgICAgdmFyIHNvdW5kO1xuICAgICAgICBpZiAob3B0aW9ucyBpbnN0YW5jZW9mIFNvdW5kXzEuZGVmYXVsdCkge1xuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9zb3VuZHNbYWxpYXNdID0gb3B0aW9ucztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fc291bmRzW2FsaWFzXSA9IG5ldyBTb3VuZF8xLmRlZmF1bHQodGhpcy5jb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc291bmQ7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmFkZE1hcCA9IGZ1bmN0aW9uIChtYXAsIGdsb2JhbE9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgYWxpYXMgaW4gbWFwKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBzb3VuZCA9IG1hcFthbGlhc107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdW5kID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHsgc3JjOiBzb3VuZCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc291bmQgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyY0J1ZmZlcjogc291bmQgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBzb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdHNbYWxpYXNdID0gdGhpcy5hZGQoYWxpYXMsIE9iamVjdC5hc3NpZ24ob3B0aW9ucywgZ2xvYmFsT3B0aW9ucyB8fCB7fSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgdGhpcy5leGlzdHMoYWxpYXMsIHRydWUpO1xuICAgICAgICB0aGlzLl9zb3VuZHNbYWxpYXNdLmRlc3Ryb3koKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX3NvdW5kc1thbGlhc107XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kTGlicmFyeS5wcm90b3R5cGUsIFwidm9sdW1lQWxsXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dC52b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZvbHVtZSkge1xuICAgICAgICAgICAgdGhpcy5fY29udGV4dC52b2x1bWUgPSB2b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucGF1c2VBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlc3VtZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLm11dGVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQubXV0ZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUudW5tdXRlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0Lm11dGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGFsaWFzIGluIHRoaXMuX3NvdW5kcykge1xuICAgICAgICAgICAgdGhpcy5fc291bmRzW2FsaWFzXS5kZXN0cm95KCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuc3RvcEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgYWxpYXMgaW4gdGhpcy5fc291bmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VuZHNbYWxpYXNdLnN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuZXhpc3RzID0gZnVuY3Rpb24gKGFsaWFzLCBhc3NlcnQpIHtcbiAgICAgICAgaWYgKGFzc2VydCA9PT0gdm9pZCAwKSB7IGFzc2VydCA9IGZhbHNlOyB9XG4gICAgICAgIHZhciBleGlzdHMgPSAhIXRoaXMuX3NvdW5kc1thbGlhc107XG4gICAgICAgIGlmIChhc3NlcnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KGV4aXN0cywgXCJObyBzb3VuZCBtYXRjaGluZyBhbGlhcyAnXCIgKyBhbGlhcyArIFwiJy5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4aXN0cztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICB0aGlzLmV4aXN0cyhhbGlhcywgdHJ1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9zb3VuZHNbYWxpYXNdO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24gKGFsaWFzLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpLnBsYXkob3B0aW9ucyk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykuc3RvcCgpO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5wYXVzZSgpO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykucmVzdW1lKCk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnZvbHVtZSA9IGZ1bmN0aW9uIChhbGlhcywgdm9sdW1lKSB7XG4gICAgICAgIHZhciBzb3VuZCA9IHRoaXMuZmluZChhbGlhcyk7XG4gICAgICAgIGlmICh2b2x1bWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc291bmQudm9sdW1lID0gdm9sdW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzb3VuZC52b2x1bWU7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmR1cmF0aW9uID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpLmR1cmF0aW9uO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbCgpO1xuICAgICAgICB0aGlzLl9zb3VuZHMgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBTb3VuZExpYnJhcnk7XG59KCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmRMaWJyYXJ5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmRMaWJyYXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNvdW5kTm9kZXMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kTm9kZXMoY29udGV4dCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB2YXIgYXVkaW9Db250ZXh0ID0gdGhpcy5jb250ZXh0LmF1ZGlvQ29udGV4dDtcbiAgICAgICAgdmFyIGJ1ZmZlclNvdXJjZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICAgICAgdmFyIHNjcmlwdE5vZGUgPSBhdWRpb0NvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKFNvdW5kTm9kZXMuQlVGRkVSX1NJWkUpO1xuICAgICAgICB2YXIgZ2Fpbk5vZGUgPSBhdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgICAgICB2YXIgYW5hbHlzZXIgPSBhdWRpb0NvbnRleHQuY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLmNvbnRleHQuZGVzdGluYXRpb24pO1xuICAgICAgICBzY3JpcHROb2RlLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgYW5hbHlzZXIuY29ubmVjdChnYWluTm9kZSk7XG4gICAgICAgIGJ1ZmZlclNvdXJjZS5jb25uZWN0KGFuYWx5c2VyKTtcbiAgICAgICAgdGhpcy5idWZmZXJTb3VyY2UgPSBidWZmZXJTb3VyY2U7XG4gICAgICAgIHRoaXMuc2NyaXB0Tm9kZSA9IHNjcmlwdE5vZGU7XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUgPSBnYWluTm9kZTtcbiAgICAgICAgdGhpcy5hbmFseXNlciA9IGFuYWx5c2VyO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gYW5hbHlzZXI7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZE5vZGVzLnByb3RvdHlwZSwgXCJmaWx0ZXJzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmlsdGVycztcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIGlmICh0aGlzLl9maWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsdGVycy5mb3JFYWNoKGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyICYmIGZpbHRlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsdGVycyA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmFseXNlci5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlcnMgJiYgZmlsdGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWx0ZXJzID0gZmlsdGVycy5zbGljZSgwKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFuYWx5c2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJldkZpbHRlcl8xID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmaWx0ZXJzLmZvckVhY2goZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldkZpbHRlcl8xID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5hbmFseXNlci5jb25uZWN0KGZpbHRlci5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEuY29ubmVjdChmaWx0ZXIuZGVzdGluYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByZXZGaWx0ZXJfMSA9IGZpbHRlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5idWZmZXJTb3VyY2UuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLnNjcmlwdE5vZGUuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5hbmFseXNlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5zY3JpcHROb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5nYWluTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIH07XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuY2xvbmVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcmlnID0gdGhpcy5idWZmZXJTb3VyY2U7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIGNsb25lLmJ1ZmZlciA9IG9yaWcuYnVmZmVyO1xuICAgICAgICBjbG9uZS5wbGF5YmFja1JhdGUudmFsdWUgPSBvcmlnLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgY2xvbmUubG9vcCA9IG9yaWcubG9vcDtcbiAgICAgICAgY2xvbmUuY29ubmVjdCh0aGlzLmRlc3RpbmF0aW9uKTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kTm9kZXM7XG59KCkpO1xuU291bmROb2Rlcy5CVUZGRVJfU0laRSA9IDI1Njtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kTm9kZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZE5vZGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNvdW5kXzEgPSByZXF1aXJlKFwiLi9Tb3VuZFwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4vaW5kZXhcIik7XG52YXIgdXVpZCA9IHJlcXVpcmUoXCJ1dWlkXCIpO1xudmFyIFNvdW5kVXRpbHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kVXRpbHMoKSB7XG4gICAgfVxuICAgIFNvdW5kVXRpbHMuc2luZVRvbmUgPSBmdW5jdGlvbiAoaGVydHosIHNlY29uZHMpIHtcbiAgICAgICAgaWYgKGhlcnR6ID09PSB2b2lkIDApIHsgaGVydHogPSAyMDA7IH1cbiAgICAgICAgaWYgKHNlY29uZHMgPT09IHZvaWQgMCkgeyBzZWNvbmRzID0gMTsgfVxuICAgICAgICB2YXIgc291bmRDb250ZXh0ID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQ7XG4gICAgICAgIHZhciBzb3VuZEluc3RhbmNlID0gbmV3IFNvdW5kXzEuZGVmYXVsdChzb3VuZENvbnRleHQsIHtcbiAgICAgICAgICAgIHNpbmdsZUluc3RhbmNlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgbkNoYW5uZWxzID0gMTtcbiAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSA0ODAwMDtcbiAgICAgICAgdmFyIGFtcGxpdHVkZSA9IDI7XG4gICAgICAgIHZhciBidWZmZXIgPSBzb3VuZENvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlcihuQ2hhbm5lbHMsIHNlY29uZHMgKiBzYW1wbGVSYXRlLCBzYW1wbGVSYXRlKTtcbiAgICAgICAgdmFyIGZBcnJheSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0aW1lID0gaSAvIGJ1ZmZlci5zYW1wbGVSYXRlO1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gaGVydHogKiB0aW1lICogTWF0aC5QSTtcbiAgICAgICAgICAgIGZBcnJheVtpXSA9IE1hdGguc2luKGFuZ2xlKSAqIGFtcGxpdHVkZTtcbiAgICAgICAgfVxuICAgICAgICBzb3VuZEluc3RhbmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgc291bmRJbnN0YW5jZS5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBzb3VuZEluc3RhbmNlO1xuICAgIH07XG4gICAgU291bmRVdGlscy5wbGF5T25jZSA9IGZ1bmN0aW9uIChzcmMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhbGlhcyA9IHV1aWQudjQoKTtcbiAgICAgICAgaW5kZXhfMS5kZWZhdWx0LmFkZChhbGlhcywge1xuICAgICAgICAgICAgc3JjOiBzcmMsXG4gICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgYXV0b1BsYXk6IHRydWUsXG4gICAgICAgICAgICBsb2FkZWQ6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhfMS5kZWZhdWx0LnJlbW92ZShhbGlhcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGluZGV4XzEuZGVmYXVsdC5yZW1vdmUoYWxpYXMpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYWxpYXM7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRVdGlscztcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZFV0aWxzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmRVdGlscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBTb3VuZExpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL1NvdW5kTGlicmFyeVwiKTtcbnZhciBTb3VuZF8xID0gcmVxdWlyZShcIi4vU291bmRcIik7XG52YXIgU291bmRMaWJyYXJ5UHJvdG90eXBlID0gU291bmRMaWJyYXJ5XzEuZGVmYXVsdC5wcm90b3R5cGU7XG52YXIgU291bmRQcm90b3R5cGUgPSBTb3VuZF8xLmRlZmF1bHQucHJvdG90eXBlO1xuU291bmRMaWJyYXJ5UHJvdG90eXBlLnNvdW5kID0gZnVuY3Rpb24gc291bmQoYWxpYXMpIHtcbiAgICBjb25zb2xlLndhcm4oJ1BJWEkuc291bmQuc291bmQgaXMgZGVwcmVjYXRlZCwgdXNlIFBJWEkuc291bmQuZmluZCcpO1xuICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpO1xufTtcblNvdW5kTGlicmFyeVByb3RvdHlwZS5wYW5uaW5nID0gZnVuY3Rpb24gKGFsaWFzLCBwYW5uaW5nKSB7XG4gICAgY29uc29sZS53YXJuKCdQSVhJLnNvdW5kLnBhbm5pbmcgaXMgZGVwcmVjYXRlZCwgdXNlIFBJWEkuc291bmQuZmlsdGVycy5TdGVyZW9QYW4nKTtcbiAgICByZXR1cm4gMDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRMaWJyYXJ5UHJvdG90eXBlLCAnU291bmRVdGlscycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQSVhJLnNvdW5kLlNvdW5kVXRpbHMgaXMgZGVwcmVjYXRlZCwgdXNlIFBJWEkuc291bmQudXRpbHMnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudXRpbHM7XG4gICAgfVxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRQcm90b3R5cGUsICdibG9jaycsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQSVhJLnNvdW5kLlNvdW5kLnByb3RvdHlwZS5ibG9jayBpcyBkZXByZWNhdGVkLCB1c2Ugc2luZ2xlSW5zdGFuY2UgaW5zdGVhZCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5zaW5nbGVJbnN0YW5jZTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignUElYSS5zb3VuZC5Tb3VuZC5wcm90b3R5cGUuYmxvY2sgaXMgZGVwcmVjYXRlZCwgdXNlIHNpbmdsZUluc3RhbmNlIGluc3RlYWQnKTtcbiAgICAgICAgdGhpcy5zaW5nbGVJbnN0YW5jZSA9IHZhbHVlO1xuICAgIH1cbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGVwcmVjYXRpb25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBEaXN0b3J0aW9uRmlsdGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRGlzdG9ydGlvbkZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBEaXN0b3J0aW9uRmlsdGVyKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09PSB2b2lkIDApIHsgYW1vdW50ID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZGlzdG9ydGlvbiA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dC5jcmVhdGVXYXZlU2hhcGVyKCk7XG4gICAgICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgZGlzdG9ydGlvbikgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX2Rpc3RvcnRpb24gPSBkaXN0b3J0aW9uO1xuICAgICAgICBfdGhpcy5hbW91bnQgPSBhbW91bnQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERpc3RvcnRpb25GaWx0ZXIucHJvdG90eXBlLCBcImFtb3VudFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Ftb3VudDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHZhbHVlICo9IDEwMDA7XG4gICAgICAgICAgICB0aGlzLl9hbW91bnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHZhciBzYW1wbGVzID0gNDQxMDA7XG4gICAgICAgICAgICB2YXIgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KHNhbXBsZXMpO1xuICAgICAgICAgICAgdmFyIGRlZyA9IE1hdGguUEkgLyAxODA7XG4gICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICB2YXIgeDtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgc2FtcGxlczsgKytpKSB7XG4gICAgICAgICAgICAgICAgeCA9IGkgKiAyIC8gc2FtcGxlcyAtIDE7XG4gICAgICAgICAgICAgICAgY3VydmVbaV0gPSAoMyArIHZhbHVlKSAqIHggKiAyMCAqIGRlZyAvIChNYXRoLlBJICsgdmFsdWUgKiBNYXRoLmFicyh4KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9kaXN0b3J0aW9uLmN1cnZlID0gY3VydmU7XG4gICAgICAgICAgICB0aGlzLl9kaXN0b3J0aW9uLm92ZXJzYW1wbGUgPSAnNHgnO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBEaXN0b3J0aW9uRmlsdGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9kaXN0b3J0aW9uID0gbnVsbDtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gRGlzdG9ydGlvbkZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRGlzdG9ydGlvbkZpbHRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURpc3RvcnRpb25GaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIEVxdWFsaXplckZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKEVxdWFsaXplckZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBFcXVhbGl6ZXJGaWx0ZXIoZjMyLCBmNjQsIGYxMjUsIGYyNTAsIGY1MDAsIGYxaywgZjJrLCBmNGssIGY4aywgZjE2aykge1xuICAgICAgICBpZiAoZjMyID09PSB2b2lkIDApIHsgZjMyID0gMDsgfVxuICAgICAgICBpZiAoZjY0ID09PSB2b2lkIDApIHsgZjY0ID0gMDsgfVxuICAgICAgICBpZiAoZjEyNSA9PT0gdm9pZCAwKSB7IGYxMjUgPSAwOyB9XG4gICAgICAgIGlmIChmMjUwID09PSB2b2lkIDApIHsgZjI1MCA9IDA7IH1cbiAgICAgICAgaWYgKGY1MDAgPT09IHZvaWQgMCkgeyBmNTAwID0gMDsgfVxuICAgICAgICBpZiAoZjFrID09PSB2b2lkIDApIHsgZjFrID0gMDsgfVxuICAgICAgICBpZiAoZjJrID09PSB2b2lkIDApIHsgZjJrID0gMDsgfVxuICAgICAgICBpZiAoZjRrID09PSB2b2lkIDApIHsgZjRrID0gMDsgfVxuICAgICAgICBpZiAoZjhrID09PSB2b2lkIDApIHsgZjhrID0gMDsgfVxuICAgICAgICBpZiAoZjE2ayA9PT0gdm9pZCAwKSB7IGYxNmsgPSAwOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBlcXVhbGl6ZXJCYW5kcyA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjMyLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdsb3dzaGVsZicsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjMyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GNjQsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGY2NFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjEyNSxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjEyNVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjI1MCxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjI1MFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjUwMCxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjUwMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjFLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmMWtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYySyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjJrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GNEssXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGY0a1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjhLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmOGtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxNkssXG4gICAgICAgICAgICAgICAgdHlwZTogJ2hpZ2hzaGVsZicsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjE2a1xuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICB2YXIgYmFuZHMgPSBlcXVhbGl6ZXJCYW5kcy5tYXAoZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlQmlxdWFkRmlsdGVyKCk7XG4gICAgICAgICAgICBmaWx0ZXIudHlwZSA9IGJhbmQudHlwZTtcbiAgICAgICAgICAgIGZpbHRlci5nYWluLnZhbHVlID0gYmFuZC5nYWluO1xuICAgICAgICAgICAgZmlsdGVyLlEudmFsdWUgPSAxO1xuICAgICAgICAgICAgZmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IGJhbmQuZjtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXI7XG4gICAgICAgIH0pO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGJhbmRzWzBdLCBiYW5kc1tiYW5kcy5sZW5ndGggLSAxXSkgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuYmFuZHMgPSBiYW5kcztcbiAgICAgICAgX3RoaXMuYmFuZHNNYXAgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfdGhpcy5iYW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBfdGhpcy5iYW5kc1tpXTtcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmJhbmRzW2kgLSAxXS5jb25uZWN0KG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuYmFuZHNNYXBbbm9kZS5mcmVxdWVuY3kudmFsdWVdID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIEVxdWFsaXplckZpbHRlci5wcm90b3R5cGUuc2V0R2FpbiA9IGZ1bmN0aW9uIChmcmVxdWVuY3ksIGdhaW4pIHtcbiAgICAgICAgaWYgKGdhaW4gPT09IHZvaWQgMCkgeyBnYWluID0gMDsgfVxuICAgICAgICBpZiAoIXRoaXMuYmFuZHNNYXBbZnJlcXVlbmN5XSkge1xuICAgICAgICAgICAgdGhyb3cgJ05vIGJhbmQgZm91bmQgZm9yIGZyZXF1ZW5jeSAnICsgZnJlcXVlbmN5O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFuZHNNYXBbZnJlcXVlbmN5XS5nYWluLnZhbHVlID0gZ2FpbjtcbiAgICB9O1xuICAgIEVxdWFsaXplckZpbHRlci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYmFuZHMuZm9yRWFjaChmdW5jdGlvbiAoYmFuZCkge1xuICAgICAgICAgICAgYmFuZC5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYmFuZHMuZm9yRWFjaChmdW5jdGlvbiAoYmFuZCkge1xuICAgICAgICAgICAgYmFuZC5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJhbmRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5iYW5kc01hcCA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gRXF1YWxpemVyRmlsdGVyO1xufShGaWx0ZXJfMS5kZWZhdWx0KSk7XG5FcXVhbGl6ZXJGaWx0ZXIuRjMyID0gMzI7XG5FcXVhbGl6ZXJGaWx0ZXIuRjY0ID0gNjQ7XG5FcXVhbGl6ZXJGaWx0ZXIuRjEyNSA9IDEyNTtcbkVxdWFsaXplckZpbHRlci5GMjUwID0gMjUwO1xuRXF1YWxpemVyRmlsdGVyLkY1MDAgPSA1MDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjFLID0gMTAwMDtcbkVxdWFsaXplckZpbHRlci5GMksgPSAyMDAwO1xuRXF1YWxpemVyRmlsdGVyLkY0SyA9IDQwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjhLID0gODAwMDtcbkVxdWFsaXplckZpbHRlci5GMTZLID0gMTYwMDA7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBFcXVhbGl6ZXJGaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FcXVhbGl6ZXJGaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgRmlsdGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaWx0ZXIoZGVzdGluYXRpb24sIHNvdXJjZSkge1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gZGVzdGluYXRpb247XG4gICAgICAgIHRoaXMuc291cmNlID0gc291cmNlIHx8IGRlc3RpbmF0aW9uO1xuICAgIH1cbiAgICBGaWx0ZXIucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAoZGVzdGluYXRpb24pIHtcbiAgICAgICAgdGhpcy5zb3VyY2UuY29ubmVjdChkZXN0aW5hdGlvbik7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc291cmNlLmRpc2Nvbm5lY3QoKTtcbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnNvdXJjZSA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gRmlsdGVyO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEZpbHRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZpbHRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi4vaW5kZXhcIik7XG52YXIgUmV2ZXJiRmlsdGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUmV2ZXJiRmlsdGVyLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJldmVyYkZpbHRlcihzZWNvbmRzLCBkZWNheSwgcmV2ZXJzZSkge1xuICAgICAgICBpZiAoc2Vjb25kcyA9PT0gdm9pZCAwKSB7IHNlY29uZHMgPSAzOyB9XG4gICAgICAgIGlmIChkZWNheSA9PT0gdm9pZCAwKSB7IGRlY2F5ID0gMjsgfVxuICAgICAgICBpZiAocmV2ZXJzZSA9PT0gdm9pZCAwKSB7IHJldmVyc2UgPSBmYWxzZTsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgY29udm9sdmVyID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUNvbnZvbHZlcigpO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGNvbnZvbHZlcikgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX2NvbnZvbHZlciA9IGNvbnZvbHZlcjtcbiAgICAgICAgX3RoaXMuX3NlY29uZHMgPSBfdGhpcy5fY2xhbXAoc2Vjb25kcywgMSwgNTApO1xuICAgICAgICBfdGhpcy5fZGVjYXkgPSBfdGhpcy5fY2xhbXAoZGVjYXksIDAsIDEwMCk7XG4gICAgICAgIF90aGlzLl9yZXZlcnNlID0gcmV2ZXJzZTtcbiAgICAgICAgX3RoaXMuX3JlYnVpbGQoKTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLl9jbGFtcCA9IGZ1bmN0aW9uICh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCB2YWx1ZSkpO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJldmVyYkZpbHRlci5wcm90b3R5cGUsIFwic2Vjb25kc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NlY29uZHM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHNlY29uZHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlY29uZHMgPSB0aGlzLl9jbGFtcChzZWNvbmRzLCAxLCA1MCk7XG4gICAgICAgICAgICB0aGlzLl9yZWJ1aWxkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZXZlcmJGaWx0ZXIucHJvdG90eXBlLCBcImRlY2F5XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjYXk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGRlY2F5KSB7XG4gICAgICAgICAgICB0aGlzLl9kZWNheSA9IHRoaXMuX2NsYW1wKGRlY2F5LCAwLCAxMDApO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmV2ZXJiRmlsdGVyLnByb3RvdHlwZSwgXCJyZXZlcnNlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmV2ZXJzZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocmV2ZXJzZSkge1xuICAgICAgICAgICAgdGhpcy5fcmV2ZXJzZSA9IHJldmVyc2U7XG4gICAgICAgICAgICB0aGlzLl9yZWJ1aWxkKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFJldmVyYkZpbHRlci5wcm90b3R5cGUuX3JlYnVpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0O1xuICAgICAgICB2YXIgcmF0ZSA9IGNvbnRleHQuc2FtcGxlUmF0ZTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHJhdGUgKiB0aGlzLl9zZWNvbmRzO1xuICAgICAgICB2YXIgaW1wdWxzZSA9IGNvbnRleHQuY3JlYXRlQnVmZmVyKDIsIGxlbmd0aCwgcmF0ZSk7XG4gICAgICAgIHZhciBpbXB1bHNlTCA9IGltcHVsc2UuZ2V0Q2hhbm5lbERhdGEoMCk7XG4gICAgICAgIHZhciBpbXB1bHNlUiA9IGltcHVsc2UuZ2V0Q2hhbm5lbERhdGEoMSk7XG4gICAgICAgIHZhciBuO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuID0gdGhpcy5fcmV2ZXJzZSA/IGxlbmd0aCAtIGkgOiBpO1xuICAgICAgICAgICAgaW1wdWxzZUxbaV0gPSAoTWF0aC5yYW5kb20oKSAqIDIgLSAxKSAqIE1hdGgucG93KDEgLSBuIC8gbGVuZ3RoLCB0aGlzLl9kZWNheSk7XG4gICAgICAgICAgICBpbXB1bHNlUltpXSA9IChNYXRoLnJhbmRvbSgpICogMiAtIDEpICogTWF0aC5wb3coMSAtIG4gLyBsZW5ndGgsIHRoaXMuX2RlY2F5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb252b2x2ZXIuYnVmZmVyID0gaW1wdWxzZTtcbiAgICB9O1xuICAgIFJldmVyYkZpbHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udm9sdmVyID0gbnVsbDtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gUmV2ZXJiRmlsdGVyO1xufShGaWx0ZXJfMS5kZWZhdWx0KSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBSZXZlcmJGaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1SZXZlcmJGaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIFN0ZXJlb0ZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFN0ZXJlb0ZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTdGVyZW9GaWx0ZXIocGFuKSB7XG4gICAgICAgIGlmIChwYW4gPT09IHZvaWQgMCkgeyBwYW4gPSAwOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzdGVyZW87XG4gICAgICAgIHZhciBwYW5uZXI7XG4gICAgICAgIHZhciBkZXN0aW5hdGlvbjtcbiAgICAgICAgdmFyIGF1ZGlvQ29udGV4dCA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dDtcbiAgICAgICAgaWYgKGF1ZGlvQ29udGV4dC5jcmVhdGVTdGVyZW9QYW5uZXIpIHtcbiAgICAgICAgICAgIHN0ZXJlbyA9IGF1ZGlvQ29udGV4dC5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gc3RlcmVvO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFubmVyID0gYXVkaW9Db250ZXh0LmNyZWF0ZVBhbm5lcigpO1xuICAgICAgICAgICAgcGFubmVyLnBhbm5pbmdNb2RlbCA9ICdlcXVhbHBvd2VyJztcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gcGFubmVyO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgZGVzdGluYXRpb24pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9zdGVyZW8gPSBzdGVyZW87XG4gICAgICAgIF90aGlzLl9wYW5uZXIgPSBwYW5uZXI7XG4gICAgICAgIF90aGlzLnBhbiA9IHBhbjtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RlcmVvRmlsdGVyLnByb3RvdHlwZSwgXCJwYW5cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYW47XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9wYW4gPSB2YWx1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdGVyZW8pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGVyZW8ucGFuLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYW5uZXIuc2V0UG9zaXRpb24odmFsdWUsIDAsIDEgLSBNYXRoLmFicyh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTdGVyZW9GaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLl9zdGVyZW8gPSBudWxsO1xuICAgICAgICB0aGlzLl9wYW5uZXIgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFN0ZXJlb0ZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU3RlcmVvRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3RlcmVvRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xuZXhwb3J0cy5GaWx0ZXIgPSBGaWx0ZXJfMS5kZWZhdWx0O1xudmFyIEVxdWFsaXplckZpbHRlcl8xID0gcmVxdWlyZShcIi4vRXF1YWxpemVyRmlsdGVyXCIpO1xuZXhwb3J0cy5FcXVhbGl6ZXJGaWx0ZXIgPSBFcXVhbGl6ZXJGaWx0ZXJfMS5kZWZhdWx0O1xudmFyIERpc3RvcnRpb25GaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0Rpc3RvcnRpb25GaWx0ZXJcIik7XG5leHBvcnRzLkRpc3RvcnRpb25GaWx0ZXIgPSBEaXN0b3J0aW9uRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBTdGVyZW9GaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL1N0ZXJlb0ZpbHRlclwiKTtcbmV4cG9ydHMuU3RlcmVvRmlsdGVyID0gU3RlcmVvRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBSZXZlcmJGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL1JldmVyYkZpbHRlclwiKTtcbmV4cG9ydHMuUmV2ZXJiRmlsdGVyID0gUmV2ZXJiRmlsdGVyXzEuZGVmYXVsdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNvdW5kTGlicmFyeV8xID0gcmVxdWlyZShcIi4vU291bmRMaWJyYXJ5XCIpO1xudmFyIExvYWRlck1pZGRsZXdhcmVfMSA9IHJlcXVpcmUoXCIuL0xvYWRlck1pZGRsZXdhcmVcIik7XG5yZXF1aXJlKFwiLi9kZXByZWNhdGlvbnNcIik7XG52YXIgc291bmQgPSBuZXcgU291bmRMaWJyYXJ5XzEuZGVmYXVsdCgpO1xuaWYgKGdsb2JhbC5QSVhJID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBcInBpeGkuanMgaXMgcmVxdWlyZWRcIjtcbn1cbmlmIChQSVhJLmxvYWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIExvYWRlck1pZGRsZXdhcmVfMS5pbnN0YWxsKCk7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUElYSSwgJ3NvdW5kJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gc291bmQ7IH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gc291bmQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJ2YXIgdjEgPSByZXF1aXJlKCcuL3YxJyk7XG52YXIgdjQgPSByZXF1aXJlKCcuL3Y0Jyk7XG5cbnZhciB1dWlkID0gdjQ7XG51dWlkLnYxID0gdjE7XG51dWlkLnY0ID0gdjQ7XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiIsIi8qKlxuICogQ29udmVydCBhcnJheSBvZiAxNiBieXRlIHZhbHVlcyB0byBVVUlEIHN0cmluZyBmb3JtYXQgb2YgdGhlIGZvcm06XG4gKiBYWFhYWFhYWC1YWFhYLVhYWFgtWFhYWC1YWFhYLVhYWFhYWFhYWFhYWFxuICovXG52YXIgYnl0ZVRvSGV4ID0gW107XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSB7XG4gIGJ5dGVUb0hleFtpXSA9IChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSk7XG59XG5cbmZ1bmN0aW9uIGJ5dGVzVG9VdWlkKGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gb2Zmc2V0IHx8IDA7XG4gIHZhciBidGggPSBieXRlVG9IZXg7XG4gIHJldHVybiAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ5dGVzVG9VdWlkO1xuIiwiLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIEluIHRoZVxuLy8gYnJvd3NlciB0aGlzIGlzIGEgbGl0dGxlIGNvbXBsaWNhdGVkIGR1ZSB0byB1bmtub3duIHF1YWxpdHkgb2YgTWF0aC5yYW5kb20oKVxuLy8gYW5kIGluY29uc2lzdGVudCBzdXBwb3J0IGZvciB0aGUgYGNyeXB0b2AgQVBJLiAgV2UgZG8gdGhlIGJlc3Qgd2UgY2FuIHZpYVxuLy8gZmVhdHVyZS1kZXRlY3Rpb25cbnZhciBybmc7XG5cbnZhciBjcnlwdG8gPSBnbG9iYWwuY3J5cHRvIHx8IGdsb2JhbC5tc0NyeXB0bzsgLy8gZm9yIElFIDExXG5pZiAoY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0byBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIHZhciBybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMocm5kczgpO1xuICAgIHJldHVybiBybmRzODtcbiAgfTtcbn1cblxuaWYgKCFybmcpIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgIHJuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgcm5kc1tpXSA9IHIgPj4+ICgoaSAmIDB4MDMpIDw8IDMpICYgMHhmZjtcbiAgICB9XG5cbiAgICByZXR1cm4gcm5kcztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBybmc7XG4iLCIvLyBVbmlxdWUgSUQgY3JlYXRpb24gcmVxdWlyZXMgYSBoaWdoIHF1YWxpdHkgcmFuZG9tICMgZ2VuZXJhdG9yLiAgV2UgZmVhdHVyZVxuLy8gZGV0ZWN0IHRvIGRldGVybWluZSB0aGUgYmVzdCBSTkcgc291cmNlLCBub3JtYWxpemluZyB0byBhIGZ1bmN0aW9uIHRoYXRcbi8vIHJldHVybnMgMTI4LWJpdHMgb2YgcmFuZG9tbmVzcywgc2luY2UgdGhhdCdzIHdoYXQncyB1c3VhbGx5IHJlcXVpcmVkXG52YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG4vLyAqKmB2MSgpYCAtIEdlbmVyYXRlIHRpbWUtYmFzZWQgVVVJRCoqXG4vL1xuLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL0xpb3NLL1VVSUQuanNcbi8vIGFuZCBodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvdXVpZC5odG1sXG5cbi8vIHJhbmRvbSAjJ3Mgd2UgbmVlZCB0byBpbml0IG5vZGUgYW5kIGNsb2Nrc2VxXG52YXIgX3NlZWRCeXRlcyA9IHJuZygpO1xuXG4vLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbnZhciBfbm9kZUlkID0gW1xuICBfc2VlZEJ5dGVzWzBdIHwgMHgwMSxcbiAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuXTtcblxuLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcbnZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbi8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxudmFyIF9sYXN0TVNlY3MgPSAwLCBfbGFzdE5TZWNzID0gMDtcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG4gIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjbG9ja3NlcSA9IG9wdGlvbnMuY2xvY2tzZXEgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY2xvY2tzZXEgOiBfY2xvY2tzZXE7XG5cbiAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgLy8gdGltZSBpcyBoYW5kbGVkIGludGVybmFsbHkgYXMgJ21zZWNzJyAoaW50ZWdlciBtaWxsaXNlY29uZHMpIGFuZCAnbnNlY3MnXG4gIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXG4gIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAvLyBUaW1lIHNpbmNlIGxhc3QgdXVpZCBjcmVhdGlvbiAoaW4gbXNlY3MpXG4gIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICBpZiAoZHQgPCAwICYmIG9wdGlvbnMuY2xvY2tzZXEgPT09IHVuZGVmaW5lZCkge1xuICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICB9XG5cbiAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcbiAgLy8gdGltZSBpbnRlcnZhbFxuICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT09IHVuZGVmaW5lZCkge1xuICAgIG5zZWNzID0gMDtcbiAgfVxuXG4gIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgaWYgKG5zZWNzID49IDEwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gIH1cblxuICBfbGFzdE1TZWNzID0gbXNlY3M7XG4gIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXG4gIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gIC8vIGB0aW1lX2xvd2BcbiAgdmFyIHRsID0gKChtc2VjcyAmIDB4ZmZmZmZmZikgKiAxMDAwMCArIG5zZWNzKSAlIDB4MTAwMDAwMDAwO1xuICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAvLyBgdGltZV9taWRgXG4gIHZhciB0bWggPSAobXNlY3MgLyAweDEwMDAwMDAwMCAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxuICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gIC8vIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYCAoUGVyIDQuMi4yIC0gaW5jbHVkZSB2YXJpYW50KVxuICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gIGJbaSsrXSA9IGNsb2Nrc2VxICYgMHhmZjtcblxuICAvLyBgbm9kZWBcbiAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyArK24pIHtcbiAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gIH1cblxuICByZXR1cm4gYnVmID8gYnVmIDogYnl0ZXNUb1V1aWQoYik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdjE7XG4iLCJ2YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG5mdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IHJuZykoKTtcblxuICAvLyBQZXIgNC40LCBzZXQgYml0cyBmb3IgdmVyc2lvbiBhbmQgYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgXG4gIHJuZHNbNl0gPSAocm5kc1s2XSAmIDB4MGYpIHwgMHg0MDtcbiAgcm5kc1s4XSA9IChybmRzWzhdICYgMHgzZikgfCAweDgwO1xuXG4gIC8vIENvcHkgYnl0ZXMgdG8gYnVmZmVyLCBpZiBwcm92aWRlZFxuICBpZiAoYnVmKSB7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IDE2OyArK2lpKSB7XG4gICAgICBidWZbaSArIGlpXSA9IHJuZHNbaWldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWYgfHwgYnl0ZXNUb1V1aWQocm5kcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdjQ7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbCwgYWMsIGNiKSB7XG4gIGZ1bmN0aW9uIGhhbmRsZUlPUyhlKSB7XG4gICAgdmFyIGJ1ZmZlciA9IGFjLmNyZWF0ZUJ1ZmZlcigxLCAxLCAyMjA1MClcbiAgICB2YXIgc291cmNlID0gYWMuY3JlYXRlQnVmZmVyU291cmNlKClcbiAgICBzb3VyY2UuYnVmZmVyID0gYnVmZmVyXG4gICAgc291cmNlLmNvbm5lY3QoYWMuZGVzdGluYXRpb24pXG4gICAgc291cmNlLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKVxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVJT1MsIGZhbHNlKVxuICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBoYW5kbGVJT1MsIGZhbHNlKVxuICAgICAgY2Ioc291cmNlLnBsYXliYWNrU3RhdGUgPT09IHNvdXJjZS5QTEFZSU5HX1NUQVRFIHx8IHNvdXJjZS5wbGF5YmFja1N0YXRlID09PSBzb3VyY2UuRklOSVNIRURfU1RBVEUpXG4gICAgfSwgMSlcbiAgfVxuICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVJT1MsIGZhbHNlKVxuICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZUlPUywgZmFsc2UpXG59XG4iXX0=
