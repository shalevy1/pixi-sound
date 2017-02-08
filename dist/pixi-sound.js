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
            block: false,
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
        this.block = options.block;
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
        if (this.block) {
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

},{}],4:[function(require,module,exports){
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
            block: true
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
var SoundLibraryPrototype = SoundLibrary_1.default.prototype;
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

},{"./SoundLibrary":5}],9:[function(require,module,exports){
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
        var stereo = index_1.default.context.audioContext.createStereoPanner();
        _this = _super.call(this, stereo) || this;
        _this._stereo = stereo;
        _this.pan = pan;
        return _this;
    }
    Object.defineProperty(StereoFilter.prototype, "pan", {
        get: function () {
            return this._pan;
        },
        set: function (value) {
            this._pan = value;
            this._stereo.pan.value = value;
        },
        enumerable: true,
        configurable: true
    });
    StereoFilter.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this._stereo = null;
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

},{"./lib/bytesToUuid":17,"./lib/rng":18}]},{},[15])(15)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTG9hZGVyTWlkZGxld2FyZS5qcyIsImxpYi9Tb3VuZC5qcyIsImxpYi9Tb3VuZENvbnRleHQuanMiLCJsaWIvU291bmRJbnN0YW5jZS5qcyIsImxpYi9Tb3VuZExpYnJhcnkuanMiLCJsaWIvU291bmROb2Rlcy5qcyIsImxpYi9Tb3VuZFV0aWxzLmpzIiwibGliL2RlcHJlY2F0aW9ucy5qcyIsImxpYi9maWx0ZXJzL0Rpc3RvcnRpb25GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9FcXVhbGl6ZXJGaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9SZXZlcmJGaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9TdGVyZW9GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9pbmRleC5qcyIsImxpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL2J5dGVzVG9VdWlkLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL3JuZy1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvdjEuanMiLCJub2RlX21vZHVsZXMvdXVpZC92NC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuL2luZGV4XCIpO1xudmFyIEFVRElPX0VYVEVOU0lPTlMgPSBbJ3dhdicsICdtcDMnLCAnb2dnJywgJ29nYSddO1xuZnVuY3Rpb24gbWlkZGxld2FyZShyZXNvdXJjZSwgbmV4dCkge1xuICAgIGlmIChyZXNvdXJjZS5kYXRhICYmIEFVRElPX0VYVEVOU0lPTlMuaW5kZXhPZihyZXNvdXJjZS5fZ2V0RXh0ZW5zaW9uKCkpID4gLTEpIHtcbiAgICAgICAgcmVzb3VyY2Uuc291bmQgPSBpbmRleF8xLmRlZmF1bHQuYWRkKHJlc291cmNlLm5hbWUsIHtcbiAgICAgICAgICAgIHNyY0J1ZmZlcjogcmVzb3VyY2UuZGF0YSxcbiAgICAgICAgICAgIHByZWxvYWQ6IHRydWUsXG4gICAgICAgICAgICBsb2FkZWQ6IG5leHRcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxufVxuZnVuY3Rpb24gbWlkZGxld2FyZUZhY3RvcnkoKSB7XG4gICAgcmV0dXJuIG1pZGRsZXdhcmU7XG59XG5mdW5jdGlvbiBpbnN0YWxsKCkge1xuICAgIHZhciBSZXNvdXJjZSA9IFBJWEkubG9hZGVycy5SZXNvdXJjZTtcbiAgICBBVURJT19FWFRFTlNJT05TLmZvckVhY2goZnVuY3Rpb24gKGV4dCkge1xuICAgICAgICBSZXNvdXJjZS5zZXRFeHRlbnNpb25YaHJUeXBlKGV4dCwgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQlVGRkVSKTtcbiAgICAgICAgUmVzb3VyY2Uuc2V0RXh0ZW5zaW9uTG9hZFR5cGUoZXh0LCBSZXNvdXJjZS5MT0FEX1RZUEUuWEhSKTtcbiAgICB9KTtcbiAgICBQSVhJLmxvYWRlcnMuTG9hZGVyLmFkZFBpeGlNaWRkbGV3YXJlKG1pZGRsZXdhcmVGYWN0b3J5KTtcbiAgICBQSVhJLmxvYWRlci51c2UobWlkZGxld2FyZSk7XG59XG5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TG9hZGVyTWlkZGxld2FyZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBTb3VuZE5vZGVzXzEgPSByZXF1aXJlKFwiLi9Tb3VuZE5vZGVzXCIpO1xudmFyIFNvdW5kSW5zdGFuY2VfMSA9IHJlcXVpcmUoXCIuL1NvdW5kSW5zdGFuY2VcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuL2luZGV4XCIpO1xudmFyIFNvdW5kID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJzdHJpbmdcIiB8fCBvcHRpb25zIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyYzogb3B0aW9ucyB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdGlvbnMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHsgc3JjQnVmZmVyOiBvcHRpb25zIH07XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgYXV0b1BsYXk6IGZhbHNlLFxuICAgICAgICAgICAgYmxvY2s6IGZhbHNlLFxuICAgICAgICAgICAgc3JjOiBudWxsLFxuICAgICAgICAgICAgcHJlbG9hZDogZmFsc2UsXG4gICAgICAgICAgICB2b2x1bWU6IDEsXG4gICAgICAgICAgICBzcGVlZDogMSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBudWxsLFxuICAgICAgICAgICAgbG9hZGVkOiBudWxsLFxuICAgICAgICAgICAgbG9vcDogZmFsc2UsXG4gICAgICAgICAgICB1c2VYSFI6IHRydWVcbiAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5ldyBTb3VuZE5vZGVzXzEuZGVmYXVsdCh0aGlzLl9jb250ZXh0KTtcbiAgICAgICAgdGhpcy5fc291cmNlID0gdGhpcy5fbm9kZXMuYnVmZmVyU291cmNlO1xuICAgICAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXV0b1BsYXkgPSBvcHRpb25zLmF1dG9QbGF5O1xuICAgICAgICB0aGlzLmJsb2NrID0gb3B0aW9ucy5ibG9jaztcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gb3B0aW9ucy5wcmVsb2FkIHx8IHRoaXMuYXV0b1BsYXk7XG4gICAgICAgIHRoaXMuY29tcGxldGUgPSBvcHRpb25zLmNvbXBsZXRlO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IG9wdGlvbnMubG9hZGVkO1xuICAgICAgICB0aGlzLnNyYyA9IG9wdGlvbnMuc3JjO1xuICAgICAgICB0aGlzLnNyY0J1ZmZlciA9IG9wdGlvbnMuc3JjQnVmZmVyO1xuICAgICAgICB0aGlzLnVzZVhIUiA9IG9wdGlvbnMudXNlWEhSO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXMgPSBbXTtcbiAgICAgICAgdGhpcy52b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5sb29wID0gb3B0aW9ucy5sb29wO1xuICAgICAgICB0aGlzLnNwZWVkID0gb3B0aW9ucy5zcGVlZDtcbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fYmVnaW5QcmVsb2FkKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgU291bmQuZnJvbSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgU291bmQoaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQsIG9wdGlvbnMpO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX25vZGVzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fc291cmNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcmVtb3ZlSW5zdGFuY2VzKCk7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyA9IG51bGw7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImlzUGxheWFibGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlzTG9hZGVkICYmICEhdGhpcy5fc291cmNlICYmICEhdGhpcy5fc291cmNlLmJ1ZmZlcjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJjb250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJ2b2x1bWVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlcy5nYWluTm9kZS5nYWluLnZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2b2x1bWUpIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSB2b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwibG9vcFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvdXJjZS5sb29wO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChsb29wKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UubG9vcCA9ICEhbG9vcDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJidWZmZXJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UuYnVmZmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChidWZmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiZHVyYXRpb25cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KHRoaXMuaXNQbGF5YWJsZSwgJ1NvdW5kIG5vdCB5ZXQgcGxheWFibGUsIG5vIGR1cmF0aW9uJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc291cmNlLmJ1ZmZlci5kdXJhdGlvbjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJub2Rlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImZpbHRlcnNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlcy5maWx0ZXJzO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5maWx0ZXJzID0gZmlsdGVycztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJzcGVlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvdXJjZS5wbGF5YmFja1JhdGUudmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiaW5zdGFuY2VzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZC5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBvcHRpb25zID0geyBjb21wbGV0ZTogb3B0aW9ucyB9O1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiBudWxsLFxuICAgICAgICAgICAgbG9hZGVkOiBudWxsLFxuICAgICAgICAgICAgb2Zmc2V0OiAwXG4gICAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xuICAgICAgICBpZiAoIXRoaXMuaXNQbGF5YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5hdXRvUGxheSA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9hZGVkID0gb3B0aW9ucy5sb2FkZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRlZCA9IGxvYWRlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fYmVnaW5QcmVsb2FkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUluc3RhbmNlcygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IFNvdW5kSW5zdGFuY2VfMS5kZWZhdWx0LmNyZWF0ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpO1xuICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XG4gICAgICAgIGluc3RhbmNlLm9uY2UoJ2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jb21wbGV0ZShfdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5fb25Db21wbGV0ZShpbnN0YW5jZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbnN0YW5jZS5vbmNlKCdzdG9wJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuX29uQ29tcGxldGUoaW5zdGFuY2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5zdGFuY2UucGxheShvcHRpb25zLm9mZnNldCk7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNQbGF5YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5hdXRvUGxheSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLnN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLnBhdXNlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICA7XG4gICAgU291bmQucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCA+IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9iZWdpblByZWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNyYykge1xuICAgICAgICAgICAgdGhpcy51c2VYSFIgPyB0aGlzLl9sb2FkVXJsKCkgOiB0aGlzLl9sb2FkUGF0aCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc3JjQnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9kZWNvZGUodGhpcy5zcmNCdWZmZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMubG9hZGVkKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlZChuZXcgRXJyb3IoXCJzb3VuZC5zcmMgb3Igc291bmQuc3JjQnVmZmVyIG11c3QgYmUgc2V0XCIpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NvdW5kLnNyYyBvciBzb3VuZC5zcmNCdWZmZXIgbXVzdCBiZSBzZXQnKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9vbkNvbXBsZXRlID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbnN0YW5jZXMpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2luc3RhbmNlcy5pbmRleE9mKGluc3RhbmNlKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggPiAwO1xuICAgICAgICB9XG4gICAgICAgIGluc3RhbmNlLmRlc3Ryb3koKTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fcmVtb3ZlSW5zdGFuY2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0uZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcy5sZW5ndGggPSAwO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9sb2FkVXJsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB2YXIgc3JjID0gdGhpcy5zcmM7XG4gICAgICAgIHJlcXVlc3Qub3BlbignR0VUJywgc3JjLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIF90aGlzLnNyY0J1ZmZlciA9IHJlcXVlc3QucmVzcG9uc2U7XG4gICAgICAgICAgICBfdGhpcy5fZGVjb2RlKHJlcXVlc3QucmVzcG9uc2UpO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fbG9hZFBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG4gICAgICAgIHZhciBzcmMgPSB0aGlzLnNyYztcbiAgICAgICAgZnMucmVhZEZpbGUoc3JjLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5sb2FkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMubG9hZGVkKG5ldyBFcnJvcihcIkZpbGUgbm90IGZvdW5kIFwiICsgX3RoaXMuc3JjKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhcnJheUJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihkYXRhLmxlbmd0aCk7XG4gICAgICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHZpZXdbaV0gPSBkYXRhW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuX2RlY29kZShhcnJheUJ1ZmZlcik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9kZWNvZGUgPSBmdW5jdGlvbiAoYXJyYXlCdWZmZXIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5fY29udGV4dC5kZWNvZGUoYXJyYXlCdWZmZXIsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIF90aGlzLmxvYWRlZChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIF90aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmxvYWRlZChudWxsLCBfdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5hdXRvUGxheSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wbGF5KF90aGlzLmNvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU291bmRDb250ZXh0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZENvbnRleHQoKSB7XG4gICAgICAgIHRoaXMuX2N0eCA9IG5ldyBTb3VuZENvbnRleHQuQXVkaW9Db250ZXh0KCk7XG4gICAgICAgIHRoaXMuX29mZmxpbmVDdHggPSBuZXcgU291bmRDb250ZXh0Lk9mZmxpbmVBdWRpb0NvbnRleHQoMSwgMiwgdGhpcy5fY3R4LnNhbXBsZVJhdGUpO1xuICAgICAgICB0aGlzLl9nYWluTm9kZSA9IHRoaXMuX2N0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzb3IgPSB0aGlzLl9jdHguY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk7XG4gICAgICAgIHRoaXMuX2dhaW5Ob2RlLmNvbm5lY3QodGhpcy5fY29tcHJlc3Nvcik7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzb3IuY29ubmVjdCh0aGlzLl9jdHguZGVzdGluYXRpb24pO1xuICAgICAgICB0aGlzLnZvbHVtZSA9IDE7XG4gICAgICAgIHRoaXMubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dCwgXCJBdWRpb0NvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB3aW4gPSB3aW5kb3c7XG4gICAgICAgICAgICByZXR1cm4gKHdpbi5BdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICB3aW4ud2Via2l0QXVkaW9Db250ZXh0IHx8XG4gICAgICAgICAgICAgICAgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQsIFwiT2ZmbGluZUF1ZGlvQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHdpbiA9IHdpbmRvdztcbiAgICAgICAgICAgIHJldHVybiAod2luLk9mZmxpbmVBdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICB3aW4ud2Via2l0T2ZmbGluZUF1ZGlvQ29udGV4dCB8fFxuICAgICAgICAgICAgICAgIG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZENvbnRleHQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgIGlmICh0eXBlb2YgY3R4LmNsb3NlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3R4LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLl9jb21wcmVzc29yLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5fb2ZmbGluZUN0eCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2N0eCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2dhaW5Ob2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY29tcHJlc3NvciA9IG51bGw7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJhdWRpb0NvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jdHg7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcIm9mZmxpbmVDb250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb2ZmbGluZUN0eDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwibXV0ZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tdXRlZDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAobXV0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX211dGVkID0gISFtdXRlZDtcbiAgICAgICAgICAgIHRoaXMuX2dhaW5Ob2RlLmdhaW4udmFsdWUgPSB0aGlzLl9tdXRlZCA/IDAgOiB0aGlzLl92b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcInZvbHVtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX211dGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IHRoaXMuX3ZvbHVtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwicGF1c2VkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGF1c2VkO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChwYXVzZWQpIHtcbiAgICAgICAgICAgIGlmIChwYXVzZWQgJiYgdGhpcy5fY3R4LnN0YXRlID09PSAncnVubmluZycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdHguc3VzcGVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIXBhdXNlZCAmJiB0aGlzLl9jdHguc3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3R4LnJlc3VtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGF1c2VkID0gcGF1c2VkO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJkZXN0aW5hdGlvblwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dhaW5Ob2RlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZENvbnRleHQucHJvdG90eXBlLnRvZ2dsZU11dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubXV0ZWQgPSAhdGhpcy5tdXRlZDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX211dGVkO1xuICAgIH07XG4gICAgU291bmRDb250ZXh0LnByb3RvdHlwZS5kZWNvZGUgPSBmdW5jdGlvbiAoYXJyYXlCdWZmZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuX29mZmxpbmVDdHguZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyLCBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCBidWZmZXIpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ1VuYWJsZSB0byBkZWNvZGUgZmlsZScpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRDb250ZXh0O1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kQ29udGV4dDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kQ29udGV4dC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIGlkID0gMDtcbnZhciBTb3VuZEluc3RhbmNlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoU291bmRJbnN0YW5jZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTb3VuZEluc3RhbmNlKHBhcmVudCkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5pZCA9IGlkKys7XG4gICAgICAgIF90aGlzLl9wYXJlbnQgPSBudWxsO1xuICAgICAgICBfdGhpcy5fc3RhcnRUaW1lID0gMDtcbiAgICAgICAgX3RoaXMuX3BhdXNlZCA9IGZhbHNlO1xuICAgICAgICBfdGhpcy5fcG9zaXRpb24gPSAwO1xuICAgICAgICBfdGhpcy5fZHVyYXRpb24gPSAwO1xuICAgICAgICBfdGhpcy5fcHJvZ3Jlc3MgPSAwO1xuICAgICAgICBfdGhpcy5faW5pdChwYXJlbnQpO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFNvdW5kSW5zdGFuY2UuY3JlYXRlID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICBpZiAoU291bmRJbnN0YW5jZS5fcG9vbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgc291bmQgPSBTb3VuZEluc3RhbmNlLl9wb29sLnBvcCgpO1xuICAgICAgICAgICAgc291bmQuX2luaXQocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU291bmRJbnN0YW5jZShwYXJlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnc3RvcCcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24gKG9mZnNldCkge1xuICAgICAgICBpZiAob2Zmc2V0ID09PSB2b2lkIDApIHsgb2Zmc2V0ID0gMDsgfVxuICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IDA7XG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9wb3NpdGlvbiA9IG9mZnNldDtcbiAgICAgICAgdGhpcy5fc291cmNlID0gdGhpcy5fcGFyZW50Lm5vZGVzLmNsb25lQnVmZmVyU291cmNlKCk7XG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gdGhpcy5fc291cmNlLmJ1ZmZlci5kdXJhdGlvbjtcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gdGhpcy5fbm93O1xuICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IHRoaXMuX29uQ29tcGxldGUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fc291cmNlLnN0YXJ0KDAsIG9mZnNldCk7XG4gICAgICAgIHRoaXMuZW1pdCgnc3RhcnQnKTtcbiAgICAgICAgdGhpcy5lbWl0KCdwcm9ncmVzcycsIDApO1xuICAgICAgICB0aGlzLl9vblVwZGF0ZSgpO1xuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuX29uVXBkYXRlID0gZnVuY3Rpb24gKGVuYWJsZWQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGVuYWJsZWQgPT09IHZvaWQgMCkgeyBlbmFibGVkID0gdHJ1ZTsgfVxuICAgICAgICB0aGlzLl9wYXJlbnQubm9kZXMuc2NyaXB0Tm9kZS5vbmF1ZGlvcHJvY2VzcyA9ICFlbmFibGVkID8gbnVsbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLl91cGRhdGUoKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZEluc3RhbmNlLnByb3RvdHlwZSwgXCJwcm9ncmVzc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2dyZXNzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwicGF1c2VkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGF1c2VkO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChwYXVzZWQpIHtcbiAgICAgICAgICAgIGlmIChwYXVzZWQgIT09IHRoaXMuX3BhdXNlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhdXNlZCA9IHBhdXNlZDtcbiAgICAgICAgICAgICAgICBpZiAocGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ludGVybmFsU3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3BlZWQgPSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVlZCA9IHRoaXMuX3NvdXJjZS5wbGF5YmFja1JhdGUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcG9zaXRpb24gPSAodGhpcy5fbm93IC0gdGhpcy5fc3RhcnRUaW1lKSAqIHNwZWVkO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3BhdXNlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN1bWVkJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSh0aGlzLl9wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncGF1c2UnLCBwYXVzZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLm9uZW5kZWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3BhcmVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9wb3NpdGlvbiA9IDA7XG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gMDtcbiAgICAgICAgaWYgKFNvdW5kSW5zdGFuY2UuX3Bvb2wuaW5kZXhPZih0aGlzKSA8IDApIHtcbiAgICAgICAgICAgIFNvdW5kSW5zdGFuY2UuX3Bvb2wucHVzaCh0aGlzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnW1NvdW5kSW5zdGFuY2UgaWQ9JyArIHRoaXMuaWQgKyAnXSc7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwiX25vd1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmVudC5jb250ZXh0LmF1ZGlvQ29udGV4dC5jdXJyZW50VGltZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuX3VwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2R1cmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgc3BlZWQgPSB0aGlzLl9zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlO1xuICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gdGhpcy5fcGF1c2VkID8gdGhpcy5fcG9zaXRpb24gOiAodGhpcy5fbm93IC0gdGhpcy5fc3RhcnRUaW1lKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2dyZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgKHBvc2l0aW9uIC8gdGhpcy5fZHVyYXRpb24pICogc3BlZWQpKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncHJvZ3Jlc3MnLCB0aGlzLl9wcm9ncmVzcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5faW50ZXJuYWxTdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9vblVwZGF0ZShmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuX29uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9zb3VyY2UpIHtcbiAgICAgICAgICAgIHRoaXMuX29uVXBkYXRlKGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5vbmVuZGVkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IDE7XG4gICAgICAgIHRoaXMuZW1pdCgncHJvZ3Jlc3MnLCAxKTtcbiAgICAgICAgdGhpcy5lbWl0KCdlbmQnLCB0aGlzKTtcbiAgICB9O1xuICAgIHJldHVybiBTb3VuZEluc3RhbmNlO1xufShQSVhJLnV0aWxzLkV2ZW50RW1pdHRlcikpO1xuU291bmRJbnN0YW5jZS5fcG9vbCA9IFtdO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmRJbnN0YW5jZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kSW5zdGFuY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU291bmRDb250ZXh0XzEgPSByZXF1aXJlKFwiLi9Tb3VuZENvbnRleHRcIik7XG52YXIgU291bmRfMSA9IHJlcXVpcmUoXCIuL1NvdW5kXCIpO1xudmFyIFNvdW5kSW5zdGFuY2VfMSA9IHJlcXVpcmUoXCIuL1NvdW5kSW5zdGFuY2VcIik7XG52YXIgU291bmRVdGlsc18xID0gcmVxdWlyZShcIi4vU291bmRVdGlsc1wiKTtcbnZhciBmaWx0ZXJzID0gcmVxdWlyZShcIi4vZmlsdGVyc1wiKTtcbnZhciBTb3VuZExpYnJhcnkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kTGlicmFyeSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3VwcG9ydGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0ID0gbmV3IFNvdW5kQ29udGV4dF8xLmRlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zb3VuZHMgPSB7fTtcbiAgICAgICAgdGhpcy51dGlscyA9IFNvdW5kVXRpbHNfMS5kZWZhdWx0O1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzO1xuICAgICAgICB0aGlzLlNvdW5kID0gU291bmRfMS5kZWZhdWx0O1xuICAgICAgICB0aGlzLlNvdW5kSW5zdGFuY2UgPSBTb3VuZEluc3RhbmNlXzEuZGVmYXVsdDtcbiAgICAgICAgdGhpcy5Tb3VuZExpYnJhcnkgPSBTb3VuZExpYnJhcnk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnkucHJvdG90eXBlLCBcImNvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRMaWJyYXJ5LnByb3RvdHlwZSwgXCJzdXBwb3J0ZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBTb3VuZENvbnRleHRfMS5kZWZhdWx0LkF1ZGlvQ29udGV4dCAhPT0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAoYWxpYXMsIG9wdGlvbnMpIHtcbiAgICAgICAgY29uc29sZS5hc3NlcnQoIXRoaXMuX3NvdW5kc1thbGlhc10sIFwiU291bmQgd2l0aCBhbGlhcyBcIiArIGFsaWFzICsgXCIgYWxyZWFkeSBleGlzdHMuXCIpO1xuICAgICAgICB2YXIgc291bmQ7XG4gICAgICAgIGlmIChvcHRpb25zIGluc3RhbmNlb2YgU291bmRfMS5kZWZhdWx0KSB7XG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3NvdW5kc1thbGlhc10gPSBvcHRpb25zO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9zb3VuZHNbYWxpYXNdID0gbmV3IFNvdW5kXzEuZGVmYXVsdCh0aGlzLmNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzb3VuZDtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuYWRkTWFwID0gZnVuY3Rpb24gKG1hcCwgZ2xvYmFsT3B0aW9ucykge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IHt9O1xuICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiBtYXApIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdm9pZCAwO1xuICAgICAgICAgICAgdmFyIHNvdW5kID0gbWFwW2FsaWFzXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291bmQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0geyBzcmM6IHNvdW5kIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzb3VuZCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHsgc3JjQnVmZmVyOiBzb3VuZCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHNvdW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0c1thbGlhc10gPSB0aGlzLmFkZChhbGlhcywgT2JqZWN0LmFzc2lnbihvcHRpb25zLCBnbG9iYWxPcHRpb25zIHx8IHt9KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICB0aGlzLmV4aXN0cyhhbGlhcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnBhdXNlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0LnBhdXNlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5yZXN1bWVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQucGF1c2VkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5tdXRlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0Lm11dGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnVubXV0ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5tdXRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiB0aGlzLl9zb3VuZHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uZGVzdHJveSgpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3NvdW5kc1thbGlhc107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnN0b3BBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGFsaWFzIGluIHRoaXMuX3NvdW5kcykge1xuICAgICAgICAgICAgdGhpcy5fc291bmRzW2FsaWFzXS5zdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmV4aXN0cyA9IGZ1bmN0aW9uIChhbGlhcywgYXNzZXJ0KSB7XG4gICAgICAgIGlmIChhc3NlcnQgPT09IHZvaWQgMCkgeyBhc3NlcnQgPSBmYWxzZTsgfVxuICAgICAgICB2YXIgZXhpc3RzID0gISF0aGlzLl9zb3VuZHNbYWxpYXNdO1xuICAgICAgICBpZiAoYXNzZXJ0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydChleGlzdHMsIFwiTm8gc291bmQgbWF0Y2hpbmcgYWxpYXMgJ1wiICsgYWxpYXMgKyBcIicuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleGlzdHM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgdGhpcy5leGlzdHMoYWxpYXMsIHRydWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uIChhbGlhcywgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5wbGF5KG9wdGlvbnMpO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpLnN0b3AoKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykucGF1c2UoKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpLnJlc3VtZSgpO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS52b2x1bWUgPSBmdW5jdGlvbiAoYWxpYXMsIHZvbHVtZSkge1xuICAgICAgICB2YXIgc291bmQgPSB0aGlzLmZpbmQoYWxpYXMpO1xuICAgICAgICBpZiAodm9sdW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNvdW5kLnZvbHVtZSA9IHZvbHVtZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc291bmQudm9sdW1lO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5kdXJhdGlvbiA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5kdXJhdGlvbjtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGwoKTtcbiAgICAgICAgdGhpcy5fc291bmRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRMaWJyYXJ5O1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kTGlicmFyeTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kTGlicmFyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBTb3VuZE5vZGVzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZE5vZGVzKGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdmFyIGF1ZGlvQ29udGV4dCA9IHRoaXMuY29udGV4dC5hdWRpb0NvbnRleHQ7XG4gICAgICAgIHZhciBidWZmZXJTb3VyY2UgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIHZhciBzY3JpcHROb2RlID0gYXVkaW9Db250ZXh0LmNyZWF0ZVNjcmlwdFByb2Nlc3NvcihTb3VuZE5vZGVzLkJVRkZFUl9TSVpFKTtcbiAgICAgICAgdmFyIGdhaW5Ob2RlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdmFyIGFuYWx5c2VyID0gYXVkaW9Db250ZXh0LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgIGdhaW5Ob2RlLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgc2NyaXB0Tm9kZS5jb25uZWN0KHRoaXMuY29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgIGFuYWx5c2VyLmNvbm5lY3QoZ2Fpbk5vZGUpO1xuICAgICAgICBidWZmZXJTb3VyY2UuY29ubmVjdChhbmFseXNlcik7XG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlID0gYnVmZmVyU291cmNlO1xuICAgICAgICB0aGlzLnNjcmlwdE5vZGUgPSBzY3JpcHROb2RlO1xuICAgICAgICB0aGlzLmdhaW5Ob2RlID0gZ2Fpbk5vZGU7XG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSBhbmFseXNlcjtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IGFuYWx5c2VyO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmROb2Rlcy5wcm90b3R5cGUsIFwiZmlsdGVyc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlsdGVycykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbHRlcnMuZm9yRWFjaChmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlciAmJiBmaWx0ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbHRlcnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuYW5hbHlzZXIuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJzICYmIGZpbHRlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsdGVycyA9IGZpbHRlcnMuc2xpY2UoMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmFseXNlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZGaWx0ZXJfMSA9IG51bGw7XG4gICAgICAgICAgICAgICAgZmlsdGVycy5mb3JFYWNoKGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZGaWx0ZXJfMSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuYW5hbHlzZXIuY29ubmVjdChmaWx0ZXIuZGVzdGluYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldkZpbHRlcl8xLmNvbm5lY3QoZmlsdGVyLmRlc3RpbmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEgPSBmaWx0ZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcHJldkZpbHRlcl8xLmNvbm5lY3QodGhpcy5nYWluTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kTm9kZXMucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IG51bGw7XG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5zY3JpcHROb2RlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5nYWluTm9kZS5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuYW5hbHlzZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmJ1ZmZlclNvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuc2NyaXB0Tm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmFuYWx5c2VyID0gbnVsbDtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICB9O1xuICAgIFNvdW5kTm9kZXMucHJvdG90eXBlLmNsb25lQnVmZmVyU291cmNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3JpZyA9IHRoaXMuYnVmZmVyU291cmNlO1xuICAgICAgICB2YXIgY2xvbmUgPSB0aGlzLmNvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgICBjbG9uZS5idWZmZXIgPSBvcmlnLmJ1ZmZlcjtcbiAgICAgICAgY2xvbmUucGxheWJhY2tSYXRlLnZhbHVlID0gb3JpZy5wbGF5YmFja1JhdGUudmFsdWU7XG4gICAgICAgIGNsb25lLmxvb3AgPSBvcmlnLmxvb3A7XG4gICAgICAgIGNsb25lLmNvbm5lY3QodGhpcy5kZXN0aW5hdGlvbik7XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9O1xuICAgIHJldHVybiBTb3VuZE5vZGVzO1xufSgpKTtcblNvdW5kTm9kZXMuQlVGRkVSX1NJWkUgPSAyNTY7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZE5vZGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmROb2Rlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBTb3VuZF8xID0gcmVxdWlyZShcIi4vU291bmRcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuL2luZGV4XCIpO1xudmFyIHV1aWQgPSByZXF1aXJlKFwidXVpZFwiKTtcbnZhciBTb3VuZFV0aWxzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZFV0aWxzKCkge1xuICAgIH1cbiAgICBTb3VuZFV0aWxzLnNpbmVUb25lID0gZnVuY3Rpb24gKGhlcnR6LCBzZWNvbmRzKSB7XG4gICAgICAgIGlmIChoZXJ0eiA9PT0gdm9pZCAwKSB7IGhlcnR6ID0gMjAwOyB9XG4gICAgICAgIGlmIChzZWNvbmRzID09PSB2b2lkIDApIHsgc2Vjb25kcyA9IDE7IH1cbiAgICAgICAgdmFyIHNvdW5kQ29udGV4dCA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0O1xuICAgICAgICB2YXIgc291bmRJbnN0YW5jZSA9IG5ldyBTb3VuZF8xLmRlZmF1bHQoc291bmRDb250ZXh0LCB7XG4gICAgICAgICAgICBibG9jazogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIG5DaGFubmVscyA9IDE7XG4gICAgICAgIHZhciBzYW1wbGVSYXRlID0gNDgwMDA7XG4gICAgICAgIHZhciBhbXBsaXR1ZGUgPSAyO1xuICAgICAgICB2YXIgYnVmZmVyID0gc291bmRDb250ZXh0LmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXIobkNoYW5uZWxzLCBzZWNvbmRzICogc2FtcGxlUmF0ZSwgc2FtcGxlUmF0ZSk7XG4gICAgICAgIHZhciBmQXJyYXkgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZkFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGltZSA9IGkgLyBidWZmZXIuc2FtcGxlUmF0ZTtcbiAgICAgICAgICAgIHZhciBhbmdsZSA9IGhlcnR6ICogdGltZSAqIE1hdGguUEk7XG4gICAgICAgICAgICBmQXJyYXlbaV0gPSBNYXRoLnNpbihhbmdsZSkgKiBhbXBsaXR1ZGU7XG4gICAgICAgIH1cbiAgICAgICAgc291bmRJbnN0YW5jZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgIHNvdW5kSW5zdGFuY2UuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gc291bmRJbnN0YW5jZTtcbiAgICB9O1xuICAgIFNvdW5kVXRpbHMucGxheU9uY2UgPSBmdW5jdGlvbiAoc3JjLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgYWxpYXMgPSB1dWlkLnY0KCk7XG4gICAgICAgIGluZGV4XzEuZGVmYXVsdC5hZGQoYWxpYXMsIHtcbiAgICAgICAgICAgIHNyYzogc3JjLFxuICAgICAgICAgICAgcHJlbG9hZDogdHJ1ZSxcbiAgICAgICAgICAgIGF1dG9QbGF5OiB0cnVlLFxuICAgICAgICAgICAgbG9hZGVkOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4XzEuZGVmYXVsdC5yZW1vdmUoYWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpbmRleF8xLmRlZmF1bHQucmVtb3ZlKGFsaWFzKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsaWFzO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kVXRpbHM7XG59KCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmRVdGlscztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kVXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU291bmRMaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi9Tb3VuZExpYnJhcnlcIik7XG52YXIgU291bmRMaWJyYXJ5UHJvdG90eXBlID0gU291bmRMaWJyYXJ5XzEuZGVmYXVsdC5wcm90b3R5cGU7XG5Tb3VuZExpYnJhcnlQcm90b3R5cGUuc291bmQgPSBmdW5jdGlvbiBzb3VuZChhbGlhcykge1xuICAgIGNvbnNvbGUud2FybignUElYSS5zb3VuZC5zb3VuZCBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC5maW5kJyk7XG4gICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcyk7XG59O1xuU291bmRMaWJyYXJ5UHJvdG90eXBlLnBhbm5pbmcgPSBmdW5jdGlvbiAoYWxpYXMsIHBhbm5pbmcpIHtcbiAgICBjb25zb2xlLndhcm4oJ1BJWEkuc291bmQucGFubmluZyBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC5maWx0ZXJzLlN0ZXJlb1BhbicpO1xuICAgIHJldHVybiAwO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnlQcm90b3R5cGUsICdTb3VuZFV0aWxzJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1BJWEkuc291bmQuU291bmRVdGlscyBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC51dGlscycpO1xuICAgICAgICByZXR1cm4gdGhpcy51dGlscztcbiAgICB9XG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlcHJlY2F0aW9ucy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi4vaW5kZXhcIik7XG52YXIgRGlzdG9ydGlvbkZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKERpc3RvcnRpb25GaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRGlzdG9ydGlvbkZpbHRlcihhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gdm9pZCAwKSB7IGFtb3VudCA9IDA7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRpc3RvcnRpb24gPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlV2F2ZVNoYXBlcigpO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGRpc3RvcnRpb24pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9kaXN0b3J0aW9uID0gZGlzdG9ydGlvbjtcbiAgICAgICAgX3RoaXMuYW1vdW50ID0gYW1vdW50O1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEaXN0b3J0aW9uRmlsdGVyLnByb3RvdHlwZSwgXCJhbW91bnRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hbW91bnQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSAqPSAxMDAwO1xuICAgICAgICAgICAgdGhpcy5fYW1vdW50ID0gdmFsdWU7XG4gICAgICAgICAgICB2YXIgc2FtcGxlcyA9IDQ0MTAwO1xuICAgICAgICAgICAgdmFyIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheShzYW1wbGVzKTtcbiAgICAgICAgICAgIHZhciBkZWcgPSBNYXRoLlBJIC8gMTgwO1xuICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgdmFyIHg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IHNhbXBsZXM7ICsraSkge1xuICAgICAgICAgICAgICAgIHggPSBpICogMiAvIHNhbXBsZXMgLSAxO1xuICAgICAgICAgICAgICAgIGN1cnZlW2ldID0gKDMgKyB2YWx1ZSkgKiB4ICogMjAgKiBkZWcgLyAoTWF0aC5QSSArIHZhbHVlICogTWF0aC5hYnMoeCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGlzdG9ydGlvbi5jdXJ2ZSA9IGN1cnZlO1xuICAgICAgICAgICAgdGhpcy5fZGlzdG9ydGlvbi5vdmVyc2FtcGxlID0gJzR4JztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRGlzdG9ydGlvbkZpbHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fZGlzdG9ydGlvbiA9IG51bGw7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIERpc3RvcnRpb25GaWx0ZXI7XG59KEZpbHRlcl8xLmRlZmF1bHQpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IERpc3RvcnRpb25GaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1EaXN0b3J0aW9uRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBFcXVhbGl6ZXJGaWx0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhFcXVhbGl6ZXJGaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRXF1YWxpemVyRmlsdGVyKGYzMiwgZjY0LCBmMTI1LCBmMjUwLCBmNTAwLCBmMWssIGYyaywgZjRrLCBmOGssIGYxNmspIHtcbiAgICAgICAgaWYgKGYzMiA9PT0gdm9pZCAwKSB7IGYzMiA9IDA7IH1cbiAgICAgICAgaWYgKGY2NCA9PT0gdm9pZCAwKSB7IGY2NCA9IDA7IH1cbiAgICAgICAgaWYgKGYxMjUgPT09IHZvaWQgMCkgeyBmMTI1ID0gMDsgfVxuICAgICAgICBpZiAoZjI1MCA9PT0gdm9pZCAwKSB7IGYyNTAgPSAwOyB9XG4gICAgICAgIGlmIChmNTAwID09PSB2b2lkIDApIHsgZjUwMCA9IDA7IH1cbiAgICAgICAgaWYgKGYxayA9PT0gdm9pZCAwKSB7IGYxayA9IDA7IH1cbiAgICAgICAgaWYgKGYyayA9PT0gdm9pZCAwKSB7IGYyayA9IDA7IH1cbiAgICAgICAgaWYgKGY0ayA9PT0gdm9pZCAwKSB7IGY0ayA9IDA7IH1cbiAgICAgICAgaWYgKGY4ayA9PT0gdm9pZCAwKSB7IGY4ayA9IDA7IH1cbiAgICAgICAgaWYgKGYxNmsgPT09IHZvaWQgMCkgeyBmMTZrID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZXF1YWxpemVyQmFuZHMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYzMixcbiAgICAgICAgICAgICAgICB0eXBlOiAnbG93c2hlbGYnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYzMlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjY0LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmNjRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxMjUsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYxMjVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYyNTAsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYyNTBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkY1MDAsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGY1MDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxSyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjFrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GMkssXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYya1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjRLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmNGtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkY4SyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjhrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GMTZLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdoaWdoc2hlbGYnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYxNmtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgdmFyIGJhbmRzID0gZXF1YWxpemVyQmFuZHMubWFwKGZ1bmN0aW9uIChiYW5kKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICAgICAgZmlsdGVyLnR5cGUgPSBiYW5kLnR5cGU7XG4gICAgICAgICAgICBmaWx0ZXIuZ2Fpbi52YWx1ZSA9IGJhbmQuZ2FpbjtcbiAgICAgICAgICAgIGZpbHRlci5RLnZhbHVlID0gMTtcbiAgICAgICAgICAgIGZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSBiYW5kLmY7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgICAgICB9KTtcbiAgICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBiYW5kc1swXSwgYmFuZHNbYmFuZHMubGVuZ3RoIC0gMV0pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmJhbmRzID0gYmFuZHM7XG4gICAgICAgIF90aGlzLmJhbmRzTWFwID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX3RoaXMuYmFuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gX3RoaXMuYmFuZHNbaV07XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5iYW5kc1tpIC0gMV0uY29ubmVjdChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmJhbmRzTWFwW25vZGUuZnJlcXVlbmN5LnZhbHVlXSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLnNldEdhaW4gPSBmdW5jdGlvbiAoZnJlcXVlbmN5LCBnYWluKSB7XG4gICAgICAgIGlmIChnYWluID09PSB2b2lkIDApIHsgZ2FpbiA9IDA7IH1cbiAgICAgICAgaWYgKCF0aGlzLmJhbmRzTWFwW2ZyZXF1ZW5jeV0pIHtcbiAgICAgICAgICAgIHRocm93ICdObyBiYW5kIGZvdW5kIGZvciBmcmVxdWVuY3kgJyArIGZyZXF1ZW5jeTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhbmRzTWFwW2ZyZXF1ZW5jeV0uZ2Fpbi52YWx1ZSA9IGdhaW47XG4gICAgfTtcbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJhbmRzLmZvckVhY2goZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIGJhbmQuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXF1YWxpemVyRmlsdGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJhbmRzLmZvckVhY2goZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIGJhbmQuZGlzY29ubmVjdCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5iYW5kcyA9IG51bGw7XG4gICAgICAgIHRoaXMuYmFuZHNNYXAgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIEVxdWFsaXplckZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuRXF1YWxpemVyRmlsdGVyLkYzMiA9IDMyO1xuRXF1YWxpemVyRmlsdGVyLkY2NCA9IDY0O1xuRXF1YWxpemVyRmlsdGVyLkYxMjUgPSAxMjU7XG5FcXVhbGl6ZXJGaWx0ZXIuRjI1MCA9IDI1MDtcbkVxdWFsaXplckZpbHRlci5GNTAwID0gNTAwO1xuRXF1YWxpemVyRmlsdGVyLkYxSyA9IDEwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjJLID0gMjAwMDtcbkVxdWFsaXplckZpbHRlci5GNEsgPSA0MDAwO1xuRXF1YWxpemVyRmlsdGVyLkY4SyA9IDgwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjE2SyA9IDE2MDAwO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRXF1YWxpemVyRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RXF1YWxpemVyRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIEZpbHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsdGVyKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uO1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZSB8fCBkZXN0aW5hdGlvbjtcbiAgICB9XG4gICAgRmlsdGVyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uKSB7XG4gICAgICAgIHRoaXMuc291cmNlLmNvbm5lY3QoZGVzdGluYXRpb24pO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNvdXJjZS5kaXNjb25uZWN0KCk7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIEZpbHRlcjtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBGaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1GaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIFJldmVyYkZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJldmVyYkZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSZXZlcmJGaWx0ZXIoc2Vjb25kcywgZGVjYXksIHJldmVyc2UpIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPT09IHZvaWQgMCkgeyBzZWNvbmRzID0gMzsgfVxuICAgICAgICBpZiAoZGVjYXkgPT09IHZvaWQgMCkgeyBkZWNheSA9IDI7IH1cbiAgICAgICAgaWYgKHJldmVyc2UgPT09IHZvaWQgMCkgeyByZXZlcnNlID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGNvbnZvbHZlciA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dC5jcmVhdGVDb252b2x2ZXIoKTtcbiAgICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBjb252b2x2ZXIpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9jb252b2x2ZXIgPSBjb252b2x2ZXI7XG4gICAgICAgIF90aGlzLl9zZWNvbmRzID0gX3RoaXMuX2NsYW1wKHNlY29uZHMsIDEsIDUwKTtcbiAgICAgICAgX3RoaXMuX2RlY2F5ID0gX3RoaXMuX2NsYW1wKGRlY2F5LCAwLCAxMDApO1xuICAgICAgICBfdGhpcy5fcmV2ZXJzZSA9IHJldmVyc2U7XG4gICAgICAgIF90aGlzLl9yZWJ1aWxkKCk7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgUmV2ZXJiRmlsdGVyLnByb3RvdHlwZS5fY2xhbXAgPSBmdW5jdGlvbiAodmFsdWUsIG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdmFsdWUpKTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZXZlcmJGaWx0ZXIucHJvdG90eXBlLCBcInNlY29uZHNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zZWNvbmRzO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWNvbmRzID0gdGhpcy5fY2xhbXAoc2Vjb25kcywgMSwgNTApO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmV2ZXJiRmlsdGVyLnByb3RvdHlwZSwgXCJkZWNheVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY2F5O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChkZWNheSkge1xuICAgICAgICAgICAgdGhpcy5fZGVjYXkgPSB0aGlzLl9jbGFtcChkZWNheSwgMCwgMTAwKTtcbiAgICAgICAgICAgIHRoaXMuX3JlYnVpbGQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJldmVyYkZpbHRlci5wcm90b3R5cGUsIFwicmV2ZXJzZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHJldmVyc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3JldmVyc2UgPSByZXZlcnNlO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLl9yZWJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29udGV4dCA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dDtcbiAgICAgICAgdmFyIHJhdGUgPSBjb250ZXh0LnNhbXBsZVJhdGU7XG4gICAgICAgIHZhciBsZW5ndGggPSByYXRlICogdGhpcy5fc2Vjb25kcztcbiAgICAgICAgdmFyIGltcHVsc2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlcigyLCBsZW5ndGgsIHJhdGUpO1xuICAgICAgICB2YXIgaW1wdWxzZUwgPSBpbXB1bHNlLmdldENoYW5uZWxEYXRhKDApO1xuICAgICAgICB2YXIgaW1wdWxzZVIgPSBpbXB1bHNlLmdldENoYW5uZWxEYXRhKDEpO1xuICAgICAgICB2YXIgbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbiA9IHRoaXMuX3JldmVyc2UgPyBsZW5ndGggLSBpIDogaTtcbiAgICAgICAgICAgIGltcHVsc2VMW2ldID0gKE1hdGgucmFuZG9tKCkgKiAyIC0gMSkgKiBNYXRoLnBvdygxIC0gbiAvIGxlbmd0aCwgdGhpcy5fZGVjYXkpO1xuICAgICAgICAgICAgaW1wdWxzZVJbaV0gPSAoTWF0aC5yYW5kb20oKSAqIDIgLSAxKSAqIE1hdGgucG93KDEgLSBuIC8gbGVuZ3RoLCB0aGlzLl9kZWNheSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udm9sdmVyLmJ1ZmZlciA9IGltcHVsc2U7XG4gICAgfTtcbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnZvbHZlciA9IG51bGw7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFJldmVyYkZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gUmV2ZXJiRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmV2ZXJiRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBTdGVyZW9GaWx0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTdGVyZW9GaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU3RlcmVvRmlsdGVyKHBhbikge1xuICAgICAgICBpZiAocGFuID09PSB2b2lkIDApIHsgcGFuID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgc3RlcmVvID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZVN0ZXJlb1Bhbm5lcigpO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIHN0ZXJlbykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX3N0ZXJlbyA9IHN0ZXJlbztcbiAgICAgICAgX3RoaXMucGFuID0gcGFuO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdGVyZW9GaWx0ZXIucHJvdG90eXBlLCBcInBhblwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhbjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3BhbiA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fc3RlcmVvLnBhbi52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTdGVyZW9GaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLl9zdGVyZW8gPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFN0ZXJlb0ZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU3RlcmVvRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3RlcmVvRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xuZXhwb3J0cy5GaWx0ZXIgPSBGaWx0ZXJfMS5kZWZhdWx0O1xudmFyIEVxdWFsaXplckZpbHRlcl8xID0gcmVxdWlyZShcIi4vRXF1YWxpemVyRmlsdGVyXCIpO1xuZXhwb3J0cy5FcXVhbGl6ZXJGaWx0ZXIgPSBFcXVhbGl6ZXJGaWx0ZXJfMS5kZWZhdWx0O1xudmFyIERpc3RvcnRpb25GaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0Rpc3RvcnRpb25GaWx0ZXJcIik7XG5leHBvcnRzLkRpc3RvcnRpb25GaWx0ZXIgPSBEaXN0b3J0aW9uRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBTdGVyZW9GaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL1N0ZXJlb0ZpbHRlclwiKTtcbmV4cG9ydHMuU3RlcmVvRmlsdGVyID0gU3RlcmVvRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBSZXZlcmJGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL1JldmVyYkZpbHRlclwiKTtcbmV4cG9ydHMuUmV2ZXJiRmlsdGVyID0gUmV2ZXJiRmlsdGVyXzEuZGVmYXVsdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNvdW5kTGlicmFyeV8xID0gcmVxdWlyZShcIi4vU291bmRMaWJyYXJ5XCIpO1xudmFyIExvYWRlck1pZGRsZXdhcmVfMSA9IHJlcXVpcmUoXCIuL0xvYWRlck1pZGRsZXdhcmVcIik7XG5yZXF1aXJlKFwiLi9kZXByZWNhdGlvbnNcIik7XG52YXIgc291bmQgPSBuZXcgU291bmRMaWJyYXJ5XzEuZGVmYXVsdCgpO1xuaWYgKGdsb2JhbC5QSVhJID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBcInBpeGkuanMgaXMgcmVxdWlyZWRcIjtcbn1cbmlmIChQSVhJLmxvYWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIExvYWRlck1pZGRsZXdhcmVfMS5pbnN0YWxsKCk7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUElYSSwgJ3NvdW5kJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gc291bmQ7IH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gc291bmQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJ2YXIgdjEgPSByZXF1aXJlKCcuL3YxJyk7XG52YXIgdjQgPSByZXF1aXJlKCcuL3Y0Jyk7XG5cbnZhciB1dWlkID0gdjQ7XG51dWlkLnYxID0gdjE7XG51dWlkLnY0ID0gdjQ7XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiIsIi8qKlxuICogQ29udmVydCBhcnJheSBvZiAxNiBieXRlIHZhbHVlcyB0byBVVUlEIHN0cmluZyBmb3JtYXQgb2YgdGhlIGZvcm06XG4gKiBYWFhYWFhYWC1YWFhYLVhYWFgtWFhYWC1YWFhYLVhYWFhYWFhYWFhYWFxuICovXG52YXIgYnl0ZVRvSGV4ID0gW107XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSB7XG4gIGJ5dGVUb0hleFtpXSA9IChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSk7XG59XG5cbmZ1bmN0aW9uIGJ5dGVzVG9VdWlkKGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gb2Zmc2V0IHx8IDA7XG4gIHZhciBidGggPSBieXRlVG9IZXg7XG4gIHJldHVybiAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ5dGVzVG9VdWlkO1xuIiwiLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIEluIHRoZVxuLy8gYnJvd3NlciB0aGlzIGlzIGEgbGl0dGxlIGNvbXBsaWNhdGVkIGR1ZSB0byB1bmtub3duIHF1YWxpdHkgb2YgTWF0aC5yYW5kb20oKVxuLy8gYW5kIGluY29uc2lzdGVudCBzdXBwb3J0IGZvciB0aGUgYGNyeXB0b2AgQVBJLiAgV2UgZG8gdGhlIGJlc3Qgd2UgY2FuIHZpYVxuLy8gZmVhdHVyZS1kZXRlY3Rpb25cbnZhciBybmc7XG5cbnZhciBjcnlwdG8gPSBnbG9iYWwuY3J5cHRvIHx8IGdsb2JhbC5tc0NyeXB0bzsgLy8gZm9yIElFIDExXG5pZiAoY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0byBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIHZhciBybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMocm5kczgpO1xuICAgIHJldHVybiBybmRzODtcbiAgfTtcbn1cblxuaWYgKCFybmcpIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgIHJuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgcm5kc1tpXSA9IHIgPj4+ICgoaSAmIDB4MDMpIDw8IDMpICYgMHhmZjtcbiAgICB9XG5cbiAgICByZXR1cm4gcm5kcztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBybmc7XG4iLCIvLyBVbmlxdWUgSUQgY3JlYXRpb24gcmVxdWlyZXMgYSBoaWdoIHF1YWxpdHkgcmFuZG9tICMgZ2VuZXJhdG9yLiAgV2UgZmVhdHVyZVxuLy8gZGV0ZWN0IHRvIGRldGVybWluZSB0aGUgYmVzdCBSTkcgc291cmNlLCBub3JtYWxpemluZyB0byBhIGZ1bmN0aW9uIHRoYXRcbi8vIHJldHVybnMgMTI4LWJpdHMgb2YgcmFuZG9tbmVzcywgc2luY2UgdGhhdCdzIHdoYXQncyB1c3VhbGx5IHJlcXVpcmVkXG52YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG4vLyAqKmB2MSgpYCAtIEdlbmVyYXRlIHRpbWUtYmFzZWQgVVVJRCoqXG4vL1xuLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL0xpb3NLL1VVSUQuanNcbi8vIGFuZCBodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvdXVpZC5odG1sXG5cbi8vIHJhbmRvbSAjJ3Mgd2UgbmVlZCB0byBpbml0IG5vZGUgYW5kIGNsb2Nrc2VxXG52YXIgX3NlZWRCeXRlcyA9IHJuZygpO1xuXG4vLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbnZhciBfbm9kZUlkID0gW1xuICBfc2VlZEJ5dGVzWzBdIHwgMHgwMSxcbiAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuXTtcblxuLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcbnZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbi8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxudmFyIF9sYXN0TVNlY3MgPSAwLCBfbGFzdE5TZWNzID0gMDtcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG4gIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjbG9ja3NlcSA9IG9wdGlvbnMuY2xvY2tzZXEgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY2xvY2tzZXEgOiBfY2xvY2tzZXE7XG5cbiAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgLy8gdGltZSBpcyBoYW5kbGVkIGludGVybmFsbHkgYXMgJ21zZWNzJyAoaW50ZWdlciBtaWxsaXNlY29uZHMpIGFuZCAnbnNlY3MnXG4gIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXG4gIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAvLyBUaW1lIHNpbmNlIGxhc3QgdXVpZCBjcmVhdGlvbiAoaW4gbXNlY3MpXG4gIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICBpZiAoZHQgPCAwICYmIG9wdGlvbnMuY2xvY2tzZXEgPT09IHVuZGVmaW5lZCkge1xuICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICB9XG5cbiAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcbiAgLy8gdGltZSBpbnRlcnZhbFxuICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT09IHVuZGVmaW5lZCkge1xuICAgIG5zZWNzID0gMDtcbiAgfVxuXG4gIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgaWYgKG5zZWNzID49IDEwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gIH1cblxuICBfbGFzdE1TZWNzID0gbXNlY3M7XG4gIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXG4gIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gIC8vIGB0aW1lX2xvd2BcbiAgdmFyIHRsID0gKChtc2VjcyAmIDB4ZmZmZmZmZikgKiAxMDAwMCArIG5zZWNzKSAlIDB4MTAwMDAwMDAwO1xuICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAvLyBgdGltZV9taWRgXG4gIHZhciB0bWggPSAobXNlY3MgLyAweDEwMDAwMDAwMCAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxuICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gIC8vIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYCAoUGVyIDQuMi4yIC0gaW5jbHVkZSB2YXJpYW50KVxuICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gIGJbaSsrXSA9IGNsb2Nrc2VxICYgMHhmZjtcblxuICAvLyBgbm9kZWBcbiAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyArK24pIHtcbiAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gIH1cblxuICByZXR1cm4gYnVmID8gYnVmIDogYnl0ZXNUb1V1aWQoYik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdjE7XG4iLCJ2YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG5mdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IHJuZykoKTtcblxuICAvLyBQZXIgNC40LCBzZXQgYml0cyBmb3IgdmVyc2lvbiBhbmQgYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgXG4gIHJuZHNbNl0gPSAocm5kc1s2XSAmIDB4MGYpIHwgMHg0MDtcbiAgcm5kc1s4XSA9IChybmRzWzhdICYgMHgzZikgfCAweDgwO1xuXG4gIC8vIENvcHkgYnl0ZXMgdG8gYnVmZmVyLCBpZiBwcm92aWRlZFxuICBpZiAoYnVmKSB7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IDE2OyArK2lpKSB7XG4gICAgICBidWZbaSArIGlpXSA9IHJuZHNbaWldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWYgfHwgYnl0ZXNUb1V1aWQocm5kcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdjQ7XG4iXX0=
