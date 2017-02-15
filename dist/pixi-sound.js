(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sound = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var index_1 = require("./index");
var AUDIO_EXTENSIONS = ["wav", "mp3", "ogg", "oga", "m4a"];
function middleware(resource, next) {
    if (resource.data && AUDIO_EXTENSIONS.indexOf(resource._getExtension()) > -1) {
        resource.sound = index_1.default.add(resource.name, {
            loaded: next,
            preload: true,
            srcBuffer: resource.data,
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

},{"./index":16}],2:[function(require,module,exports){
"use strict";
var index_1 = require("./index");
var SoundInstance_1 = require("./SoundInstance");
var SoundNodes_1 = require("./SoundNodes");
var SoundSprite_1 = require("./SoundSprite");
var Sound = (function () {
    function Sound(context, source) {
        var options = {};
        if (typeof source === "string") {
            options.src = source;
        }
        else if (source instanceof ArrayBuffer) {
            options.srcBuffer = source;
        }
        else {
            options = source;
        }
        options = Object.assign({
            autoPlay: false,
            singleInstance: false,
            src: null,
            srcBuffer: null,
            preload: false,
            volume: 1,
            speed: 1,
            complete: null,
            loaded: null,
            loop: false,
            useXHR: true,
        }, options);
        this._context = context;
        this._nodes = new SoundNodes_1.default(this._context);
        this._source = this._nodes.bufferSource;
        this._instances = [];
        this._sprites = {};
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
        this.volume = options.volume;
        this.loop = options.loop;
        this.speed = options.speed;
        if (options.sprites) {
            this.addSprites(options.sprites);
        }
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
        this.removeSprites();
        this._sprites = null;
        this.complete = null;
        this.loaded = null;
        this.srcBuffer = null;
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
            console.assert(this.isPlayable, "Sound not yet playable, no duration");
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
    Object.defineProperty(Sound.prototype, "sprites", {
        get: function () {
            return this._sprites;
        },
        enumerable: true,
        configurable: true
    });
    Sound.prototype.addSprites = function (source, data) {
        if (typeof source === "object") {
            var results = {};
            for (var alias in source) {
                results[alias] = this.addSprites(alias, source[alias]);
            }
            return results;
        }
        else if (typeof source === "string") {
            console.assert(!this._sprites[source], "Alias " + source + " is already taken");
            var sprite = new SoundSprite_1.default(this, data);
            this._sprites[source] = sprite;
            return sprite;
        }
    };
    Sound.prototype.removeSprites = function (alias) {
        if (!alias) {
            for (var name_1 in this._sprites) {
                this.removeSprites(name_1);
            }
        }
        else {
            var sprite = this._sprites[alias];
            if (sprite !== undefined) {
                sprite.destroy();
                delete this._sprites[alias];
            }
        }
        return this;
    };
    Sound.prototype.play = function (source, callback) {
        var _this = this;
        var options;
        if (typeof source === "string") {
            var alias = source;
            console.assert(!!this._sprites[alias], "Alias " + alias + " is not available");
            var sprite = this._sprites[alias];
            options = {
                start: sprite.start,
                end: sprite.end,
                speed: sprite.speed,
                complete: callback,
            };
        }
        else if (typeof source === "function") {
            options = {};
            options.complete = source;
        }
        else {
            options = source;
        }
        options = Object.assign({
            complete: null,
            loaded: null,
            start: 0,
        }, options || {});
        if (options.offset) {
            options.start = options.offset;
        }
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
        instance.once("end", function () {
            if (options.complete) {
                options.complete(_this);
            }
            _this._onComplete(instance);
        });
        instance.once("stop", function () {
            _this._onComplete(instance);
        });
        instance.play(options.start, options.end, options.speed, options.loop);
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
            console.error("sound.src or sound.srcBuffer must be set");
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
        request.open("GET", src, true);
        request.responseType = "arraybuffer";
        request.onload = function () {
            _this.isLoaded = true;
            _this.srcBuffer = request.response;
            _this._decode(request.response);
        };
        request.send();
    };
    Sound.prototype._loadPath = function () {
        var _this = this;
        var fs = require("fs");
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
            _this.srcBuffer = arrayBuffer;
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

},{"./SoundInstance":4,"./SoundNodes":6,"./SoundSprite":7,"./index":16,"fs":undefined}],3:[function(require,module,exports){
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
        webAudioIOS(window, this._ctx, function () {
        });
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
        if (typeof ctx.close !== "undefined") {
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
            if (paused && this._ctx.state === "running") {
                this._ctx.suspend();
            }
            else if (!paused && this._ctx.state === "suspended") {
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
            callback(new Error("Unable to decode file"));
        });
    };
    return SoundContext;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundContext;

},{"web-audio-ios":22}],4:[function(require,module,exports){
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
        _this._paused = false;
        _this._elapsed = 0;
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
            this.emit("stop");
        }
    };
    SoundInstance.prototype.play = function (start, end, speed, loop) {
        if (start === void 0) { start = 0; }
        if (end) {
            console.assert(end > start, "End time is before start time");
        }
        this._paused = false;
        this._source = this._parent.nodes.cloneBufferSource();
        if (speed !== undefined) {
            this._source.playbackRate.value = speed;
        }
        this._speed = this._source.playbackRate.value;
        if (loop !== undefined) {
            this._source.loop = loop;
        }
        if (this._source.loop && end !== undefined) {
            console.warn('Looping not support when specifying an "end" time');
            this._source.loop = false;
        }
        this._lastUpdate = this._now();
        this._elapsed = start;
        this._duration = this._source.buffer.duration;
        this._source.onended = this._onComplete.bind(this);
        this._source.start(0, start, (end ? end - start : undefined));
        this.emit("start");
        this._update(true);
        this._enabled = true;
    };
    Object.defineProperty(SoundInstance.prototype, "_enabled", {
        set: function (enabled) {
            var _this = this;
            this._parent.nodes.scriptNode.onaudioprocess = !enabled ? null : function () {
                _this._update();
            };
        },
        enumerable: true,
        configurable: true
    });
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
                    this.emit("paused");
                }
                else {
                    this.emit("resumed");
                    this.play(this._elapsed % this._duration);
                }
                this.emit("pause", paused);
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
        this._elapsed = 0;
        this._duration = 0;
        this._paused = false;
        if (SoundInstance._pool.indexOf(this) < 0) {
            SoundInstance._pool.push(this);
        }
    };
    SoundInstance.prototype.toString = function () {
        return "[SoundInstance id=" + this.id + "]";
    };
    SoundInstance.prototype._now = function () {
        return this._parent.context.audioContext.currentTime;
    };
    SoundInstance.prototype._update = function (force) {
        if (force === void 0) { force = false; }
        if (this._source) {
            var now = this._now();
            var delta = now - this._lastUpdate;
            if (delta > 0 || force) {
                this._elapsed += delta;
                this._lastUpdate = now;
                var duration = this._duration;
                this._progress = ((this._elapsed * this._speed) % duration) / duration;
                this.emit("progress", this._progress);
            }
        }
    };
    SoundInstance.prototype._init = function (parent) {
        this._parent = parent;
    };
    SoundInstance.prototype._internalStop = function () {
        if (this._source) {
            this._enabled = false;
            this._source.onended = null;
            this._source.stop();
            this._source = null;
        }
    };
    SoundInstance.prototype._onComplete = function () {
        if (this._source) {
            this._enabled = false;
            this._source.onended = null;
        }
        this._source = null;
        this._progress = 1;
        this.emit("progress", 1);
        this.emit("end", this);
    };
    return SoundInstance;
}(PIXI.utils.EventEmitter));
SoundInstance._pool = [];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundInstance;

},{}],5:[function(require,module,exports){
"use strict";
var filters = require("./filters");
var Sound_1 = require("./Sound");
var SoundContext_1 = require("./SoundContext");
var SoundInstance_1 = require("./SoundInstance");
var SoundSprite_1 = require("./SoundSprite");
var SoundUtils_1 = require("./SoundUtils");
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
        this.SoundSprite = SoundSprite_1.default;
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
    SoundLibrary.prototype.add = function (source, sourceOptions) {
        if (typeof source === "object") {
            var results = {};
            for (var alias in source) {
                var options = this._getOptions(source[alias], sourceOptions);
                results[alias] = this.add(alias, options);
            }
            return results;
        }
        else if (typeof source === "string") {
            console.assert(!this._sounds[source], "Sound with alias " + source + " already exists.");
            if (sourceOptions instanceof Sound_1.default) {
                this._sounds[source] = sourceOptions;
                return sourceOptions;
            }
            else {
                var options = this._getOptions(sourceOptions);
                var sound = new Sound_1.default(this.context, options);
                this._sounds[source] = sound;
                return sound;
            }
        }
    };
    SoundLibrary.prototype._getOptions = function (source, overrides) {
        var options;
        if (typeof source === "string") {
            options = { src: source };
        }
        else if (source instanceof ArrayBuffer) {
            options = { srcBuffer: source };
        }
        else {
            options = source;
        }
        return Object.assign(options, overrides || {});
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

},{"./Sound":2,"./SoundContext":3,"./SoundInstance":4,"./SoundSprite":7,"./SoundUtils":8,"./filters":15}],6:[function(require,module,exports){
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
                    if (filter) {
                        filter.disconnect();
                    }
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
var SoundSprite = (function () {
    function SoundSprite(parent, options) {
        this.parent = parent;
        Object.assign(this, options);
        this.duration = this.end - this.start;
        console.assert(this.duration > 0, "End time must be after start time");
    }
    SoundSprite.prototype.play = function (complete) {
        return this.parent.play(Object.assign({
            complete: complete,
            speed: this.speed || this.parent.speed,
            end: this.end,
            start: this.start,
        }));
    };
    SoundSprite.prototype.destroy = function () {
        this.parent = null;
    };
    return SoundSprite;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundSprite;

},{}],8:[function(require,module,exports){
"use strict";
var uuid = require("uuid");
var index_1 = require("./index");
var Sound_1 = require("./Sound");
var SoundUtils = (function () {
    function SoundUtils() {
    }
    SoundUtils.sineTone = function (hertz, seconds) {
        if (hertz === void 0) { hertz = 200; }
        if (seconds === void 0) { seconds = 1; }
        var soundContext = index_1.default.context;
        var soundInstance = new Sound_1.default(soundContext, {
            singleInstance: true,
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
    SoundUtils.render = function (sound, options) {
        options = Object.assign({
            width: 512,
            height: 128,
            fill: "black",
        }, options || {});
        console.assert(!!sound.buffer, "No buffer found, load first");
        var canvas = document.createElement("canvas");
        canvas.width = options.width;
        canvas.height = options.height;
        var context = canvas.getContext("2d");
        context.fillStyle = options.fill;
        var data = sound.buffer.getChannelData(0);
        var step = Math.ceil(data.length / options.width);
        var amp = options.height / 2;
        for (var i = 0; i < options.width; i++) {
            var min = 1.0;
            var max = -1.0;
            for (var j = 0; j < step; j++) {
                var datum = data[(i * step) + j];
                if (datum < min) {
                    min = datum;
                }
                if (datum > max) {
                    max = datum;
                }
            }
            context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
        return PIXI.BaseTexture.fromCanvas(canvas);
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
            },
        });
        return alias;
    };
    return SoundUtils;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundUtils;

},{"./Sound":2,"./index":16,"uuid":17}],9:[function(require,module,exports){
"use strict";
var Sound_1 = require("./Sound");
var SoundLibrary_1 = require("./SoundLibrary");
var SoundLibraryPrototype = SoundLibrary_1.default.prototype;
var SoundPrototype = Sound_1.default.prototype;
SoundLibraryPrototype.sound = function sound(alias) {
    console.warn("PIXI.sound.sound is deprecated, use PIXI.sound.find");
    return this.find(alias);
};
SoundLibraryPrototype.panning = function panning(alias, panning) {
    console.warn("PIXI.sound.panning is deprecated, use PIXI.sound.filters.StereoPan");
    return 0;
};
SoundLibraryPrototype.addMap = function addMap(map, globalOptions) {
    console.warn("PIXI.sound.addMap is deprecated, use PIXI.sound.add");
    return this.add(map, globalOptions);
};
Object.defineProperty(SoundLibraryPrototype, "SoundUtils", {
    get: function () {
        console.warn("PIXI.sound.SoundUtils is deprecated, use PIXI.sound.utils");
        return this.utils;
    },
});
Object.defineProperty(SoundPrototype, "block", {
    get: function () {
        console.warn("PIXI.sound.Sound.prototype.block is deprecated, use singleInstance instead");
        return this.singleInstance;
    },
    set: function (value) {
        console.warn("PIXI.sound.Sound.prototype.block is deprecated, use singleInstance instead");
        this.singleInstance = value;
    },
});

},{"./Sound":2,"./SoundLibrary":5}],10:[function(require,module,exports){
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

},{"../index":16,"./Filter":12}],11:[function(require,module,exports){
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

},{"../index":16,"./Filter":12}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"../index":16,"./Filter":12}],14:[function(require,module,exports){
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

},{"../index":16,"./Filter":12}],15:[function(require,module,exports){
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

},{"./DistortionFilter":10,"./EqualizerFilter":11,"./Filter":12,"./ReverbFilter":13,"./StereoFilter":14}],16:[function(require,module,exports){
(function (global){
"use strict";
var LoaderMiddleware_1 = require("./LoaderMiddleware");
var SoundLibrary_1 = require("./SoundLibrary");
require("./deprecations");
var sound = new SoundLibrary_1.default();
if (global.PIXI === undefined) {
    throw new Error("pixi.js is required");
}
if (PIXI.loaders !== undefined) {
    LoaderMiddleware_1.install();
}
Object.defineProperty(PIXI, "sound", {
    get: function () { return sound; },
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sound;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LoaderMiddleware":1,"./SoundLibrary":5,"./deprecations":9}],17:[function(require,module,exports){
var v1 = require('./v1');
var v4 = require('./v4');

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;

},{"./v1":20,"./v4":21}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{"./lib/bytesToUuid":18,"./lib/rng":19}],21:[function(require,module,exports){
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

},{"./lib/bytesToUuid":18,"./lib/rng":19}],22:[function(require,module,exports){
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

},{}]},{},[16])(16)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTG9hZGVyTWlkZGxld2FyZS5qcyIsImxpYi9Tb3VuZC5qcyIsImxpYi9Tb3VuZENvbnRleHQuanMiLCJsaWIvU291bmRJbnN0YW5jZS5qcyIsImxpYi9Tb3VuZExpYnJhcnkuanMiLCJsaWIvU291bmROb2Rlcy5qcyIsImxpYi9Tb3VuZFNwcml0ZS5qcyIsImxpYi9Tb3VuZFV0aWxzLmpzIiwibGliL2RlcHJlY2F0aW9ucy5qcyIsImxpYi9maWx0ZXJzL0Rpc3RvcnRpb25GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9FcXVhbGl6ZXJGaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9SZXZlcmJGaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9TdGVyZW9GaWx0ZXIuanMiLCJsaWIvZmlsdGVycy9pbmRleC5qcyIsImxpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL2J5dGVzVG9VdWlkLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL3JuZy1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvdjEuanMiLCJub2RlX21vZHVsZXMvdXVpZC92NC5qcyIsIm5vZGVfbW9kdWxlcy93ZWItYXVkaW8taW9zL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi9pbmRleFwiKTtcbnZhciBBVURJT19FWFRFTlNJT05TID0gW1wid2F2XCIsIFwibXAzXCIsIFwib2dnXCIsIFwib2dhXCIsIFwibTRhXCJdO1xuZnVuY3Rpb24gbWlkZGxld2FyZShyZXNvdXJjZSwgbmV4dCkge1xuICAgIGlmIChyZXNvdXJjZS5kYXRhICYmIEFVRElPX0VYVEVOU0lPTlMuaW5kZXhPZihyZXNvdXJjZS5fZ2V0RXh0ZW5zaW9uKCkpID4gLTEpIHtcbiAgICAgICAgcmVzb3VyY2Uuc291bmQgPSBpbmRleF8xLmRlZmF1bHQuYWRkKHJlc291cmNlLm5hbWUsIHtcbiAgICAgICAgICAgIGxvYWRlZDogbmV4dCxcbiAgICAgICAgICAgIHByZWxvYWQ6IHRydWUsXG4gICAgICAgICAgICBzcmNCdWZmZXI6IHJlc291cmNlLmRhdGEsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbmV4dCgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1pZGRsZXdhcmVGYWN0b3J5KCkge1xuICAgIHJldHVybiBtaWRkbGV3YXJlO1xufVxuZnVuY3Rpb24gaW5zdGFsbCgpIHtcbiAgICB2YXIgUmVzb3VyY2UgPSBQSVhJLmxvYWRlcnMuUmVzb3VyY2U7XG4gICAgQVVESU9fRVhURU5TSU9OUy5mb3JFYWNoKGZ1bmN0aW9uIChleHQpIHtcbiAgICAgICAgUmVzb3VyY2Uuc2V0RXh0ZW5zaW9uWGhyVHlwZShleHQsIFJlc291cmNlLlhIUl9SRVNQT05TRV9UWVBFLkJVRkZFUik7XG4gICAgICAgIFJlc291cmNlLnNldEV4dGVuc2lvbkxvYWRUeXBlKGV4dCwgUmVzb3VyY2UuTE9BRF9UWVBFLlhIUik7XG4gICAgfSk7XG4gICAgUElYSS5sb2FkZXJzLkxvYWRlci5hZGRQaXhpTWlkZGxld2FyZShtaWRkbGV3YXJlRmFjdG9yeSk7XG4gICAgUElYSS5sb2FkZXIudXNlKG1pZGRsZXdhcmUpO1xufVxuZXhwb3J0cy5pbnN0YWxsID0gaW5zdGFsbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUxvYWRlck1pZGRsZXdhcmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuL2luZGV4XCIpO1xudmFyIFNvdW5kSW5zdGFuY2VfMSA9IHJlcXVpcmUoXCIuL1NvdW5kSW5zdGFuY2VcIik7XG52YXIgU291bmROb2Rlc18xID0gcmVxdWlyZShcIi4vU291bmROb2Rlc1wiKTtcbnZhciBTb3VuZFNwcml0ZV8xID0gcmVxdWlyZShcIi4vU291bmRTcHJpdGVcIik7XG52YXIgU291bmQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kKGNvbnRleHQsIHNvdXJjZSkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHt9O1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgb3B0aW9ucy5zcmMgPSBzb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc291cmNlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuc3JjQnVmZmVyID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBhdXRvUGxheTogZmFsc2UsXG4gICAgICAgICAgICBzaW5nbGVJbnN0YW5jZTogZmFsc2UsXG4gICAgICAgICAgICBzcmM6IG51bGwsXG4gICAgICAgICAgICBzcmNCdWZmZXI6IG51bGwsXG4gICAgICAgICAgICBwcmVsb2FkOiBmYWxzZSxcbiAgICAgICAgICAgIHZvbHVtZTogMSxcbiAgICAgICAgICAgIHNwZWVkOiAxLFxuICAgICAgICAgICAgY29tcGxldGU6IG51bGwsXG4gICAgICAgICAgICBsb2FkZWQ6IG51bGwsXG4gICAgICAgICAgICBsb29wOiBmYWxzZSxcbiAgICAgICAgICAgIHVzZVhIUjogdHJ1ZSxcbiAgICAgICAgfSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5ldyBTb3VuZE5vZGVzXzEuZGVmYXVsdCh0aGlzLl9jb250ZXh0KTtcbiAgICAgICAgdGhpcy5fc291cmNlID0gdGhpcy5fbm9kZXMuYnVmZmVyU291cmNlO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fc3ByaXRlcyA9IHt9O1xuICAgICAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXV0b1BsYXkgPSBvcHRpb25zLmF1dG9QbGF5O1xuICAgICAgICB0aGlzLnNpbmdsZUluc3RhbmNlID0gb3B0aW9ucy5zaW5nbGVJbnN0YW5jZTtcbiAgICAgICAgdGhpcy5wcmVsb2FkID0gb3B0aW9ucy5wcmVsb2FkIHx8IHRoaXMuYXV0b1BsYXk7XG4gICAgICAgIHRoaXMuY29tcGxldGUgPSBvcHRpb25zLmNvbXBsZXRlO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IG9wdGlvbnMubG9hZGVkO1xuICAgICAgICB0aGlzLnNyYyA9IG9wdGlvbnMuc3JjO1xuICAgICAgICB0aGlzLnNyY0J1ZmZlciA9IG9wdGlvbnMuc3JjQnVmZmVyO1xuICAgICAgICB0aGlzLnVzZVhIUiA9IG9wdGlvbnMudXNlWEhSO1xuICAgICAgICB0aGlzLnZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLmxvb3AgPSBvcHRpb25zLmxvb3A7XG4gICAgICAgIHRoaXMuc3BlZWQgPSBvcHRpb25zLnNwZWVkO1xuICAgICAgICBpZiAob3B0aW9ucy5zcHJpdGVzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZFNwcml0ZXMob3B0aW9ucy5zcHJpdGVzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wcmVsb2FkKSB7XG4gICAgICAgICAgICB0aGlzLl9iZWdpblByZWxvYWQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBTb3VuZC5mcm9tID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTb3VuZChpbmRleF8xLmRlZmF1bHQuY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuICAgICAgICB0aGlzLl9zb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbW92ZVNwcml0ZXMoKTtcbiAgICAgICAgdGhpcy5fc3ByaXRlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuY29tcGxldGUgPSBudWxsO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IG51bGw7XG4gICAgICAgIHRoaXMuc3JjQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcmVtb3ZlSW5zdGFuY2VzKCk7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyA9IG51bGw7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImlzUGxheWFibGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlzTG9hZGVkICYmICEhdGhpcy5fc291cmNlICYmICEhdGhpcy5fc291cmNlLmJ1ZmZlcjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJjb250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJ2b2x1bWVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlcy5nYWluTm9kZS5nYWluLnZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2b2x1bWUpIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSB2b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwibG9vcFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvdXJjZS5sb29wO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChsb29wKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UubG9vcCA9ICEhbG9vcDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJidWZmZXJcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UuYnVmZmVyO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChidWZmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiZHVyYXRpb25cIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KHRoaXMuaXNQbGF5YWJsZSwgXCJTb3VuZCBub3QgeWV0IHBsYXlhYmxlLCBubyBkdXJhdGlvblwiKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UuYnVmZmVyLmR1cmF0aW9uO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcIm5vZGVzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiZmlsdGVyc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzLmZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZpbHRlcnMgPSBmaWx0ZXJzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcInNwZWVkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5wbGF5YmFja1JhdGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJpbnN0YW5jZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwic3ByaXRlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Nwcml0ZXM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kLnByb3RvdHlwZS5hZGRTcHJpdGVzID0gZnVuY3Rpb24gKHNvdXJjZSwgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGFsaWFzIGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbYWxpYXNdID0gdGhpcy5hZGRTcHJpdGVzKGFsaWFzLCBzb3VyY2VbYWxpYXNdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KCF0aGlzLl9zcHJpdGVzW3NvdXJjZV0sIFwiQWxpYXMgXCIgKyBzb3VyY2UgKyBcIiBpcyBhbHJlYWR5IHRha2VuXCIpO1xuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IG5ldyBTb3VuZFNwcml0ZV8xLmRlZmF1bHQodGhpcywgZGF0YSk7XG4gICAgICAgICAgICB0aGlzLl9zcHJpdGVzW3NvdXJjZV0gPSBzcHJpdGU7XG4gICAgICAgICAgICByZXR1cm4gc3ByaXRlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUucmVtb3ZlU3ByaXRlcyA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICBpZiAoIWFsaWFzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lXzEgaW4gdGhpcy5fc3ByaXRlcykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlU3ByaXRlcyhuYW1lXzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IHRoaXMuX3Nwcml0ZXNbYWxpYXNdO1xuICAgICAgICAgICAgaWYgKHNwcml0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc3ByaXRlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fc3ByaXRlc1thbGlhc107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uIChzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBvcHRpb25zO1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdmFyIGFsaWFzID0gc291cmNlO1xuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQoISF0aGlzLl9zcHJpdGVzW2FsaWFzXSwgXCJBbGlhcyBcIiArIGFsaWFzICsgXCIgaXMgbm90IGF2YWlsYWJsZVwiKTtcbiAgICAgICAgICAgIHZhciBzcHJpdGUgPSB0aGlzLl9zcHJpdGVzW2FsaWFzXTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHNwcml0ZS5zdGFydCxcbiAgICAgICAgICAgICAgICBlbmQ6IHNwcml0ZS5lbmQsXG4gICAgICAgICAgICAgICAgc3BlZWQ6IHNwcml0ZS5zcGVlZCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogY2FsbGJhY2ssXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IHNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBzb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgY29tcGxldGU6IG51bGwsXG4gICAgICAgICAgICBsb2FkZWQ6IG51bGwsXG4gICAgICAgICAgICBzdGFydDogMCxcbiAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG4gICAgICAgIGlmIChvcHRpb25zLm9mZnNldCkge1xuICAgICAgICAgICAgb3B0aW9ucy5zdGFydCA9IG9wdGlvbnMub2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5pc1BsYXlhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9QbGF5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0xvYWRlZCkge1xuICAgICAgICAgICAgICAgIHZhciBsb2FkZWQgPSBvcHRpb25zLmxvYWRlZDtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkID0gbG9hZGVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpblByZWxvYWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zaW5nbGVJbnN0YW5jZSkge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSW5zdGFuY2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluc3RhbmNlID0gU291bmRJbnN0YW5jZV8xLmRlZmF1bHQuY3JlYXRlKHRoaXMpO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXMucHVzaChpbnN0YW5jZSk7XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgaW5zdGFuY2Uub25jZShcImVuZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuY29tcGxldGUoX3RoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuX29uQ29tcGxldGUoaW5zdGFuY2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5zdGFuY2Uub25jZShcInN0b3BcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuX29uQ29tcGxldGUoaW5zdGFuY2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5zdGFuY2UucGxheShvcHRpb25zLnN0YXJ0LCBvcHRpb25zLmVuZCwgb3B0aW9ucy5zcGVlZCwgb3B0aW9ucy5sb29wKTtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1BsYXlhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9QbGF5ID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0uc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0ucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIDtcbiAgICBTb3VuZC5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0ucGF1c2VkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoID4gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX2JlZ2luUHJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3JjKSB7XG4gICAgICAgICAgICB0aGlzLnVzZVhIUiA/IHRoaXMuX2xvYWRVcmwoKSA6IHRoaXMuX2xvYWRQYXRoKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5zcmNCdWZmZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlY29kZSh0aGlzLnNyY0J1ZmZlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5sb2FkZWQpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZGVkKG5ldyBFcnJvcihcInNvdW5kLnNyYyBvciBzb3VuZC5zcmNCdWZmZXIgbXVzdCBiZSBzZXRcIikpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInNvdW5kLnNyYyBvciBzb3VuZC5zcmNCdWZmZXIgbXVzdCBiZSBzZXRcIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgICBpZiAodGhpcy5faW5zdGFuY2VzKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9pbnN0YW5jZXMuaW5kZXhPZihpbnN0YW5jZSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoID4gMDtcbiAgICAgICAgfVxuICAgICAgICBpbnN0YW5jZS5kZXN0cm95KCk7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX3JlbW92ZUluc3RhbmNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbnN0YW5jZXMubGVuZ3RoID0gMDtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fbG9hZFVybCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgdmFyIHNyYyA9IHRoaXMuc3JjO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgc3JjLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4gICAgICAgIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgX3RoaXMuc3JjQnVmZmVyID0gcmVxdWVzdC5yZXNwb25zZTtcbiAgICAgICAgICAgIF90aGlzLl9kZWNvZGUocmVxdWVzdC5yZXNwb25zZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9sb2FkUGF0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xuICAgICAgICB2YXIgc3JjID0gdGhpcy5zcmM7XG4gICAgICAgIGZzLnJlYWRGaWxlKHNyYywgZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmxvYWRlZChuZXcgRXJyb3IoXCJGaWxlIG5vdCBmb3VuZCBcIiArIF90aGlzLnNyYykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXJyYXlCdWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoZGF0YS5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2aWV3W2ldID0gZGF0YVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLnNyY0J1ZmZlciA9IGFycmF5QnVmZmVyO1xuICAgICAgICAgICAgX3RoaXMuX2RlY29kZShhcnJheUJ1ZmZlcik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9kZWNvZGUgPSBmdW5jdGlvbiAoYXJyYXlCdWZmZXIpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5fY29udGV4dC5kZWNvZGUoYXJyYXlCdWZmZXIsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIF90aGlzLmxvYWRlZChlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIF90aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMubG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmxvYWRlZChudWxsLCBfdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5hdXRvUGxheSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wbGF5KF90aGlzLmNvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgd2ViQXVkaW9JT1MgPSByZXF1aXJlKFwid2ViLWF1ZGlvLWlvc1wiKTtcbnZhciBTb3VuZENvbnRleHQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kQ29udGV4dCgpIHtcbiAgICAgICAgdGhpcy5fY3R4ID0gbmV3IFNvdW5kQ29udGV4dC5BdWRpb0NvbnRleHQoKTtcbiAgICAgICAgdGhpcy5fb2ZmbGluZUN0eCA9IG5ldyBTb3VuZENvbnRleHQuT2ZmbGluZUF1ZGlvQ29udGV4dCgxLCAyLCB0aGlzLl9jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgIHRoaXMuX2dhaW5Ob2RlID0gdGhpcy5fY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5fY29tcHJlc3NvciA9IHRoaXMuX2N0eC5jcmVhdGVEeW5hbWljc0NvbXByZXNzb3IoKTtcbiAgICAgICAgdGhpcy5fZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLl9jb21wcmVzc29yKTtcbiAgICAgICAgdGhpcy5fY29tcHJlc3Nvci5jb25uZWN0KHRoaXMuX2N0eC5kZXN0aW5hdGlvbik7XG4gICAgICAgIHRoaXMudm9sdW1lID0gMTtcbiAgICAgICAgdGhpcy5tdXRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICB3ZWJBdWRpb0lPUyh3aW5kb3csIHRoaXMuX2N0eCwgZnVuY3Rpb24gKCkge1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dCwgXCJBdWRpb0NvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB3aW4gPSB3aW5kb3c7XG4gICAgICAgICAgICByZXR1cm4gKHdpbi5BdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICB3aW4ud2Via2l0QXVkaW9Db250ZXh0IHx8XG4gICAgICAgICAgICAgICAgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQsIFwiT2ZmbGluZUF1ZGlvQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHdpbiA9IHdpbmRvdztcbiAgICAgICAgICAgIHJldHVybiAod2luLk9mZmxpbmVBdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICB3aW4ud2Via2l0T2ZmbGluZUF1ZGlvQ29udGV4dCB8fFxuICAgICAgICAgICAgICAgIG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZENvbnRleHQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG4gICAgICAgIGlmICh0eXBlb2YgY3R4LmNsb3NlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjdHguY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9nYWluTm9kZS5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuX2NvbXByZXNzb3IuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLl9vZmZsaW5lQ3R4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY3R4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZ2Fpbk5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9jb21wcmVzc29yID0gbnVsbDtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcImF1ZGlvQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2N0eDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwib2ZmbGluZUNvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vZmZsaW5lQ3R4O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJtdXRlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX211dGVkO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChtdXRlZCkge1xuICAgICAgICAgICAgdGhpcy5fbXV0ZWQgPSAhIW11dGVkO1xuICAgICAgICAgICAgdGhpcy5fZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IHRoaXMuX211dGVkID8gMCA6IHRoaXMuX3ZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwidm9sdW1lXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2b2x1bWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZvbHVtZSA9IHZvbHVtZTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fbXV0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nYWluTm9kZS5nYWluLnZhbHVlID0gdGhpcy5fdm9sdW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJwYXVzZWRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wYXVzZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHBhdXNlZCkge1xuICAgICAgICAgICAgaWYgKHBhdXNlZCAmJiB0aGlzLl9jdHguc3RhdGUgPT09IFwicnVubmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3R4LnN1c3BlbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCFwYXVzZWQgJiYgdGhpcy5fY3R4LnN0YXRlID09PSBcInN1c3BlbmRlZFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3R4LnJlc3VtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGF1c2VkID0gcGF1c2VkO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJkZXN0aW5hdGlvblwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dhaW5Ob2RlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZENvbnRleHQucHJvdG90eXBlLnRvZ2dsZU11dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubXV0ZWQgPSAhdGhpcy5tdXRlZDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX211dGVkO1xuICAgIH07XG4gICAgU291bmRDb250ZXh0LnByb3RvdHlwZS5kZWNvZGUgPSBmdW5jdGlvbiAoYXJyYXlCdWZmZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuX29mZmxpbmVDdHguZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyLCBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCBidWZmZXIpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJVbmFibGUgdG8gZGVjb2RlIGZpbGVcIikpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBTb3VuZENvbnRleHQ7XG59KCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmRDb250ZXh0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmRDb250ZXh0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgaWQgPSAwO1xudmFyIFNvdW5kSW5zdGFuY2UgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTb3VuZEluc3RhbmNlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFNvdW5kSW5zdGFuY2UocGFyZW50KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmlkID0gaWQrKztcbiAgICAgICAgX3RoaXMuX3BhcmVudCA9IG51bGw7XG4gICAgICAgIF90aGlzLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuX2VsYXBzZWQgPSAwO1xuICAgICAgICBfdGhpcy5faW5pdChwYXJlbnQpO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFNvdW5kSW5zdGFuY2UuY3JlYXRlID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICBpZiAoU291bmRJbnN0YW5jZS5fcG9vbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgc291bmQgPSBTb3VuZEluc3RhbmNlLl9wb29sLnBvcCgpO1xuICAgICAgICAgICAgc291bmQuX2luaXQocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU291bmRJbnN0YW5jZShwYXJlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChcInN0b3BcIik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgc3BlZWQsIGxvb3ApIHtcbiAgICAgICAgaWYgKHN0YXJ0ID09PSB2b2lkIDApIHsgc3RhcnQgPSAwOyB9XG4gICAgICAgIGlmIChlbmQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KGVuZCA+IHN0YXJ0LCBcIkVuZCB0aW1lIGlzIGJlZm9yZSBzdGFydCB0aW1lXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9zb3VyY2UgPSB0aGlzLl9wYXJlbnQubm9kZXMuY2xvbmVCdWZmZXJTb3VyY2UoKTtcbiAgICAgICAgaWYgKHNwZWVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5wbGF5YmFja1JhdGUudmFsdWUgPSBzcGVlZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zcGVlZCA9IHRoaXMuX3NvdXJjZS5wbGF5YmFja1JhdGUudmFsdWU7XG4gICAgICAgIGlmIChsb29wICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5sb29wID0gbG9vcDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc291cmNlLmxvb3AgJiYgZW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignTG9vcGluZyBub3Qgc3VwcG9ydCB3aGVuIHNwZWNpZnlpbmcgYW4gXCJlbmRcIiB0aW1lJyk7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UubG9vcCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xhc3RVcGRhdGUgPSB0aGlzLl9ub3coKTtcbiAgICAgICAgdGhpcy5fZWxhcHNlZCA9IHN0YXJ0O1xuICAgICAgICB0aGlzLl9kdXJhdGlvbiA9IHRoaXMuX3NvdXJjZS5idWZmZXIuZHVyYXRpb247XG4gICAgICAgIHRoaXMuX3NvdXJjZS5vbmVuZGVkID0gdGhpcy5fb25Db21wbGV0ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9zb3VyY2Uuc3RhcnQoMCwgc3RhcnQsIChlbmQgPyBlbmQgLSBzdGFydCA6IHVuZGVmaW5lZCkpO1xuICAgICAgICB0aGlzLmVtaXQoXCJzdGFydFwiKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlKHRydWUpO1xuICAgICAgICB0aGlzLl9lbmFibGVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZEluc3RhbmNlLnByb3RvdHlwZSwgXCJfZW5hYmxlZFwiLCB7XG4gICAgICAgIHNldDogZnVuY3Rpb24gKGVuYWJsZWQpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLl9wYXJlbnQubm9kZXMuc2NyaXB0Tm9kZS5vbmF1ZGlvcHJvY2VzcyA9ICFlbmFibGVkID8gbnVsbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwicHJvZ3Jlc3NcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wcm9ncmVzcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLCBcInBhdXNlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocGF1c2VkKSB7XG4gICAgICAgICAgICBpZiAocGF1c2VkICE9PSB0aGlzLl9wYXVzZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXVzZWQgPSBwYXVzZWQ7XG4gICAgICAgICAgICAgICAgaWYgKHBhdXNlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicGF1c2VkXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicmVzdW1lZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KHRoaXMuX2VsYXBzZWQgJSB0aGlzLl9kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChcInBhdXNlXCIsIHBhdXNlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIHRoaXMuX2ludGVybmFsU3RvcCgpO1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc291cmNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWxhcHNlZCA9IDA7XG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gMDtcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIGlmIChTb3VuZEluc3RhbmNlLl9wb29sLmluZGV4T2YodGhpcykgPCAwKSB7XG4gICAgICAgICAgICBTb3VuZEluc3RhbmNlLl9wb29sLnB1c2godGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJbU291bmRJbnN0YW5jZSBpZD1cIiArIHRoaXMuaWQgKyBcIl1cIjtcbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9ub3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuY29udGV4dC5hdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24gKGZvcmNlKSB7XG4gICAgICAgIGlmIChmb3JjZSA9PT0gdm9pZCAwKSB7IGZvcmNlID0gZmFsc2U7IH1cbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdmFyIG5vdyA9IHRoaXMuX25vdygpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gbm93IC0gdGhpcy5fbGFzdFVwZGF0ZTtcbiAgICAgICAgICAgIGlmIChkZWx0YSA+IDAgfHwgZm9yY2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbGFwc2VkICs9IGRlbHRhO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RVcGRhdGUgPSBub3c7XG4gICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gdGhpcy5fZHVyYXRpb247XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSAoKHRoaXMuX2VsYXBzZWQgKiB0aGlzLl9zcGVlZCkgJSBkdXJhdGlvbikgLyBkdXJhdGlvbjtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoXCJwcm9ncmVzc1wiLCB0aGlzLl9wcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5faW50ZXJuYWxTdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuX29uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9zb3VyY2UpIHtcbiAgICAgICAgICAgIHRoaXMuX2VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZS5vbmVuZGVkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IDE7XG4gICAgICAgIHRoaXMuZW1pdChcInByb2dyZXNzXCIsIDEpO1xuICAgICAgICB0aGlzLmVtaXQoXCJlbmRcIiwgdGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRJbnN0YW5jZTtcbn0oUElYSS51dGlscy5FdmVudEVtaXR0ZXIpKTtcblNvdW5kSW5zdGFuY2UuX3Bvb2wgPSBbXTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kSW5zdGFuY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZEluc3RhbmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIGZpbHRlcnMgPSByZXF1aXJlKFwiLi9maWx0ZXJzXCIpO1xudmFyIFNvdW5kXzEgPSByZXF1aXJlKFwiLi9Tb3VuZFwiKTtcbnZhciBTb3VuZENvbnRleHRfMSA9IHJlcXVpcmUoXCIuL1NvdW5kQ29udGV4dFwiKTtcbnZhciBTb3VuZEluc3RhbmNlXzEgPSByZXF1aXJlKFwiLi9Tb3VuZEluc3RhbmNlXCIpO1xudmFyIFNvdW5kU3ByaXRlXzEgPSByZXF1aXJlKFwiLi9Tb3VuZFNwcml0ZVwiKTtcbnZhciBTb3VuZFV0aWxzXzEgPSByZXF1aXJlKFwiLi9Tb3VuZFV0aWxzXCIpO1xudmFyIFNvdW5kTGlicmFyeSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU291bmRMaWJyYXJ5KCkge1xuICAgICAgICBpZiAodGhpcy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQgPSBuZXcgU291bmRDb250ZXh0XzEuZGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NvdW5kcyA9IHt9O1xuICAgICAgICB0aGlzLnV0aWxzID0gU291bmRVdGlsc18xLmRlZmF1bHQ7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IGZpbHRlcnM7XG4gICAgICAgIHRoaXMuU291bmQgPSBTb3VuZF8xLmRlZmF1bHQ7XG4gICAgICAgIHRoaXMuU291bmRJbnN0YW5jZSA9IFNvdW5kSW5zdGFuY2VfMS5kZWZhdWx0O1xuICAgICAgICB0aGlzLlNvdW5kTGlicmFyeSA9IFNvdW5kTGlicmFyeTtcbiAgICAgICAgdGhpcy5Tb3VuZFNwcml0ZSA9IFNvdW5kU3ByaXRlXzEuZGVmYXVsdDtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kTGlicmFyeS5wcm90b3R5cGUsIFwiY29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnkucHJvdG90eXBlLCBcInN1cHBvcnRlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNvdW5kQ29udGV4dF8xLmRlZmF1bHQuQXVkaW9Db250ZXh0ICE9PSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChzb3VyY2UsIHNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuX2dldE9wdGlvbnMoc291cmNlW2FsaWFzXSwgc291cmNlT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1thbGlhc10gPSB0aGlzLmFkZChhbGlhcywgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydCghdGhpcy5fc291bmRzW3NvdXJjZV0sIFwiU291bmQgd2l0aCBhbGlhcyBcIiArIHNvdXJjZSArIFwiIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VPcHRpb25zIGluc3RhbmNlb2YgU291bmRfMS5kZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc291bmRzW3NvdXJjZV0gPSBzb3VyY2VPcHRpb25zO1xuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLl9nZXRPcHRpb25zKHNvdXJjZU9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHZhciBzb3VuZCA9IG5ldyBTb3VuZF8xLmRlZmF1bHQodGhpcy5jb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zb3VuZHNbc291cmNlXSA9IHNvdW5kO1xuICAgICAgICAgICAgICAgIHJldHVybiBzb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5fZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChzb3VyY2UsIG92ZXJyaWRlcykge1xuICAgICAgICB2YXIgb3B0aW9ucztcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyYzogc291cmNlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc291cmNlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyY0J1ZmZlcjogc291cmNlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKG9wdGlvbnMsIG92ZXJyaWRlcyB8fCB7fSk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICB0aGlzLmV4aXN0cyhhbGlhcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRMaWJyYXJ5LnByb3RvdHlwZSwgXCJ2b2x1bWVBbGxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LnZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0LnZvbHVtZSA9IHZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5wYXVzZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5wYXVzZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucmVzdW1lQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0LnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUubXV0ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5tdXRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS51bm11dGVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgYWxpYXMgaW4gdGhpcy5fc291bmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VuZHNbYWxpYXNdLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zb3VuZHNbYWxpYXNdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5zdG9wQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiB0aGlzLl9zb3VuZHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5leGlzdHMgPSBmdW5jdGlvbiAoYWxpYXMsIGFzc2VydCkge1xuICAgICAgICBpZiAoYXNzZXJ0ID09PSB2b2lkIDApIHsgYXNzZXJ0ID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIGV4aXN0cyA9ICEhdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgaWYgKGFzc2VydCkge1xuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQoZXhpc3RzLCBcIk5vIHNvdW5kIG1hdGNoaW5nIGFsaWFzICdcIiArIGFsaWFzICsgXCInLlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhpc3RzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHRoaXMuZXhpc3RzKGFsaWFzLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NvdW5kc1thbGlhc107XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoYWxpYXMsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykucGxheShvcHRpb25zKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5zdG9wKCk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpLnBhdXNlKCk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5yZXN1bWUoKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUudm9sdW1lID0gZnVuY3Rpb24gKGFsaWFzLCB2b2x1bWUpIHtcbiAgICAgICAgdmFyIHNvdW5kID0gdGhpcy5maW5kKGFsaWFzKTtcbiAgICAgICAgaWYgKHZvbHVtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzb3VuZC52b2x1bWUgPSB2b2x1bWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNvdW5kLnZvbHVtZTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykuZHVyYXRpb247XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsKCk7XG4gICAgICAgIHRoaXMuX3NvdW5kcyA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kTGlicmFyeTtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZExpYnJhcnk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZExpYnJhcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU291bmROb2RlcyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU291bmROb2Rlcyhjb250ZXh0KSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHZhciBhdWRpb0NvbnRleHQgPSB0aGlzLmNvbnRleHQuYXVkaW9Db250ZXh0O1xuICAgICAgICB2YXIgYnVmZmVyU291cmNlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgICB2YXIgc2NyaXB0Tm9kZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoU291bmROb2Rlcy5CVUZGRVJfU0laRSk7XG4gICAgICAgIHZhciBnYWluTm9kZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHZhciBhbmFseXNlciA9IGF1ZGlvQ29udGV4dC5jcmVhdGVBbmFseXNlcigpO1xuICAgICAgICBnYWluTm9kZS5jb25uZWN0KHRoaXMuY29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgIHNjcmlwdE5vZGUuY29ubmVjdCh0aGlzLmNvbnRleHQuZGVzdGluYXRpb24pO1xuICAgICAgICBhbmFseXNlci5jb25uZWN0KGdhaW5Ob2RlKTtcbiAgICAgICAgYnVmZmVyU291cmNlLmNvbm5lY3QoYW5hbHlzZXIpO1xuICAgICAgICB0aGlzLmJ1ZmZlclNvdXJjZSA9IGJ1ZmZlclNvdXJjZTtcbiAgICAgICAgdGhpcy5zY3JpcHROb2RlID0gc2NyaXB0Tm9kZTtcbiAgICAgICAgdGhpcy5nYWluTm9kZSA9IGdhaW5Ob2RlO1xuICAgICAgICB0aGlzLmFuYWx5c2VyID0gYW5hbHlzZXI7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBhbmFseXNlcjtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kTm9kZXMucHJvdG90eXBlLCBcImZpbHRlcnNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWx0ZXJzO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWx0ZXJzLmZvckVhY2goZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsdGVycyA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmFseXNlci5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlcnMgJiYgZmlsdGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWx0ZXJzID0gZmlsdGVycy5zbGljZSgwKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFuYWx5c2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJldkZpbHRlcl8xID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmaWx0ZXJzLmZvckVhY2goZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldkZpbHRlcl8xID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5hbmFseXNlci5jb25uZWN0KGZpbHRlci5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEuY29ubmVjdChmaWx0ZXIuZGVzdGluYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHByZXZGaWx0ZXJfMSA9IGZpbHRlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5idWZmZXJTb3VyY2UuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLnNjcmlwdE5vZGUuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5hbmFseXNlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5zY3JpcHROb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5nYWluTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIH07XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuY2xvbmVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcmlnID0gdGhpcy5idWZmZXJTb3VyY2U7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIGNsb25lLmJ1ZmZlciA9IG9yaWcuYnVmZmVyO1xuICAgICAgICBjbG9uZS5wbGF5YmFja1JhdGUudmFsdWUgPSBvcmlnLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgY2xvbmUubG9vcCA9IG9yaWcubG9vcDtcbiAgICAgICAgY2xvbmUuY29ubmVjdCh0aGlzLmRlc3RpbmF0aW9uKTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kTm9kZXM7XG59KCkpO1xuU291bmROb2Rlcy5CVUZGRVJfU0laRSA9IDI1Njtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kTm9kZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZE5vZGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNvdW5kU3ByaXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZFNwcml0ZShwYXJlbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSB0aGlzLmVuZCAtIHRoaXMuc3RhcnQ7XG4gICAgICAgIGNvbnNvbGUuYXNzZXJ0KHRoaXMuZHVyYXRpb24gPiAwLCBcIkVuZCB0aW1lIG11c3QgYmUgYWZ0ZXIgc3RhcnQgdGltZVwiKTtcbiAgICB9XG4gICAgU291bmRTcHJpdGUucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoY29tcGxldGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LnBsYXkoT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBjb21wbGV0ZTogY29tcGxldGUsXG4gICAgICAgICAgICBzcGVlZDogdGhpcy5zcGVlZCB8fCB0aGlzLnBhcmVudC5zcGVlZCxcbiAgICAgICAgICAgIGVuZDogdGhpcy5lbmQsXG4gICAgICAgICAgICBzdGFydDogdGhpcy5zdGFydCxcbiAgICAgICAgfSkpO1xuICAgIH07XG4gICAgU291bmRTcHJpdGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucGFyZW50ID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBTb3VuZFNwcml0ZTtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZFNwcml0ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kU3ByaXRlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHV1aWQgPSByZXF1aXJlKFwidXVpZFwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4vaW5kZXhcIik7XG52YXIgU291bmRfMSA9IHJlcXVpcmUoXCIuL1NvdW5kXCIpO1xudmFyIFNvdW5kVXRpbHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kVXRpbHMoKSB7XG4gICAgfVxuICAgIFNvdW5kVXRpbHMuc2luZVRvbmUgPSBmdW5jdGlvbiAoaGVydHosIHNlY29uZHMpIHtcbiAgICAgICAgaWYgKGhlcnR6ID09PSB2b2lkIDApIHsgaGVydHogPSAyMDA7IH1cbiAgICAgICAgaWYgKHNlY29uZHMgPT09IHZvaWQgMCkgeyBzZWNvbmRzID0gMTsgfVxuICAgICAgICB2YXIgc291bmRDb250ZXh0ID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQ7XG4gICAgICAgIHZhciBzb3VuZEluc3RhbmNlID0gbmV3IFNvdW5kXzEuZGVmYXVsdChzb3VuZENvbnRleHQsIHtcbiAgICAgICAgICAgIHNpbmdsZUluc3RhbmNlOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIG5DaGFubmVscyA9IDE7XG4gICAgICAgIHZhciBzYW1wbGVSYXRlID0gNDgwMDA7XG4gICAgICAgIHZhciBhbXBsaXR1ZGUgPSAyO1xuICAgICAgICB2YXIgYnVmZmVyID0gc291bmRDb250ZXh0LmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXIobkNoYW5uZWxzLCBzZWNvbmRzICogc2FtcGxlUmF0ZSwgc2FtcGxlUmF0ZSk7XG4gICAgICAgIHZhciBmQXJyYXkgPSBidWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZkFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGltZSA9IGkgLyBidWZmZXIuc2FtcGxlUmF0ZTtcbiAgICAgICAgICAgIHZhciBhbmdsZSA9IGhlcnR6ICogdGltZSAqIE1hdGguUEk7XG4gICAgICAgICAgICBmQXJyYXlbaV0gPSBNYXRoLnNpbihhbmdsZSkgKiBhbXBsaXR1ZGU7XG4gICAgICAgIH1cbiAgICAgICAgc291bmRJbnN0YW5jZS5idWZmZXIgPSBidWZmZXI7XG4gICAgICAgIHNvdW5kSW5zdGFuY2UuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gc291bmRJbnN0YW5jZTtcbiAgICB9O1xuICAgIFNvdW5kVXRpbHMucmVuZGVyID0gZnVuY3Rpb24gKHNvdW5kLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIHdpZHRoOiA1MTIsXG4gICAgICAgICAgICBoZWlnaHQ6IDEyOCxcbiAgICAgICAgICAgIGZpbGw6IFwiYmxhY2tcIixcbiAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG4gICAgICAgIGNvbnNvbGUuYXNzZXJ0KCEhc291bmQuYnVmZmVyLCBcIk5vIGJ1ZmZlciBmb3VuZCwgbG9hZCBmaXJzdFwiKTtcbiAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9IG9wdGlvbnMud2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodDtcbiAgICAgICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IG9wdGlvbnMuZmlsbDtcbiAgICAgICAgdmFyIGRhdGEgPSBzb3VuZC5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XG4gICAgICAgIHZhciBzdGVwID0gTWF0aC5jZWlsKGRhdGEubGVuZ3RoIC8gb3B0aW9ucy53aWR0aCk7XG4gICAgICAgIHZhciBhbXAgPSBvcHRpb25zLmhlaWdodCAvIDI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy53aWR0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWluID0gMS4wO1xuICAgICAgICAgICAgdmFyIG1heCA9IC0xLjA7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN0ZXA7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBkYXR1bSA9IGRhdGFbKGkgKiBzdGVwKSArIGpdO1xuICAgICAgICAgICAgICAgIGlmIChkYXR1bSA8IG1pbikge1xuICAgICAgICAgICAgICAgICAgICBtaW4gPSBkYXR1bTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRhdHVtID4gbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIG1heCA9IGRhdHVtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoaSwgKDEgKyBtaW4pICogYW1wLCAxLCBNYXRoLm1heCgxLCAobWF4IC0gbWluKSAqIGFtcCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQSVhJLkJhc2VUZXh0dXJlLmZyb21DYW52YXMoY2FudmFzKTtcbiAgICB9O1xuICAgIFNvdW5kVXRpbHMucGxheU9uY2UgPSBmdW5jdGlvbiAoc3JjLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgYWxpYXMgPSB1dWlkLnY0KCk7XG4gICAgICAgIGluZGV4XzEuZGVmYXVsdC5hZGQoYWxpYXMsIHtcbiAgICAgICAgICAgIHNyYzogc3JjLFxuICAgICAgICAgICAgcHJlbG9hZDogdHJ1ZSxcbiAgICAgICAgICAgIGF1dG9QbGF5OiB0cnVlLFxuICAgICAgICAgICAgbG9hZGVkOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4XzEuZGVmYXVsdC5yZW1vdmUoYWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpbmRleF8xLmRlZmF1bHQucmVtb3ZlKGFsaWFzKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhbGlhcztcbiAgICB9O1xuICAgIHJldHVybiBTb3VuZFV0aWxzO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kVXRpbHM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZFV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIFNvdW5kXzEgPSByZXF1aXJlKFwiLi9Tb3VuZFwiKTtcbnZhciBTb3VuZExpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL1NvdW5kTGlicmFyeVwiKTtcbnZhciBTb3VuZExpYnJhcnlQcm90b3R5cGUgPSBTb3VuZExpYnJhcnlfMS5kZWZhdWx0LnByb3RvdHlwZTtcbnZhciBTb3VuZFByb3RvdHlwZSA9IFNvdW5kXzEuZGVmYXVsdC5wcm90b3R5cGU7XG5Tb3VuZExpYnJhcnlQcm90b3R5cGUuc291bmQgPSBmdW5jdGlvbiBzb3VuZChhbGlhcykge1xuICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQuc291bmQgaXMgZGVwcmVjYXRlZCwgdXNlIFBJWEkuc291bmQuZmluZFwiKTtcbiAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKTtcbn07XG5Tb3VuZExpYnJhcnlQcm90b3R5cGUucGFubmluZyA9IGZ1bmN0aW9uIHBhbm5pbmcoYWxpYXMsIHBhbm5pbmcpIHtcbiAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLnBhbm5pbmcgaXMgZGVwcmVjYXRlZCwgdXNlIFBJWEkuc291bmQuZmlsdGVycy5TdGVyZW9QYW5cIik7XG4gICAgcmV0dXJuIDA7XG59O1xuU291bmRMaWJyYXJ5UHJvdG90eXBlLmFkZE1hcCA9IGZ1bmN0aW9uIGFkZE1hcChtYXAsIGdsb2JhbE9wdGlvbnMpIHtcbiAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLmFkZE1hcCBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC5hZGRcIik7XG4gICAgcmV0dXJuIHRoaXMuYWRkKG1hcCwgZ2xvYmFsT3B0aW9ucyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kTGlicmFyeVByb3RvdHlwZSwgXCJTb3VuZFV0aWxzXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5Tb3VuZFV0aWxzIGlzIGRlcHJlY2F0ZWQsIHVzZSBQSVhJLnNvdW5kLnV0aWxzXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy51dGlscztcbiAgICB9LFxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRQcm90b3R5cGUsIFwiYmxvY2tcIiwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLlNvdW5kLnByb3RvdHlwZS5ibG9jayBpcyBkZXByZWNhdGVkLCB1c2Ugc2luZ2xlSW5zdGFuY2UgaW5zdGVhZFwiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2luZ2xlSW5zdGFuY2U7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLlNvdW5kLnByb3RvdHlwZS5ibG9jayBpcyBkZXByZWNhdGVkLCB1c2Ugc2luZ2xlSW5zdGFuY2UgaW5zdGVhZFwiKTtcbiAgICAgICAgdGhpcy5zaW5nbGVJbnN0YW5jZSA9IHZhbHVlO1xuICAgIH0sXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlcHJlY2F0aW9ucy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi4vaW5kZXhcIik7XG52YXIgRGlzdG9ydGlvbkZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKERpc3RvcnRpb25GaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRGlzdG9ydGlvbkZpbHRlcihhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gdm9pZCAwKSB7IGFtb3VudCA9IDA7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRpc3RvcnRpb24gPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlV2F2ZVNoYXBlcigpO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGRpc3RvcnRpb24pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9kaXN0b3J0aW9uID0gZGlzdG9ydGlvbjtcbiAgICAgICAgX3RoaXMuYW1vdW50ID0gYW1vdW50O1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEaXN0b3J0aW9uRmlsdGVyLnByb3RvdHlwZSwgXCJhbW91bnRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hbW91bnQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSAqPSAxMDAwO1xuICAgICAgICAgICAgdGhpcy5fYW1vdW50ID0gdmFsdWU7XG4gICAgICAgICAgICB2YXIgc2FtcGxlcyA9IDQ0MTAwO1xuICAgICAgICAgICAgdmFyIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheShzYW1wbGVzKTtcbiAgICAgICAgICAgIHZhciBkZWcgPSBNYXRoLlBJIC8gMTgwO1xuICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgdmFyIHg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IHNhbXBsZXM7ICsraSkge1xuICAgICAgICAgICAgICAgIHggPSBpICogMiAvIHNhbXBsZXMgLSAxO1xuICAgICAgICAgICAgICAgIGN1cnZlW2ldID0gKDMgKyB2YWx1ZSkgKiB4ICogMjAgKiBkZWcgLyAoTWF0aC5QSSArIHZhbHVlICogTWF0aC5hYnMoeCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGlzdG9ydGlvbi5jdXJ2ZSA9IGN1cnZlO1xuICAgICAgICAgICAgdGhpcy5fZGlzdG9ydGlvbi5vdmVyc2FtcGxlID0gJzR4JztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRGlzdG9ydGlvbkZpbHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fZGlzdG9ydGlvbiA9IG51bGw7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIERpc3RvcnRpb25GaWx0ZXI7XG59KEZpbHRlcl8xLmRlZmF1bHQpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IERpc3RvcnRpb25GaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1EaXN0b3J0aW9uRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBFcXVhbGl6ZXJGaWx0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhFcXVhbGl6ZXJGaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRXF1YWxpemVyRmlsdGVyKGYzMiwgZjY0LCBmMTI1LCBmMjUwLCBmNTAwLCBmMWssIGYyaywgZjRrLCBmOGssIGYxNmspIHtcbiAgICAgICAgaWYgKGYzMiA9PT0gdm9pZCAwKSB7IGYzMiA9IDA7IH1cbiAgICAgICAgaWYgKGY2NCA9PT0gdm9pZCAwKSB7IGY2NCA9IDA7IH1cbiAgICAgICAgaWYgKGYxMjUgPT09IHZvaWQgMCkgeyBmMTI1ID0gMDsgfVxuICAgICAgICBpZiAoZjI1MCA9PT0gdm9pZCAwKSB7IGYyNTAgPSAwOyB9XG4gICAgICAgIGlmIChmNTAwID09PSB2b2lkIDApIHsgZjUwMCA9IDA7IH1cbiAgICAgICAgaWYgKGYxayA9PT0gdm9pZCAwKSB7IGYxayA9IDA7IH1cbiAgICAgICAgaWYgKGYyayA9PT0gdm9pZCAwKSB7IGYyayA9IDA7IH1cbiAgICAgICAgaWYgKGY0ayA9PT0gdm9pZCAwKSB7IGY0ayA9IDA7IH1cbiAgICAgICAgaWYgKGY4ayA9PT0gdm9pZCAwKSB7IGY4ayA9IDA7IH1cbiAgICAgICAgaWYgKGYxNmsgPT09IHZvaWQgMCkgeyBmMTZrID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZXF1YWxpemVyQmFuZHMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYzMixcbiAgICAgICAgICAgICAgICB0eXBlOiAnbG93c2hlbGYnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYzMlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjY0LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmNjRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxMjUsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYxMjVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYyNTAsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYyNTBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkY1MDAsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGY1MDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxSyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjFrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GMkssXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYya1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjRLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmNGtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkY4SyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjhrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GMTZLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdoaWdoc2hlbGYnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYxNmtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgdmFyIGJhbmRzID0gZXF1YWxpemVyQmFuZHMubWFwKGZ1bmN0aW9uIChiYW5kKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICAgICAgZmlsdGVyLnR5cGUgPSBiYW5kLnR5cGU7XG4gICAgICAgICAgICBmaWx0ZXIuZ2Fpbi52YWx1ZSA9IGJhbmQuZ2FpbjtcbiAgICAgICAgICAgIGZpbHRlci5RLnZhbHVlID0gMTtcbiAgICAgICAgICAgIGZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSBiYW5kLmY7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgICAgICB9KTtcbiAgICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBiYW5kc1swXSwgYmFuZHNbYmFuZHMubGVuZ3RoIC0gMV0pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmJhbmRzID0gYmFuZHM7XG4gICAgICAgIF90aGlzLmJhbmRzTWFwID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX3RoaXMuYmFuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gX3RoaXMuYmFuZHNbaV07XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5iYW5kc1tpIC0gMV0uY29ubmVjdChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmJhbmRzTWFwW25vZGUuZnJlcXVlbmN5LnZhbHVlXSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLnNldEdhaW4gPSBmdW5jdGlvbiAoZnJlcXVlbmN5LCBnYWluKSB7XG4gICAgICAgIGlmIChnYWluID09PSB2b2lkIDApIHsgZ2FpbiA9IDA7IH1cbiAgICAgICAgaWYgKCF0aGlzLmJhbmRzTWFwW2ZyZXF1ZW5jeV0pIHtcbiAgICAgICAgICAgIHRocm93ICdObyBiYW5kIGZvdW5kIGZvciBmcmVxdWVuY3kgJyArIGZyZXF1ZW5jeTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhbmRzTWFwW2ZyZXF1ZW5jeV0uZ2Fpbi52YWx1ZSA9IGdhaW47XG4gICAgfTtcbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJhbmRzLmZvckVhY2goZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIGJhbmQuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXF1YWxpemVyRmlsdGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJhbmRzLmZvckVhY2goZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIGJhbmQuZGlzY29ubmVjdCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5iYW5kcyA9IG51bGw7XG4gICAgICAgIHRoaXMuYmFuZHNNYXAgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIEVxdWFsaXplckZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuRXF1YWxpemVyRmlsdGVyLkYzMiA9IDMyO1xuRXF1YWxpemVyRmlsdGVyLkY2NCA9IDY0O1xuRXF1YWxpemVyRmlsdGVyLkYxMjUgPSAxMjU7XG5FcXVhbGl6ZXJGaWx0ZXIuRjI1MCA9IDI1MDtcbkVxdWFsaXplckZpbHRlci5GNTAwID0gNTAwO1xuRXF1YWxpemVyRmlsdGVyLkYxSyA9IDEwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjJLID0gMjAwMDtcbkVxdWFsaXplckZpbHRlci5GNEsgPSA0MDAwO1xuRXF1YWxpemVyRmlsdGVyLkY4SyA9IDgwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjE2SyA9IDE2MDAwO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRXF1YWxpemVyRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RXF1YWxpemVyRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIEZpbHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsdGVyKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uO1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZSB8fCBkZXN0aW5hdGlvbjtcbiAgICB9XG4gICAgRmlsdGVyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uKSB7XG4gICAgICAgIHRoaXMuc291cmNlLmNvbm5lY3QoZGVzdGluYXRpb24pO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNvdXJjZS5kaXNjb25uZWN0KCk7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIEZpbHRlcjtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBGaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1GaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIFJldmVyYkZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJldmVyYkZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSZXZlcmJGaWx0ZXIoc2Vjb25kcywgZGVjYXksIHJldmVyc2UpIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPT09IHZvaWQgMCkgeyBzZWNvbmRzID0gMzsgfVxuICAgICAgICBpZiAoZGVjYXkgPT09IHZvaWQgMCkgeyBkZWNheSA9IDI7IH1cbiAgICAgICAgaWYgKHJldmVyc2UgPT09IHZvaWQgMCkgeyByZXZlcnNlID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGNvbnZvbHZlciA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dC5jcmVhdGVDb252b2x2ZXIoKTtcbiAgICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBjb252b2x2ZXIpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9jb252b2x2ZXIgPSBjb252b2x2ZXI7XG4gICAgICAgIF90aGlzLl9zZWNvbmRzID0gX3RoaXMuX2NsYW1wKHNlY29uZHMsIDEsIDUwKTtcbiAgICAgICAgX3RoaXMuX2RlY2F5ID0gX3RoaXMuX2NsYW1wKGRlY2F5LCAwLCAxMDApO1xuICAgICAgICBfdGhpcy5fcmV2ZXJzZSA9IHJldmVyc2U7XG4gICAgICAgIF90aGlzLl9yZWJ1aWxkKCk7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgUmV2ZXJiRmlsdGVyLnByb3RvdHlwZS5fY2xhbXAgPSBmdW5jdGlvbiAodmFsdWUsIG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdmFsdWUpKTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZXZlcmJGaWx0ZXIucHJvdG90eXBlLCBcInNlY29uZHNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zZWNvbmRzO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWNvbmRzID0gdGhpcy5fY2xhbXAoc2Vjb25kcywgMSwgNTApO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmV2ZXJiRmlsdGVyLnByb3RvdHlwZSwgXCJkZWNheVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY2F5O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChkZWNheSkge1xuICAgICAgICAgICAgdGhpcy5fZGVjYXkgPSB0aGlzLl9jbGFtcChkZWNheSwgMCwgMTAwKTtcbiAgICAgICAgICAgIHRoaXMuX3JlYnVpbGQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJldmVyYkZpbHRlci5wcm90b3R5cGUsIFwicmV2ZXJzZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHJldmVyc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3JldmVyc2UgPSByZXZlcnNlO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLl9yZWJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29udGV4dCA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dDtcbiAgICAgICAgdmFyIHJhdGUgPSBjb250ZXh0LnNhbXBsZVJhdGU7XG4gICAgICAgIHZhciBsZW5ndGggPSByYXRlICogdGhpcy5fc2Vjb25kcztcbiAgICAgICAgdmFyIGltcHVsc2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlcigyLCBsZW5ndGgsIHJhdGUpO1xuICAgICAgICB2YXIgaW1wdWxzZUwgPSBpbXB1bHNlLmdldENoYW5uZWxEYXRhKDApO1xuICAgICAgICB2YXIgaW1wdWxzZVIgPSBpbXB1bHNlLmdldENoYW5uZWxEYXRhKDEpO1xuICAgICAgICB2YXIgbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbiA9IHRoaXMuX3JldmVyc2UgPyBsZW5ndGggLSBpIDogaTtcbiAgICAgICAgICAgIGltcHVsc2VMW2ldID0gKE1hdGgucmFuZG9tKCkgKiAyIC0gMSkgKiBNYXRoLnBvdygxIC0gbiAvIGxlbmd0aCwgdGhpcy5fZGVjYXkpO1xuICAgICAgICAgICAgaW1wdWxzZVJbaV0gPSAoTWF0aC5yYW5kb20oKSAqIDIgLSAxKSAqIE1hdGgucG93KDEgLSBuIC8gbGVuZ3RoLCB0aGlzLl9kZWNheSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udm9sdmVyLmJ1ZmZlciA9IGltcHVsc2U7XG4gICAgfTtcbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnZvbHZlciA9IG51bGw7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFJldmVyYkZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gUmV2ZXJiRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmV2ZXJiRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBTdGVyZW9GaWx0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTdGVyZW9GaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU3RlcmVvRmlsdGVyKHBhbikge1xuICAgICAgICBpZiAocGFuID09PSB2b2lkIDApIHsgcGFuID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgc3RlcmVvO1xuICAgICAgICB2YXIgcGFubmVyO1xuICAgICAgICB2YXIgZGVzdGluYXRpb247XG4gICAgICAgIHZhciBhdWRpb0NvbnRleHQgPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dC5hdWRpb0NvbnRleHQ7XG4gICAgICAgIGlmIChhdWRpb0NvbnRleHQuY3JlYXRlU3RlcmVvUGFubmVyKSB7XG4gICAgICAgICAgICBzdGVyZW8gPSBhdWRpb0NvbnRleHQuY3JlYXRlU3RlcmVvUGFubmVyKCk7XG4gICAgICAgICAgICBkZXN0aW5hdGlvbiA9IHN0ZXJlbztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhbm5lciA9IGF1ZGlvQ29udGV4dC5jcmVhdGVQYW5uZXIoKTtcbiAgICAgICAgICAgIHBhbm5lci5wYW5uaW5nTW9kZWwgPSAnZXF1YWxwb3dlcic7XG4gICAgICAgICAgICBkZXN0aW5hdGlvbiA9IHBhbm5lcjtcbiAgICAgICAgfVxuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGRlc3RpbmF0aW9uKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5fc3RlcmVvID0gc3RlcmVvO1xuICAgICAgICBfdGhpcy5fcGFubmVyID0gcGFubmVyO1xuICAgICAgICBfdGhpcy5wYW4gPSBwYW47XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0ZXJlb0ZpbHRlci5wcm90b3R5cGUsIFwicGFuXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFuO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fcGFuID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fc3RlcmVvKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RlcmVvLnBhbi52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFubmVyLnNldFBvc2l0aW9uKHZhbHVlLCAwLCAxIC0gTWF0aC5hYnModmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU3RlcmVvRmlsdGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRlc3Ryb3kuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5fc3RlcmVvID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcGFubmVyID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBTdGVyZW9GaWx0ZXI7XG59KEZpbHRlcl8xLmRlZmF1bHQpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFN0ZXJlb0ZpbHRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN0ZXJlb0ZpbHRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbmV4cG9ydHMuRmlsdGVyID0gRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBFcXVhbGl6ZXJGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0VxdWFsaXplckZpbHRlclwiKTtcbmV4cG9ydHMuRXF1YWxpemVyRmlsdGVyID0gRXF1YWxpemVyRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBEaXN0b3J0aW9uRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9EaXN0b3J0aW9uRmlsdGVyXCIpO1xuZXhwb3J0cy5EaXN0b3J0aW9uRmlsdGVyID0gRGlzdG9ydGlvbkZpbHRlcl8xLmRlZmF1bHQ7XG52YXIgU3RlcmVvRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9TdGVyZW9GaWx0ZXJcIik7XG5leHBvcnRzLlN0ZXJlb0ZpbHRlciA9IFN0ZXJlb0ZpbHRlcl8xLmRlZmF1bHQ7XG52YXIgUmV2ZXJiRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9SZXZlcmJGaWx0ZXJcIik7XG5leHBvcnRzLlJldmVyYkZpbHRlciA9IFJldmVyYkZpbHRlcl8xLmRlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBMb2FkZXJNaWRkbGV3YXJlXzEgPSByZXF1aXJlKFwiLi9Mb2FkZXJNaWRkbGV3YXJlXCIpO1xudmFyIFNvdW5kTGlicmFyeV8xID0gcmVxdWlyZShcIi4vU291bmRMaWJyYXJ5XCIpO1xucmVxdWlyZShcIi4vZGVwcmVjYXRpb25zXCIpO1xudmFyIHNvdW5kID0gbmV3IFNvdW5kTGlicmFyeV8xLmRlZmF1bHQoKTtcbmlmIChnbG9iYWwuUElYSSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGl4aS5qcyBpcyByZXF1aXJlZFwiKTtcbn1cbmlmIChQSVhJLmxvYWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIExvYWRlck1pZGRsZXdhcmVfMS5pbnN0YWxsKCk7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUElYSSwgXCJzb3VuZFwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBzb3VuZDsgfSxcbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gc291bmQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJ2YXIgdjEgPSByZXF1aXJlKCcuL3YxJyk7XG52YXIgdjQgPSByZXF1aXJlKCcuL3Y0Jyk7XG5cbnZhciB1dWlkID0gdjQ7XG51dWlkLnYxID0gdjE7XG51dWlkLnY0ID0gdjQ7XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiIsIi8qKlxuICogQ29udmVydCBhcnJheSBvZiAxNiBieXRlIHZhbHVlcyB0byBVVUlEIHN0cmluZyBmb3JtYXQgb2YgdGhlIGZvcm06XG4gKiBYWFhYWFhYWC1YWFhYLVhYWFgtWFhYWC1YWFhYLVhYWFhYWFhYWFhYWFxuICovXG52YXIgYnl0ZVRvSGV4ID0gW107XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSB7XG4gIGJ5dGVUb0hleFtpXSA9IChpICsgMHgxMDApLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSk7XG59XG5cbmZ1bmN0aW9uIGJ5dGVzVG9VdWlkKGJ1Ziwgb2Zmc2V0KSB7XG4gIHZhciBpID0gb2Zmc2V0IHx8IDA7XG4gIHZhciBidGggPSBieXRlVG9IZXg7XG4gIHJldHVybiAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ5dGVzVG9VdWlkO1xuIiwiLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIEluIHRoZVxuLy8gYnJvd3NlciB0aGlzIGlzIGEgbGl0dGxlIGNvbXBsaWNhdGVkIGR1ZSB0byB1bmtub3duIHF1YWxpdHkgb2YgTWF0aC5yYW5kb20oKVxuLy8gYW5kIGluY29uc2lzdGVudCBzdXBwb3J0IGZvciB0aGUgYGNyeXB0b2AgQVBJLiAgV2UgZG8gdGhlIGJlc3Qgd2UgY2FuIHZpYVxuLy8gZmVhdHVyZS1kZXRlY3Rpb25cbnZhciBybmc7XG5cbnZhciBjcnlwdG8gPSBnbG9iYWwuY3J5cHRvIHx8IGdsb2JhbC5tc0NyeXB0bzsgLy8gZm9yIElFIDExXG5pZiAoY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0byBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIHZhciBybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMocm5kczgpO1xuICAgIHJldHVybiBybmRzODtcbiAgfTtcbn1cblxuaWYgKCFybmcpIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgIHJuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgcm5kc1tpXSA9IHIgPj4+ICgoaSAmIDB4MDMpIDw8IDMpICYgMHhmZjtcbiAgICB9XG5cbiAgICByZXR1cm4gcm5kcztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBybmc7XG4iLCIvLyBVbmlxdWUgSUQgY3JlYXRpb24gcmVxdWlyZXMgYSBoaWdoIHF1YWxpdHkgcmFuZG9tICMgZ2VuZXJhdG9yLiAgV2UgZmVhdHVyZVxuLy8gZGV0ZWN0IHRvIGRldGVybWluZSB0aGUgYmVzdCBSTkcgc291cmNlLCBub3JtYWxpemluZyB0byBhIGZ1bmN0aW9uIHRoYXRcbi8vIHJldHVybnMgMTI4LWJpdHMgb2YgcmFuZG9tbmVzcywgc2luY2UgdGhhdCdzIHdoYXQncyB1c3VhbGx5IHJlcXVpcmVkXG52YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG4vLyAqKmB2MSgpYCAtIEdlbmVyYXRlIHRpbWUtYmFzZWQgVVVJRCoqXG4vL1xuLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL0xpb3NLL1VVSUQuanNcbi8vIGFuZCBodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvdXVpZC5odG1sXG5cbi8vIHJhbmRvbSAjJ3Mgd2UgbmVlZCB0byBpbml0IG5vZGUgYW5kIGNsb2Nrc2VxXG52YXIgX3NlZWRCeXRlcyA9IHJuZygpO1xuXG4vLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbnZhciBfbm9kZUlkID0gW1xuICBfc2VlZEJ5dGVzWzBdIHwgMHgwMSxcbiAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuXTtcblxuLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcbnZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbi8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxudmFyIF9sYXN0TVNlY3MgPSAwLCBfbGFzdE5TZWNzID0gMDtcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG4gIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjbG9ja3NlcSA9IG9wdGlvbnMuY2xvY2tzZXEgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY2xvY2tzZXEgOiBfY2xvY2tzZXE7XG5cbiAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgLy8gdGltZSBpcyBoYW5kbGVkIGludGVybmFsbHkgYXMgJ21zZWNzJyAoaW50ZWdlciBtaWxsaXNlY29uZHMpIGFuZCAnbnNlY3MnXG4gIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXG4gIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAvLyBUaW1lIHNpbmNlIGxhc3QgdXVpZCBjcmVhdGlvbiAoaW4gbXNlY3MpXG4gIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICBpZiAoZHQgPCAwICYmIG9wdGlvbnMuY2xvY2tzZXEgPT09IHVuZGVmaW5lZCkge1xuICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICB9XG5cbiAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcbiAgLy8gdGltZSBpbnRlcnZhbFxuICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT09IHVuZGVmaW5lZCkge1xuICAgIG5zZWNzID0gMDtcbiAgfVxuXG4gIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgaWYgKG5zZWNzID49IDEwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gIH1cblxuICBfbGFzdE1TZWNzID0gbXNlY3M7XG4gIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXG4gIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gIC8vIGB0aW1lX2xvd2BcbiAgdmFyIHRsID0gKChtc2VjcyAmIDB4ZmZmZmZmZikgKiAxMDAwMCArIG5zZWNzKSAlIDB4MTAwMDAwMDAwO1xuICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAvLyBgdGltZV9taWRgXG4gIHZhciB0bWggPSAobXNlY3MgLyAweDEwMDAwMDAwMCAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxuICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gIC8vIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYCAoUGVyIDQuMi4yIC0gaW5jbHVkZSB2YXJpYW50KVxuICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gIGJbaSsrXSA9IGNsb2Nrc2VxICYgMHhmZjtcblxuICAvLyBgbm9kZWBcbiAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyArK24pIHtcbiAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gIH1cblxuICByZXR1cm4gYnVmID8gYnVmIDogYnl0ZXNUb1V1aWQoYik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdjE7XG4iLCJ2YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG5mdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IHJuZykoKTtcblxuICAvLyBQZXIgNC40LCBzZXQgYml0cyBmb3IgdmVyc2lvbiBhbmQgYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgXG4gIHJuZHNbNl0gPSAocm5kc1s2XSAmIDB4MGYpIHwgMHg0MDtcbiAgcm5kc1s4XSA9IChybmRzWzhdICYgMHgzZikgfCAweDgwO1xuXG4gIC8vIENvcHkgYnl0ZXMgdG8gYnVmZmVyLCBpZiBwcm92aWRlZFxuICBpZiAoYnVmKSB7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IDE2OyArK2lpKSB7XG4gICAgICBidWZbaSArIGlpXSA9IHJuZHNbaWldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWYgfHwgYnl0ZXNUb1V1aWQocm5kcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdjQ7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbCwgYWMsIGNiKSB7XG4gIGZ1bmN0aW9uIGhhbmRsZUlPUyhlKSB7XG4gICAgdmFyIGJ1ZmZlciA9IGFjLmNyZWF0ZUJ1ZmZlcigxLCAxLCAyMjA1MClcbiAgICB2YXIgc291cmNlID0gYWMuY3JlYXRlQnVmZmVyU291cmNlKClcbiAgICBzb3VyY2UuYnVmZmVyID0gYnVmZmVyXG4gICAgc291cmNlLmNvbm5lY3QoYWMuZGVzdGluYXRpb24pXG4gICAgc291cmNlLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKVxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVJT1MsIGZhbHNlKVxuICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBoYW5kbGVJT1MsIGZhbHNlKVxuICAgICAgY2Ioc291cmNlLnBsYXliYWNrU3RhdGUgPT09IHNvdXJjZS5QTEFZSU5HX1NUQVRFIHx8IHNvdXJjZS5wbGF5YmFja1N0YXRlID09PSBzb3VyY2UuRklOSVNIRURfU1RBVEUpXG4gICAgfSwgMSlcbiAgfVxuICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVJT1MsIGZhbHNlKVxuICBlbC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGhhbmRsZUlPUywgZmFsc2UpXG59XG4iXX0=
