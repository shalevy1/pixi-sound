(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sound = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Filterable = (function () {
    function Filterable(input, output) {
        this._output = output;
        this._input = input;
    }
    Object.defineProperty(Filterable.prototype, "destination", {
        get: function () {
            return this._input;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Filterable.prototype, "filters", {
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
                this._input.connect(this._output);
            }
            if (filters && filters.length) {
                this._filters = filters.slice(0);
                this._input.disconnect();
                var prevFilter_1 = null;
                filters.forEach(function (filter) {
                    if (prevFilter_1 === null) {
                        _this._input.connect(filter.destination);
                    }
                    else {
                        prevFilter_1.connect(filter.destination);
                    }
                    prevFilter_1 = filter;
                });
                prevFilter_1.connect(this._output);
            }
        },
        enumerable: true,
        configurable: true
    });
    Filterable.prototype.destroy = function () {
        this.filters = null;
        this._input = null;
        this._output = null;
    };
    return Filterable;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Filterable;

},{}],2:[function(require,module,exports){
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

},{"./index":17}],3:[function(require,module,exports){
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
        var complete = options.complete;
        this._autoPlayOptions = complete ? { complete: complete } : null;
        this.isLoaded = false;
        this.isPlaying = false;
        this.autoPlay = options.autoPlay;
        this.singleInstance = options.singleInstance;
        this.preload = options.preload || this.autoPlay;
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
            this._beginPreload(options.loaded);
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
            return this._volume;
        },
        set: function (volume) {
            this._volume = this._nodes.gain.gain.value = volume;
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
    Sound.prototype.play = function (source, complete) {
        var _this = this;
        var options;
        if (typeof source === "string") {
            var sprite = source;
            options = { sprite: sprite, complete: complete };
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
            sprite: null,
            start: 0,
            fadeIn: 0,
            fadeOut: 0,
        }, options || {});
        if (options.sprite) {
            var alias = options.sprite;
            console.assert(!!this._sprites[alias], "Alias " + alias + " is not available");
            var sprite = this._sprites[alias];
            options.start = sprite.start;
            options.end = sprite.end;
            options.speed = sprite.speed;
            delete options.sprite;
        }
        if (options.offset) {
            options.start = options.offset;
        }
        if (!this.isLoaded) {
            return new Promise(function (resolve, reject) {
                _this.autoPlay = true;
                _this._autoPlayOptions = options;
                _this._beginPreload(function (err, sound, instance) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        if (options.loaded) {
                            options.loaded(err, sound, instance);
                        }
                        resolve(instance);
                    }
                });
            });
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
        instance.play(options.start, options.end, options.speed, options.loop, options.fadeIn, options.fadeOut);
        return instance;
    };
    Sound.prototype.stop = function () {
        if (!this.isPlayable) {
            this.autoPlay = false;
            this._autoPlayOptions = null;
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
    Sound.prototype._beginPreload = function (callback) {
        if (this.src) {
            this.useXHR ? this._loadUrl(callback) : this._loadPath(callback);
        }
        else if (this.srcBuffer) {
            this._decode(this.srcBuffer, callback);
        }
        else if (callback) {
            callback(new Error("sound.src or sound.srcBuffer must be set"));
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
    Sound.prototype._loadUrl = function (callback) {
        var _this = this;
        var request = new XMLHttpRequest();
        var src = this.src;
        request.open("GET", src, true);
        request.responseType = "arraybuffer";
        request.onload = function () {
            _this.srcBuffer = request.response;
            _this._decode(request.response, callback);
        };
        request.send();
    };
    Sound.prototype._loadPath = function (callback) {
        var _this = this;
        var fs = require("fs");
        var src = this.src;
        fs.readFile(src, function (err, data) {
            if (err) {
                console.error(err);
                if (callback) {
                    callback(new Error("File not found " + _this.src));
                }
                return;
            }
            var arrayBuffer = new ArrayBuffer(data.length);
            var view = new Uint8Array(arrayBuffer);
            for (var i = 0; i < data.length; ++i) {
                view[i] = data[i];
            }
            _this.srcBuffer = arrayBuffer;
            _this._decode(arrayBuffer, callback);
        });
    };
    Sound.prototype._decode = function (arrayBuffer, callback) {
        var _this = this;
        this._context.decode(arrayBuffer, function (err, buffer) {
            if (err) {
                if (callback) {
                    callback(err);
                }
            }
            else {
                _this.isLoaded = true;
                _this.buffer = buffer;
                var instance = void 0;
                if (_this.autoPlay) {
                    instance = _this.play(_this._autoPlayOptions);
                }
                if (callback) {
                    callback(null, _this, instance);
                }
            }
        });
    };
    return Sound;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Sound;

},{"./SoundInstance":5,"./SoundNodes":7,"./SoundSprite":8,"./index":17,"fs":undefined}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Filterable_1 = require("./Filterable");
var SoundContext = (function (_super) {
    __extends(SoundContext, _super);
    function SoundContext() {
        var _this = this;
        var ctx = new SoundContext.AudioContext();
        var gain = ctx.createGain();
        var compressor = ctx.createDynamicsCompressor();
        var analyser = ctx.createAnalyser();
        analyser.connect(gain);
        gain.connect(compressor);
        compressor.connect(ctx.destination);
        _this = _super.call(this, analyser, gain) || this;
        _this._ctx = ctx;
        _this._offlineCtx = new SoundContext.OfflineAudioContext(1, 2, ctx.sampleRate);
        _this._unlocked = false;
        _this.gain = gain;
        _this.compressor = compressor;
        _this.analyser = analyser;
        _this.volume = 1;
        _this.muted = false;
        _this.paused = false;
        if ("ontouchstart" in window && ctx.state !== "running") {
            _this._unlock();
            _this._unlock = _this._unlock.bind(_this);
            document.addEventListener("mousedown", _this._unlock, true);
            document.addEventListener("touchstart", _this._unlock, true);
            document.addEventListener("touchend", _this._unlock, true);
        }
        return _this;
    }
    SoundContext.prototype._unlock = function () {
        if (this._unlocked) {
            return;
        }
        this.playEmptySound();
        if (this._ctx.state === "running") {
            document.removeEventListener("mousedown", this._unlock, true);
            document.removeEventListener("touchend", this._unlock, true);
            document.removeEventListener("touchstart", this._unlock, true);
            this._unlocked = true;
        }
    };
    SoundContext.prototype.playEmptySound = function () {
        var source = this._ctx.createBufferSource();
        source.buffer = this._ctx.createBuffer(1, 1, 22050);
        source.connect(this._ctx.destination);
        source.start(0, 0, 0);
    };
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
        _super.prototype.destroy.call(this);
        var ctx = this._ctx;
        if (typeof ctx.close !== "undefined") {
            ctx.close();
        }
        this.analyser.disconnect();
        this.gain.disconnect();
        this.compressor.disconnect();
        this.gain = null;
        this.analyser = null;
        this.compressor = null;
        this._offlineCtx = null;
        this._ctx = null;
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
            this.gain.gain.value = this._muted ? 0 : this._volume;
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
                this.gain.gain.value = this._volume;
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
}(Filterable_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundContext;

},{"./Filterable":1}],5:[function(require,module,exports){
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
    SoundInstance.prototype.play = function (start, end, speed, loop, fadeIn, fadeOut) {
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
            this._loop = this._source.loop = !!loop;
        }
        if (this._loop && end !== undefined) {
            console.warn('Looping not support when specifying an "end" time');
            this._loop = this._source.loop = false;
        }
        this._end = end;
        var duration = this._source.buffer.duration;
        fadeIn = this._toSec(fadeIn);
        if (fadeIn > duration) {
            fadeIn = duration;
        }
        if (!this._loop) {
            fadeOut = this._toSec(fadeOut);
            if (fadeOut > duration - fadeIn) {
                fadeOut = duration - fadeIn;
            }
        }
        this._duration = duration;
        this._fadeIn = fadeIn;
        this._fadeOut = fadeOut;
        this._lastUpdate = this._now();
        this._elapsed = start;
        this._source.onended = this._onComplete.bind(this);
        this._source.start(0, start, (end ? end - start : undefined));
        this.emit("start");
        this._update(true);
        this._enabled = true;
    };
    SoundInstance.prototype._toSec = function (time) {
        if (time > 10) {
            time /= 1000;
        }
        return time || 0;
    };
    Object.defineProperty(SoundInstance.prototype, "_enabled", {
        set: function (enabled) {
            var _this = this;
            this._parent.nodes.script.onaudioprocess = !enabled ? null : function () {
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
                    this.play(this._elapsed % this._duration, this._end, this._speed, this._loop, this._fadeIn, this._fadeOut);
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
        this._source = null;
        this._speed = 0;
        this._end = 0;
        this._parent = null;
        this._elapsed = 0;
        this._duration = 0;
        this._loop = false;
        this._fadeIn = 0;
        this._fadeOut = 0;
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
                var progress = ((this._elapsed * this._speed) % duration) / duration;
                if (this._fadeIn || this._fadeOut) {
                    var position = progress * duration;
                    var gain = this._parent.nodes.gain.gain;
                    var maxVolume = this._parent.volume;
                    if (this._fadeIn) {
                        if (position <= this._fadeIn && progress < 1) {
                            gain.value = maxVolume * (position / this._fadeIn);
                        }
                        else {
                            gain.value = maxVolume;
                            this._fadeIn = 0;
                        }
                    }
                    if (this._fadeOut && position >= duration - this._fadeOut) {
                        var percent = (duration - position) / this._fadeOut;
                        gain.value = maxVolume * percent;
                    }
                }
                this._progress = progress;
                this.emit("progress", this._progress, duration);
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
            this._parent.volume = this._parent.volume;
        }
    };
    SoundInstance.prototype._onComplete = function () {
        if (this._source) {
            this._enabled = false;
            this._source.onended = null;
        }
        this._source = null;
        this._progress = 1;
        this.emit("progress", 1, this._duration);
        this.emit("end", this);
    };
    return SoundInstance;
}(PIXI.utils.EventEmitter));
SoundInstance._pool = [];
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundInstance;

},{}],6:[function(require,module,exports){
"use strict";
var Filterable_1 = require("./Filterable");
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
        this.Filterable = Filterable_1.default;
    }
    Object.defineProperty(SoundLibrary.prototype, "context", {
        get: function () {
            return this._context;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SoundLibrary.prototype, "filtersAll", {
        get: function () {
            return this._context.filters;
        },
        set: function (filters) {
            this._context.filters = filters;
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

},{"./Filterable":1,"./Sound":3,"./SoundContext":4,"./SoundInstance":5,"./SoundSprite":8,"./SoundUtils":9,"./filters":16}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Filterable_1 = require("./Filterable");
var SoundNodes = (function (_super) {
    __extends(SoundNodes, _super);
    function SoundNodes(context) {
        var _this = this;
        var audioContext = context.audioContext;
        var bufferSource = audioContext.createBufferSource();
        var script = audioContext.createScriptProcessor(SoundNodes.BUFFER_SIZE);
        var gain = audioContext.createGain();
        var analyser = audioContext.createAnalyser();
        bufferSource.connect(analyser);
        analyser.connect(gain);
        gain.connect(context.destination);
        script.connect(context.destination);
        _this = _super.call(this, analyser, gain) || this;
        _this.context = context;
        _this.bufferSource = bufferSource;
        _this.script = script;
        _this.gain = gain;
        _this.analyser = analyser;
        return _this;
    }
    SoundNodes.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.bufferSource.disconnect();
        this.script.disconnect();
        this.gain.disconnect();
        this.analyser.disconnect();
        this.bufferSource = null;
        this.script = null;
        this.gain = null;
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
}(Filterable_1.default));
SoundNodes.BUFFER_SIZE = 256;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SoundNodes;

},{"./Filterable":1}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
"use strict";
var uuid = require("uuid/v4");
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
        var alias = uuid();
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

},{"./Sound":3,"./index":17,"uuid/v4":20}],10:[function(require,module,exports){
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
Object.defineProperty(SoundPrototype, "loaded", {
    get: function () {
        console.warn("PIXI.sound.Sound.prototype.loaded is deprecated, use constructor option instead");
        return null;
    },
    set: function (value) {
        console.warn("PIXI.sound.Sound.prototype.loaded is deprecated, use constructor option instead");
    },
});
Object.defineProperty(SoundPrototype, "complete", {
    get: function () {
        console.warn("PIXI.sound.Sound.prototype.complete is deprecated, use constructor option instead");
        return null;
    },
    set: function (value) {
        console.warn("PIXI.sound.Sound.prototype.complete is deprecated, use constructor option instead");
    },
});

},{"./Sound":3,"./SoundLibrary":6}],11:[function(require,module,exports){
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

},{"../index":17,"./Filter":13}],12:[function(require,module,exports){
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

},{"../index":17,"./Filter":13}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"../index":17,"./Filter":13}],15:[function(require,module,exports){
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

},{"../index":17,"./Filter":13}],16:[function(require,module,exports){
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

},{"./DistortionFilter":11,"./EqualizerFilter":12,"./Filter":13,"./ReverbFilter":14,"./StereoFilter":15}],17:[function(require,module,exports){
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

},{"./LoaderMiddleware":2,"./SoundLibrary":6,"./deprecations":10}],18:[function(require,module,exports){
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

},{"./lib/bytesToUuid":18,"./lib/rng":19}]},{},[17])(17)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvRmlsdGVyYWJsZS5qcyIsImxpYi9Mb2FkZXJNaWRkbGV3YXJlLmpzIiwibGliL1NvdW5kLmpzIiwibGliL1NvdW5kQ29udGV4dC5qcyIsImxpYi9Tb3VuZEluc3RhbmNlLmpzIiwibGliL1NvdW5kTGlicmFyeS5qcyIsImxpYi9Tb3VuZE5vZGVzLmpzIiwibGliL1NvdW5kU3ByaXRlLmpzIiwibGliL1NvdW5kVXRpbHMuanMiLCJsaWIvZGVwcmVjYXRpb25zLmpzIiwibGliL2ZpbHRlcnMvRGlzdG9ydGlvbkZpbHRlci5qcyIsImxpYi9maWx0ZXJzL0VxdWFsaXplckZpbHRlci5qcyIsImxpYi9maWx0ZXJzL0ZpbHRlci5qcyIsImxpYi9maWx0ZXJzL1JldmVyYkZpbHRlci5qcyIsImxpYi9maWx0ZXJzL1N0ZXJlb0ZpbHRlci5qcyIsImxpYi9maWx0ZXJzL2luZGV4LmpzIiwibGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL2J5dGVzVG9VdWlkLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvbGliL3JuZy1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V1aWQvdjQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xudmFyIEZpbHRlcmFibGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZpbHRlcmFibGUoaW5wdXQsIG91dHB1dCkge1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBvdXRwdXQ7XG4gICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShGaWx0ZXJhYmxlLnByb3RvdHlwZSwgXCJkZXN0aW5hdGlvblwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lucHV0O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRmlsdGVyYWJsZS5wcm90b3R5cGUsIFwiZmlsdGVyc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlsdGVycykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbHRlcnMuZm9yRWFjaChmdW5jdGlvbiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9maWx0ZXJzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnB1dC5jb25uZWN0KHRoaXMuX291dHB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVycyAmJiBmaWx0ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbHRlcnMgPSBmaWx0ZXJzLnNsaWNlKDApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2lucHV0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICB2YXIgcHJldkZpbHRlcl8xID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmaWx0ZXJzLmZvckVhY2goZnVuY3Rpb24gKGZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldkZpbHRlcl8xID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5faW5wdXQuY29ubmVjdChmaWx0ZXIuZGVzdGluYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldkZpbHRlcl8xLmNvbm5lY3QoZmlsdGVyLmRlc3RpbmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwcmV2RmlsdGVyXzEgPSBmaWx0ZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcHJldkZpbHRlcl8xLmNvbm5lY3QodGhpcy5fb3V0cHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRmlsdGVyYWJsZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIEZpbHRlcmFibGU7XG59KCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRmlsdGVyYWJsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZpbHRlcmFibGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuL2luZGV4XCIpO1xudmFyIEFVRElPX0VYVEVOU0lPTlMgPSBbXCJ3YXZcIiwgXCJtcDNcIiwgXCJvZ2dcIiwgXCJvZ2FcIiwgXCJtNGFcIl07XG5mdW5jdGlvbiBtaWRkbGV3YXJlKHJlc291cmNlLCBuZXh0KSB7XG4gICAgaWYgKHJlc291cmNlLmRhdGEgJiYgQVVESU9fRVhURU5TSU9OUy5pbmRleE9mKHJlc291cmNlLl9nZXRFeHRlbnNpb24oKSkgPiAtMSkge1xuICAgICAgICByZXNvdXJjZS5zb3VuZCA9IGluZGV4XzEuZGVmYXVsdC5hZGQocmVzb3VyY2UubmFtZSwge1xuICAgICAgICAgICAgbG9hZGVkOiBuZXh0LFxuICAgICAgICAgICAgcHJlbG9hZDogdHJ1ZSxcbiAgICAgICAgICAgIHNyY0J1ZmZlcjogcmVzb3VyY2UuZGF0YSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBuZXh0KCk7XG4gICAgfVxufVxuZnVuY3Rpb24gbWlkZGxld2FyZUZhY3RvcnkoKSB7XG4gICAgcmV0dXJuIG1pZGRsZXdhcmU7XG59XG5mdW5jdGlvbiBpbnN0YWxsKCkge1xuICAgIHZhciBSZXNvdXJjZSA9IFBJWEkubG9hZGVycy5SZXNvdXJjZTtcbiAgICBBVURJT19FWFRFTlNJT05TLmZvckVhY2goZnVuY3Rpb24gKGV4dCkge1xuICAgICAgICBSZXNvdXJjZS5zZXRFeHRlbnNpb25YaHJUeXBlKGV4dCwgUmVzb3VyY2UuWEhSX1JFU1BPTlNFX1RZUEUuQlVGRkVSKTtcbiAgICAgICAgUmVzb3VyY2Uuc2V0RXh0ZW5zaW9uTG9hZFR5cGUoZXh0LCBSZXNvdXJjZS5MT0FEX1RZUEUuWEhSKTtcbiAgICB9KTtcbiAgICBQSVhJLmxvYWRlcnMuTG9hZGVyLmFkZFBpeGlNaWRkbGV3YXJlKG1pZGRsZXdhcmVGYWN0b3J5KTtcbiAgICBQSVhJLmxvYWRlci51c2UobWlkZGxld2FyZSk7XG59XG5leHBvcnRzLmluc3RhbGwgPSBpbnN0YWxsO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TG9hZGVyTWlkZGxld2FyZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4vaW5kZXhcIik7XG52YXIgU291bmRJbnN0YW5jZV8xID0gcmVxdWlyZShcIi4vU291bmRJbnN0YW5jZVwiKTtcbnZhciBTb3VuZE5vZGVzXzEgPSByZXF1aXJlKFwiLi9Tb3VuZE5vZGVzXCIpO1xudmFyIFNvdW5kU3ByaXRlXzEgPSByZXF1aXJlKFwiLi9Tb3VuZFNwcml0ZVwiKTtcbnZhciBTb3VuZCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU291bmQoY29udGV4dCwgc291cmNlKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge307XG4gICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBvcHRpb25zLnNyYyA9IHNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgb3B0aW9ucy5zcmNCdWZmZXIgPSBzb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIGF1dG9QbGF5OiBmYWxzZSxcbiAgICAgICAgICAgIHNpbmdsZUluc3RhbmNlOiBmYWxzZSxcbiAgICAgICAgICAgIHNyYzogbnVsbCxcbiAgICAgICAgICAgIHNyY0J1ZmZlcjogbnVsbCxcbiAgICAgICAgICAgIHByZWxvYWQ6IGZhbHNlLFxuICAgICAgICAgICAgdm9sdW1lOiAxLFxuICAgICAgICAgICAgc3BlZWQ6IDEsXG4gICAgICAgICAgICBjb21wbGV0ZTogbnVsbCxcbiAgICAgICAgICAgIGxvYWRlZDogbnVsbCxcbiAgICAgICAgICAgIGxvb3A6IGZhbHNlLFxuICAgICAgICAgICAgdXNlWEhSOiB0cnVlLFxuICAgICAgICB9LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMuX25vZGVzID0gbmV3IFNvdW5kTm9kZXNfMS5kZWZhdWx0KHRoaXMuX2NvbnRleHQpO1xuICAgICAgICB0aGlzLl9zb3VyY2UgPSB0aGlzLl9ub2Rlcy5idWZmZXJTb3VyY2U7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyA9IFtdO1xuICAgICAgICB0aGlzLl9zcHJpdGVzID0ge307XG4gICAgICAgIHZhciBjb21wbGV0ZSA9IG9wdGlvbnMuY29tcGxldGU7XG4gICAgICAgIHRoaXMuX2F1dG9QbGF5T3B0aW9ucyA9IGNvbXBsZXRlID8geyBjb21wbGV0ZTogY29tcGxldGUgfSA6IG51bGw7XG4gICAgICAgIHRoaXMuaXNMb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hdXRvUGxheSA9IG9wdGlvbnMuYXV0b1BsYXk7XG4gICAgICAgIHRoaXMuc2luZ2xlSW5zdGFuY2UgPSBvcHRpb25zLnNpbmdsZUluc3RhbmNlO1xuICAgICAgICB0aGlzLnByZWxvYWQgPSBvcHRpb25zLnByZWxvYWQgfHwgdGhpcy5hdXRvUGxheTtcbiAgICAgICAgdGhpcy5zcmMgPSBvcHRpb25zLnNyYztcbiAgICAgICAgdGhpcy5zcmNCdWZmZXIgPSBvcHRpb25zLnNyY0J1ZmZlcjtcbiAgICAgICAgdGhpcy51c2VYSFIgPSBvcHRpb25zLnVzZVhIUjtcbiAgICAgICAgdGhpcy52b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5sb29wID0gb3B0aW9ucy5sb29wO1xuICAgICAgICB0aGlzLnNwZWVkID0gb3B0aW9ucy5zcGVlZDtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3ByaXRlcykge1xuICAgICAgICAgICAgdGhpcy5hZGRTcHJpdGVzKG9wdGlvbnMuc3ByaXRlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fYmVnaW5QcmVsb2FkKG9wdGlvbnMubG9hZGVkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBTb3VuZC5mcm9tID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTb3VuZChpbmRleF8xLmRlZmF1bHQuY29udGV4dCwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuICAgICAgICB0aGlzLl9zb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbW92ZVNwcml0ZXMoKTtcbiAgICAgICAgdGhpcy5fc3ByaXRlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuc3JjQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcmVtb3ZlSW5zdGFuY2VzKCk7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyA9IG51bGw7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImlzUGxheWFibGVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlzTG9hZGVkICYmICEhdGhpcy5fc291cmNlICYmICEhdGhpcy5fc291cmNlLmJ1ZmZlcjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJjb250ZXh0XCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJ2b2x1bWVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl92b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZvbHVtZSkge1xuICAgICAgICAgICAgdGhpcy5fdm9sdW1lID0gdGhpcy5fbm9kZXMuZ2Fpbi5nYWluLnZhbHVlID0gdm9sdW1lO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImxvb3BcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zb3VyY2UubG9vcDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAobG9vcCkge1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLmxvb3AgPSAhIWxvb3A7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiYnVmZmVyXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc291cmNlLmJ1ZmZlcjtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoYnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UuYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImR1cmF0aW9uXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydCh0aGlzLmlzUGxheWFibGUsIFwiU291bmQgbm90IHlldCBwbGF5YWJsZSwgbm8gZHVyYXRpb25cIik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc291cmNlLmJ1ZmZlci5kdXJhdGlvbjtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJub2Rlc1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcImZpbHRlcnNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ub2Rlcy5maWx0ZXJzO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5maWx0ZXJzID0gZmlsdGVycztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kLnByb3RvdHlwZSwgXCJzcGVlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvdXJjZS5wbGF5YmFja1JhdGUudmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UucGxheWJhY2tSYXRlLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZC5wcm90b3R5cGUsIFwiaW5zdGFuY2VzXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmQucHJvdG90eXBlLCBcInNwcml0ZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zcHJpdGVzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZC5wcm90b3R5cGUuYWRkU3ByaXRlcyA9IGZ1bmN0aW9uIChzb3VyY2UsIGRhdGEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW2FsaWFzXSA9IHRoaXMuYWRkU3ByaXRlcyhhbGlhcywgc291cmNlW2FsaWFzXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydCghdGhpcy5fc3ByaXRlc1tzb3VyY2VdLCBcIkFsaWFzIFwiICsgc291cmNlICsgXCIgaXMgYWxyZWFkeSB0YWtlblwiKTtcbiAgICAgICAgICAgIHZhciBzcHJpdGUgPSBuZXcgU291bmRTcHJpdGVfMS5kZWZhdWx0KHRoaXMsIGRhdGEpO1xuICAgICAgICAgICAgdGhpcy5fc3ByaXRlc1tzb3VyY2VdID0gc3ByaXRlO1xuICAgICAgICAgICAgcmV0dXJuIHNwcml0ZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLnJlbW92ZVNwcml0ZXMgPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgaWYgKCFhbGlhcykge1xuICAgICAgICAgICAgZm9yICh2YXIgbmFtZV8xIGluIHRoaXMuX3Nwcml0ZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZVNwcml0ZXMobmFtZV8xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzcHJpdGUgPSB0aGlzLl9zcHJpdGVzW2FsaWFzXTtcbiAgICAgICAgICAgIGlmIChzcHJpdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHNwcml0ZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3Nwcml0ZXNbYWxpYXNdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoc291cmNlLCBjb21wbGV0ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgb3B0aW9ucztcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBzcHJpdGUgPSBzb3VyY2U7XG4gICAgICAgICAgICBvcHRpb25zID0geyBzcHJpdGU6IHNwcml0ZSwgY29tcGxldGU6IGNvbXBsZXRlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHNvdXJjZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHNvdXJjZTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICBjb21wbGV0ZTogbnVsbCxcbiAgICAgICAgICAgIGxvYWRlZDogbnVsbCxcbiAgICAgICAgICAgIHNwcml0ZTogbnVsbCxcbiAgICAgICAgICAgIHN0YXJ0OiAwLFxuICAgICAgICAgICAgZmFkZUluOiAwLFxuICAgICAgICAgICAgZmFkZU91dDogMCxcbiAgICAgICAgfSwgb3B0aW9ucyB8fCB7fSk7XG4gICAgICAgIGlmIChvcHRpb25zLnNwcml0ZSkge1xuICAgICAgICAgICAgdmFyIGFsaWFzID0gb3B0aW9ucy5zcHJpdGU7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydCghIXRoaXMuX3Nwcml0ZXNbYWxpYXNdLCBcIkFsaWFzIFwiICsgYWxpYXMgKyBcIiBpcyBub3QgYXZhaWxhYmxlXCIpO1xuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IHRoaXMuX3Nwcml0ZXNbYWxpYXNdO1xuICAgICAgICAgICAgb3B0aW9ucy5zdGFydCA9IHNwcml0ZS5zdGFydDtcbiAgICAgICAgICAgIG9wdGlvbnMuZW5kID0gc3ByaXRlLmVuZDtcbiAgICAgICAgICAgIG9wdGlvbnMuc3BlZWQgPSBzcHJpdGUuc3BlZWQ7XG4gICAgICAgICAgICBkZWxldGUgb3B0aW9ucy5zcHJpdGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMub2Zmc2V0KSB7XG4gICAgICAgICAgICBvcHRpb25zLnN0YXJ0ID0gb3B0aW9ucy5vZmZzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmF1dG9QbGF5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBfdGhpcy5fYXV0b1BsYXlPcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICBfdGhpcy5fYmVnaW5QcmVsb2FkKGZ1bmN0aW9uIChlcnIsIHNvdW5kLCBpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxvYWRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGVkKGVyciwgc291bmQsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zaW5nbGVJbnN0YW5jZSkge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSW5zdGFuY2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluc3RhbmNlID0gU291bmRJbnN0YW5jZV8xLmRlZmF1bHQuY3JlYXRlKHRoaXMpO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXMucHVzaChpbnN0YW5jZSk7XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgaW5zdGFuY2Uub25jZShcImVuZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuY29tcGxldGUoX3RoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuX29uQ29tcGxldGUoaW5zdGFuY2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5zdGFuY2Uub25jZShcInN0b3BcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuX29uQ29tcGxldGUoaW5zdGFuY2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaW5zdGFuY2UucGxheShvcHRpb25zLnN0YXJ0LCBvcHRpb25zLmVuZCwgb3B0aW9ucy5zcGVlZCwgb3B0aW9ucy5sb29wLCBvcHRpb25zLmZhZGVJbiwgb3B0aW9ucy5mYWRlT3V0KTtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1BsYXlhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmF1dG9QbGF5ID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9hdXRvUGxheU9wdGlvbnMgPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLnN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLnBhdXNlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICA7XG4gICAgU291bmQucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzW2ldLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCA+IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9iZWdpblByZWxvYWQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHRoaXMuc3JjKSB7XG4gICAgICAgICAgICB0aGlzLnVzZVhIUiA/IHRoaXMuX2xvYWRVcmwoY2FsbGJhY2spIDogdGhpcy5fbG9hZFBhdGgoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc3JjQnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9kZWNvZGUodGhpcy5zcmNCdWZmZXIsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwic291bmQuc3JjIG9yIHNvdW5kLnNyY0J1ZmZlciBtdXN0IGJlIHNldFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwic291bmQuc3JjIG9yIHNvdW5kLnNyY0J1ZmZlciBtdXN0IGJlIHNldFwiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9vbkNvbXBsZXRlID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbnN0YW5jZXMpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2luc3RhbmNlcy5pbmRleE9mKGluc3RhbmNlKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5zdGFuY2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRoaXMuX2luc3RhbmNlcy5sZW5ndGggPiAwO1xuICAgICAgICB9XG4gICAgICAgIGluc3RhbmNlLmRlc3Ryb3koKTtcbiAgICB9O1xuICAgIFNvdW5kLnByb3RvdHlwZS5fcmVtb3ZlSW5zdGFuY2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5faW5zdGFuY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN0YW5jZXNbaV0uZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcy5sZW5ndGggPSAwO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9sb2FkVXJsID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHZhciBzcmMgPSB0aGlzLnNyYztcbiAgICAgICAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHNyYywgdHJ1ZSk7XG4gICAgICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLnNyY0J1ZmZlciA9IHJlcXVlc3QucmVzcG9uc2U7XG4gICAgICAgICAgICBfdGhpcy5fZGVjb2RlKHJlcXVlc3QucmVzcG9uc2UsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgfTtcbiAgICBTb3VuZC5wcm90b3R5cGUuX2xvYWRQYXRoID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbiAgICAgICAgdmFyIHNyYyA9IHRoaXMuc3JjO1xuICAgICAgICBmcy5yZWFkRmlsZShzcmMsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIkZpbGUgbm90IGZvdW5kIFwiICsgX3RoaXMuc3JjKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhcnJheUJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihkYXRhLmxlbmd0aCk7XG4gICAgICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHZpZXdbaV0gPSBkYXRhW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuc3JjQnVmZmVyID0gYXJyYXlCdWZmZXI7XG4gICAgICAgICAgICBfdGhpcy5fZGVjb2RlKGFycmF5QnVmZmVyLCBjYWxsYmFjayk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU291bmQucHJvdG90eXBlLl9kZWNvZGUgPSBmdW5jdGlvbiAoYXJyYXlCdWZmZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuX2NvbnRleHQuZGVjb2RlKGFycmF5QnVmZmVyLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgX3RoaXMuYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMuYXV0b1BsYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBfdGhpcy5wbGF5KF90aGlzLl9hdXRvUGxheU9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX3RoaXMsIGluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBGaWx0ZXJhYmxlXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJhYmxlXCIpO1xudmFyIFNvdW5kQ29udGV4dCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFNvdW5kQ29udGV4dCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTb3VuZENvbnRleHQoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBjdHggPSBuZXcgU291bmRDb250ZXh0LkF1ZGlvQ29udGV4dCgpO1xuICAgICAgICB2YXIgZ2FpbiA9IGN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHZhciBjb21wcmVzc29yID0gY3R4LmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpO1xuICAgICAgICB2YXIgYW5hbHlzZXIgPSBjdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgYW5hbHlzZXIuY29ubmVjdChnYWluKTtcbiAgICAgICAgZ2Fpbi5jb25uZWN0KGNvbXByZXNzb3IpO1xuICAgICAgICBjb21wcmVzc29yLmNvbm5lY3QoY3R4LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBhbmFseXNlciwgZ2FpbikgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX2N0eCA9IGN0eDtcbiAgICAgICAgX3RoaXMuX29mZmxpbmVDdHggPSBuZXcgU291bmRDb250ZXh0Lk9mZmxpbmVBdWRpb0NvbnRleHQoMSwgMiwgY3R4LnNhbXBsZVJhdGUpO1xuICAgICAgICBfdGhpcy5fdW5sb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuZ2FpbiA9IGdhaW47XG4gICAgICAgIF90aGlzLmNvbXByZXNzb3IgPSBjb21wcmVzc29yO1xuICAgICAgICBfdGhpcy5hbmFseXNlciA9IGFuYWx5c2VyO1xuICAgICAgICBfdGhpcy52b2x1bWUgPSAxO1xuICAgICAgICBfdGhpcy5tdXRlZCA9IGZhbHNlO1xuICAgICAgICBfdGhpcy5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93ICYmIGN0eC5zdGF0ZSAhPT0gXCJydW5uaW5nXCIpIHtcbiAgICAgICAgICAgIF90aGlzLl91bmxvY2soKTtcbiAgICAgICAgICAgIF90aGlzLl91bmxvY2sgPSBfdGhpcy5fdW5sb2NrLmJpbmQoX3RoaXMpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBfdGhpcy5fdW5sb2NrLCB0cnVlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIF90aGlzLl91bmxvY2ssIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIF90aGlzLl91bmxvY2ssIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgU291bmRDb250ZXh0LnByb3RvdHlwZS5fdW5sb2NrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fdW5sb2NrZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBsYXlFbXB0eVNvdW5kKCk7XG4gICAgICAgIGlmICh0aGlzLl9jdHguc3RhdGUgPT09IFwicnVubmluZ1wiKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuX3VubG9jaywgdHJ1ZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgdGhpcy5fdW5sb2NrLCB0cnVlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRoaXMuX3VubG9jaywgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLl91bmxvY2tlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kQ29udGV4dC5wcm90b3R5cGUucGxheUVtcHR5U291bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLl9jdHguY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIHNvdXJjZS5idWZmZXIgPSB0aGlzLl9jdHguY3JlYXRlQnVmZmVyKDEsIDEsIDIyMDUwKTtcbiAgICAgICAgc291cmNlLmNvbm5lY3QodGhpcy5fY3R4LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgc291cmNlLnN0YXJ0KDAsIDAsIDApO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dCwgXCJBdWRpb0NvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB3aW4gPSB3aW5kb3c7XG4gICAgICAgICAgICByZXR1cm4gKHdpbi5BdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICB3aW4ud2Via2l0QXVkaW9Db250ZXh0IHx8XG4gICAgICAgICAgICAgICAgbnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQsIFwiT2ZmbGluZUF1ZGlvQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHdpbiA9IHdpbmRvdztcbiAgICAgICAgICAgIHJldHVybiAod2luLk9mZmxpbmVBdWRpb0NvbnRleHQgfHxcbiAgICAgICAgICAgICAgICB3aW4ud2Via2l0T2ZmbGluZUF1ZGlvQ29udGV4dCB8fFxuICAgICAgICAgICAgICAgIG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZENvbnRleHQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuICAgICAgICBpZiAodHlwZW9mIGN0eC5jbG9zZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgY3R4LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hbmFseXNlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuZ2Fpbi5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuY29tcHJlc3Nvci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuZ2FpbiA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbXByZXNzb3IgPSBudWxsO1xuICAgICAgICB0aGlzLl9vZmZsaW5lQ3R4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fY3R4ID0gbnVsbDtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcImF1ZGlvQ29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2N0eDtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kQ29udGV4dC5wcm90b3R5cGUsIFwib2ZmbGluZUNvbnRleHRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vZmZsaW5lQ3R4O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRDb250ZXh0LnByb3RvdHlwZSwgXCJtdXRlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX211dGVkO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChtdXRlZCkge1xuICAgICAgICAgICAgdGhpcy5fbXV0ZWQgPSAhIW11dGVkO1xuICAgICAgICAgICAgdGhpcy5nYWluLmdhaW4udmFsdWUgPSB0aGlzLl9tdXRlZCA/IDAgOiB0aGlzLl92b2x1bWU7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcInZvbHVtZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX211dGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nYWluLmdhaW4udmFsdWUgPSB0aGlzLl92b2x1bWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZENvbnRleHQucHJvdG90eXBlLCBcInBhdXNlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocGF1c2VkKSB7XG4gICAgICAgICAgICBpZiAocGF1c2VkICYmIHRoaXMuX2N0eC5zdGF0ZSA9PT0gXCJydW5uaW5nXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdHguc3VzcGVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIXBhdXNlZCAmJiB0aGlzLl9jdHguc3RhdGUgPT09IFwic3VzcGVuZGVkXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdHgucmVzdW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXVzZWQgPSBwYXVzZWQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFNvdW5kQ29udGV4dC5wcm90b3R5cGUudG9nZ2xlTXV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tdXRlZCA9ICF0aGlzLm11dGVkO1xuICAgICAgICByZXR1cm4gdGhpcy5fbXV0ZWQ7XG4gICAgfTtcbiAgICBTb3VuZENvbnRleHQucHJvdG90eXBlLmRlY29kZSA9IGZ1bmN0aW9uIChhcnJheUJ1ZmZlciwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5fb2ZmbGluZUN0eC5kZWNvZGVBdWRpb0RhdGEoYXJyYXlCdWZmZXIsIGZ1bmN0aW9uIChidWZmZXIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGJ1ZmZlcik7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIlVuYWJsZSB0byBkZWNvZGUgZmlsZVwiKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kQ29udGV4dDtcbn0oRmlsdGVyYWJsZV8xLmRlZmF1bHQpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kQ29udGV4dDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kQ29udGV4dC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIGlkID0gMDtcbnZhciBTb3VuZEluc3RhbmNlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoU291bmRJbnN0YW5jZSwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBTb3VuZEluc3RhbmNlKHBhcmVudCkge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5pZCA9IGlkKys7XG4gICAgICAgIF90aGlzLl9wYXJlbnQgPSBudWxsO1xuICAgICAgICBfdGhpcy5fcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIF90aGlzLl9lbGFwc2VkID0gMDtcbiAgICAgICAgX3RoaXMuX2luaXQocGFyZW50KTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBTb3VuZEluc3RhbmNlLmNyZWF0ZSA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKFNvdW5kSW5zdGFuY2UuX3Bvb2wubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHNvdW5kID0gU291bmRJbnN0YW5jZS5fcG9vbC5wb3AoKTtcbiAgICAgICAgICAgIHNvdW5kLl9pbml0KHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gc291bmQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFNvdW5kSW5zdGFuY2UocGFyZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5faW50ZXJuYWxTdG9wKCk7XG4gICAgICAgICAgICB0aGlzLmVtaXQoXCJzdG9wXCIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIHNwZWVkLCBsb29wLCBmYWRlSW4sIGZhZGVPdXQpIHtcbiAgICAgICAgaWYgKGVuZCkge1xuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQoZW5kID4gc3RhcnQsIFwiRW5kIHRpbWUgaXMgYmVmb3JlIHN0YXJ0IHRpbWVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IHRoaXMuX3BhcmVudC5ub2Rlcy5jbG9uZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgICBpZiAoc3BlZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHNwZWVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NwZWVkID0gdGhpcy5fc291cmNlLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgaWYgKGxvb3AgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fbG9vcCA9IHRoaXMuX3NvdXJjZS5sb29wID0gISFsb29wO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9sb29wICYmIGVuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0xvb3Bpbmcgbm90IHN1cHBvcnQgd2hlbiBzcGVjaWZ5aW5nIGFuIFwiZW5kXCIgdGltZScpO1xuICAgICAgICAgICAgdGhpcy5fbG9vcCA9IHRoaXMuX3NvdXJjZS5sb29wID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZW5kID0gZW5kO1xuICAgICAgICB2YXIgZHVyYXRpb24gPSB0aGlzLl9zb3VyY2UuYnVmZmVyLmR1cmF0aW9uO1xuICAgICAgICBmYWRlSW4gPSB0aGlzLl90b1NlYyhmYWRlSW4pO1xuICAgICAgICBpZiAoZmFkZUluID4gZHVyYXRpb24pIHtcbiAgICAgICAgICAgIGZhZGVJbiA9IGR1cmF0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5fbG9vcCkge1xuICAgICAgICAgICAgZmFkZU91dCA9IHRoaXMuX3RvU2VjKGZhZGVPdXQpO1xuICAgICAgICAgICAgaWYgKGZhZGVPdXQgPiBkdXJhdGlvbiAtIGZhZGVJbikge1xuICAgICAgICAgICAgICAgIGZhZGVPdXQgPSBkdXJhdGlvbiAtIGZhZGVJbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgICAgICB0aGlzLl9mYWRlSW4gPSBmYWRlSW47XG4gICAgICAgIHRoaXMuX2ZhZGVPdXQgPSBmYWRlT3V0O1xuICAgICAgICB0aGlzLl9sYXN0VXBkYXRlID0gdGhpcy5fbm93KCk7XG4gICAgICAgIHRoaXMuX2VsYXBzZWQgPSBzdGFydDtcbiAgICAgICAgdGhpcy5fc291cmNlLm9uZW5kZWQgPSB0aGlzLl9vbkNvbXBsZXRlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuX3NvdXJjZS5zdGFydCgwLCBzdGFydCwgKGVuZCA/IGVuZCAtIHN0YXJ0IDogdW5kZWZpbmVkKSk7XG4gICAgICAgIHRoaXMuZW1pdChcInN0YXJ0XCIpO1xuICAgICAgICB0aGlzLl91cGRhdGUodHJ1ZSk7XG4gICAgICAgIHRoaXMuX2VuYWJsZWQgPSB0cnVlO1xuICAgIH07XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuX3RvU2VjID0gZnVuY3Rpb24gKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgPiAxMCkge1xuICAgICAgICAgICAgdGltZSAvPSAxMDAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aW1lIHx8IDA7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwiX2VuYWJsZWRcIiwge1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChlbmFibGVkKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5fcGFyZW50Lm5vZGVzLnNjcmlwdC5vbmF1ZGlvcHJvY2VzcyA9ICFlbmFibGVkID8gbnVsbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRJbnN0YW5jZS5wcm90b3R5cGUsIFwicHJvZ3Jlc3NcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wcm9ncmVzcztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLCBcInBhdXNlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhdXNlZDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAocGF1c2VkKSB7XG4gICAgICAgICAgICBpZiAocGF1c2VkICE9PSB0aGlzLl9wYXVzZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXVzZWQgPSBwYXVzZWQ7XG4gICAgICAgICAgICAgICAgaWYgKHBhdXNlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcm5hbFN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicGF1c2VkXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicmVzdW1lZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KHRoaXMuX2VsYXBzZWQgJSB0aGlzLl9kdXJhdGlvbiwgdGhpcy5fZW5kLCB0aGlzLl9zcGVlZCwgdGhpcy5fbG9vcCwgdGhpcy5fZmFkZUluLCB0aGlzLl9mYWRlT3V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwicGF1c2VcIiwgcGF1c2VkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRJbnN0YW5jZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5faW50ZXJuYWxTdG9wKCk7XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3NwZWVkID0gMDtcbiAgICAgICAgdGhpcy5fZW5kID0gMDtcbiAgICAgICAgdGhpcy5fcGFyZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWxhcHNlZCA9IDA7XG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gMDtcbiAgICAgICAgdGhpcy5fbG9vcCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9mYWRlSW4gPSAwO1xuICAgICAgICB0aGlzLl9mYWRlT3V0ID0gMDtcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIGlmIChTb3VuZEluc3RhbmNlLl9wb29sLmluZGV4T2YodGhpcykgPCAwKSB7XG4gICAgICAgICAgICBTb3VuZEluc3RhbmNlLl9wb29sLnB1c2godGhpcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJbU291bmRJbnN0YW5jZSBpZD1cIiArIHRoaXMuaWQgKyBcIl1cIjtcbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9ub3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJlbnQuY29udGV4dC5hdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24gKGZvcmNlKSB7XG4gICAgICAgIGlmIChmb3JjZSA9PT0gdm9pZCAwKSB7IGZvcmNlID0gZmFsc2U7IH1cbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdmFyIG5vdyA9IHRoaXMuX25vdygpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gbm93IC0gdGhpcy5fbGFzdFVwZGF0ZTtcbiAgICAgICAgICAgIGlmIChkZWx0YSA+IDAgfHwgZm9yY2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbGFwc2VkICs9IGRlbHRhO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RVcGRhdGUgPSBub3c7XG4gICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gdGhpcy5fZHVyYXRpb247XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gKCh0aGlzLl9lbGFwc2VkICogdGhpcy5fc3BlZWQpICUgZHVyYXRpb24pIC8gZHVyYXRpb247XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZhZGVJbiB8fCB0aGlzLl9mYWRlT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IHByb2dyZXNzICogZHVyYXRpb247XG4gICAgICAgICAgICAgICAgICAgIHZhciBnYWluID0gdGhpcy5fcGFyZW50Lm5vZGVzLmdhaW4uZ2FpbjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1heFZvbHVtZSA9IHRoaXMuX3BhcmVudC52b2x1bWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9mYWRlSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA8PSB0aGlzLl9mYWRlSW4gJiYgcHJvZ3Jlc3MgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2Fpbi52YWx1ZSA9IG1heFZvbHVtZSAqIChwb3NpdGlvbiAvIHRoaXMuX2ZhZGVJbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYWluLnZhbHVlID0gbWF4Vm9sdW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZhZGVJbiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZhZGVPdXQgJiYgcG9zaXRpb24gPj0gZHVyYXRpb24gLSB0aGlzLl9mYWRlT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGVyY2VudCA9IChkdXJhdGlvbiAtIHBvc2l0aW9uKSAvIHRoaXMuX2ZhZGVPdXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBnYWluLnZhbHVlID0gbWF4Vm9sdW1lICogcGVyY2VudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IHByb2dyZXNzO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChcInByb2dyZXNzXCIsIHRoaXMuX3Byb2dyZXNzLCBkdXJhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvdW5kSW5zdGFuY2UucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICB0aGlzLl9wYXJlbnQgPSBwYXJlbnQ7XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5faW50ZXJuYWxTdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLl9lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX3BhcmVudC52b2x1bWUgPSB0aGlzLl9wYXJlbnQudm9sdW1lO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBTb3VuZEluc3RhbmNlLnByb3RvdHlwZS5fb25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5fZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlLm9uZW5kZWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3Byb2dyZXNzID0gMTtcbiAgICAgICAgdGhpcy5lbWl0KFwicHJvZ3Jlc3NcIiwgMSwgdGhpcy5fZHVyYXRpb24pO1xuICAgICAgICB0aGlzLmVtaXQoXCJlbmRcIiwgdGhpcyk7XG4gICAgfTtcbiAgICByZXR1cm4gU291bmRJbnN0YW5jZTtcbn0oUElYSS51dGlscy5FdmVudEVtaXR0ZXIpKTtcblNvdW5kSW5zdGFuY2UuX3Bvb2wgPSBbXTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kSW5zdGFuY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZEluc3RhbmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIEZpbHRlcmFibGVfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlcmFibGVcIik7XG52YXIgZmlsdGVycyA9IHJlcXVpcmUoXCIuL2ZpbHRlcnNcIik7XG52YXIgU291bmRfMSA9IHJlcXVpcmUoXCIuL1NvdW5kXCIpO1xudmFyIFNvdW5kQ29udGV4dF8xID0gcmVxdWlyZShcIi4vU291bmRDb250ZXh0XCIpO1xudmFyIFNvdW5kSW5zdGFuY2VfMSA9IHJlcXVpcmUoXCIuL1NvdW5kSW5zdGFuY2VcIik7XG52YXIgU291bmRTcHJpdGVfMSA9IHJlcXVpcmUoXCIuL1NvdW5kU3ByaXRlXCIpO1xudmFyIFNvdW5kVXRpbHNfMSA9IHJlcXVpcmUoXCIuL1NvdW5kVXRpbHNcIik7XG52YXIgU291bmRMaWJyYXJ5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTb3VuZExpYnJhcnkoKSB7XG4gICAgICAgIGlmICh0aGlzLnN1cHBvcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IG5ldyBTb3VuZENvbnRleHRfMS5kZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc291bmRzID0ge307XG4gICAgICAgIHRoaXMudXRpbHMgPSBTb3VuZFV0aWxzXzEuZGVmYXVsdDtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gZmlsdGVycztcbiAgICAgICAgdGhpcy5Tb3VuZCA9IFNvdW5kXzEuZGVmYXVsdDtcbiAgICAgICAgdGhpcy5Tb3VuZEluc3RhbmNlID0gU291bmRJbnN0YW5jZV8xLmRlZmF1bHQ7XG4gICAgICAgIHRoaXMuU291bmRMaWJyYXJ5ID0gU291bmRMaWJyYXJ5O1xuICAgICAgICB0aGlzLlNvdW5kU3ByaXRlID0gU291bmRTcHJpdGVfMS5kZWZhdWx0O1xuICAgICAgICB0aGlzLkZpbHRlcmFibGUgPSBGaWx0ZXJhYmxlXzEuZGVmYXVsdDtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kTGlicmFyeS5wcm90b3R5cGUsIFwiY29udGV4dFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnkucHJvdG90eXBlLCBcImZpbHRlcnNBbGxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LmZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQuZmlsdGVycyA9IGZpbHRlcnM7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZExpYnJhcnkucHJvdG90eXBlLCBcInN1cHBvcnRlZFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFNvdW5kQ29udGV4dF8xLmRlZmF1bHQuQXVkaW9Db250ZXh0ICE9PSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChzb3VyY2UsIHNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuX2dldE9wdGlvbnMoc291cmNlW2FsaWFzXSwgc291cmNlT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1thbGlhc10gPSB0aGlzLmFkZChhbGlhcywgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmFzc2VydCghdGhpcy5fc291bmRzW3NvdXJjZV0sIFwiU291bmQgd2l0aCBhbGlhcyBcIiArIHNvdXJjZSArIFwiIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VPcHRpb25zIGluc3RhbmNlb2YgU291bmRfMS5kZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc291bmRzW3NvdXJjZV0gPSBzb3VyY2VPcHRpb25zO1xuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2VPcHRpb25zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLl9nZXRPcHRpb25zKHNvdXJjZU9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHZhciBzb3VuZCA9IG5ldyBTb3VuZF8xLmRlZmF1bHQodGhpcy5jb250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zb3VuZHNbc291cmNlXSA9IHNvdW5kO1xuICAgICAgICAgICAgICAgIHJldHVybiBzb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5fZ2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChzb3VyY2UsIG92ZXJyaWRlcykge1xuICAgICAgICB2YXIgb3B0aW9ucztcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyYzogc291cmNlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc291cmNlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHNyY0J1ZmZlcjogc291cmNlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25zID0gc291cmNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKG9wdGlvbnMsIG92ZXJyaWRlcyB8fCB7fSk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICB0aGlzLmV4aXN0cyhhbGlhcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRMaWJyYXJ5LnByb3RvdHlwZSwgXCJ2b2x1bWVBbGxcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LnZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodm9sdW1lKSB7XG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0LnZvbHVtZSA9IHZvbHVtZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5wYXVzZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5wYXVzZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUucmVzdW1lQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0LnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUubXV0ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dC5tdXRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS51bm11dGVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHQubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgYWxpYXMgaW4gdGhpcy5fc291bmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zb3VuZHNbYWxpYXNdLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zb3VuZHNbYWxpYXNdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5zdG9wQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBhbGlhcyBpbiB0aGlzLl9zb3VuZHMpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvdW5kc1thbGlhc10uc3RvcCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5leGlzdHMgPSBmdW5jdGlvbiAoYWxpYXMsIGFzc2VydCkge1xuICAgICAgICBpZiAoYXNzZXJ0ID09PSB2b2lkIDApIHsgYXNzZXJ0ID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIGV4aXN0cyA9ICEhdGhpcy5fc291bmRzW2FsaWFzXTtcbiAgICAgICAgaWYgKGFzc2VydCkge1xuICAgICAgICAgICAgY29uc29sZS5hc3NlcnQoZXhpc3RzLCBcIk5vIHNvdW5kIG1hdGNoaW5nIGFsaWFzICdcIiArIGFsaWFzICsgXCInLlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhpc3RzO1xuICAgIH07XG4gICAgU291bmRMaWJyYXJ5LnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHRoaXMuZXhpc3RzKGFsaWFzLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NvdW5kc1thbGlhc107XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAoYWxpYXMsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykucGxheShvcHRpb25zKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5zdG9wKCk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpLnBhdXNlKCk7XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGFsaWFzKS5yZXN1bWUoKTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUudm9sdW1lID0gZnVuY3Rpb24gKGFsaWFzLCB2b2x1bWUpIHtcbiAgICAgICAgdmFyIHNvdW5kID0gdGhpcy5maW5kKGFsaWFzKTtcbiAgICAgICAgaWYgKHZvbHVtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzb3VuZC52b2x1bWUgPSB2b2x1bWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNvdW5kLnZvbHVtZTtcbiAgICB9O1xuICAgIFNvdW5kTGlicmFyeS5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChhbGlhcykuZHVyYXRpb247XG4gICAgfTtcbiAgICBTb3VuZExpYnJhcnkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsKCk7XG4gICAgICAgIHRoaXMuX3NvdW5kcyA9IG51bGw7XG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kTGlicmFyeTtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTb3VuZExpYnJhcnk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Tb3VuZExpYnJhcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBGaWx0ZXJhYmxlXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJhYmxlXCIpO1xudmFyIFNvdW5kTm9kZXMgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTb3VuZE5vZGVzLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFNvdW5kTm9kZXMoY29udGV4dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgYXVkaW9Db250ZXh0ID0gY29udGV4dC5hdWRpb0NvbnRleHQ7XG4gICAgICAgIHZhciBidWZmZXJTb3VyY2UgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIHZhciBzY3JpcHQgPSBhdWRpb0NvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKFNvdW5kTm9kZXMuQlVGRkVSX1NJWkUpO1xuICAgICAgICB2YXIgZ2FpbiA9IGF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHZhciBhbmFseXNlciA9IGF1ZGlvQ29udGV4dC5jcmVhdGVBbmFseXNlcigpO1xuICAgICAgICBidWZmZXJTb3VyY2UuY29ubmVjdChhbmFseXNlcik7XG4gICAgICAgIGFuYWx5c2VyLmNvbm5lY3QoZ2Fpbik7XG4gICAgICAgIGdhaW4uY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgc2NyaXB0LmNvbm5lY3QoY29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcywgYW5hbHlzZXIsIGdhaW4pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICBfdGhpcy5idWZmZXJTb3VyY2UgPSBidWZmZXJTb3VyY2U7XG4gICAgICAgIF90aGlzLnNjcmlwdCA9IHNjcmlwdDtcbiAgICAgICAgX3RoaXMuZ2FpbiA9IGdhaW47XG4gICAgICAgIF90aGlzLmFuYWx5c2VyID0gYW5hbHlzZXI7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3N1cGVyLnByb3RvdHlwZS5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5zY3JpcHQuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmdhaW4uZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmFuYWx5c2VyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5idWZmZXJTb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLnNjcmlwdCA9IG51bGw7XG4gICAgICAgIHRoaXMuZ2FpbiA9IG51bGw7XG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIH07XG4gICAgU291bmROb2Rlcy5wcm90b3R5cGUuY2xvbmVCdWZmZXJTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcmlnID0gdGhpcy5idWZmZXJTb3VyY2U7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIGNsb25lLmJ1ZmZlciA9IG9yaWcuYnVmZmVyO1xuICAgICAgICBjbG9uZS5wbGF5YmFja1JhdGUudmFsdWUgPSBvcmlnLnBsYXliYWNrUmF0ZS52YWx1ZTtcbiAgICAgICAgY2xvbmUubG9vcCA9IG9yaWcubG9vcDtcbiAgICAgICAgY2xvbmUuY29ubmVjdCh0aGlzLmRlc3RpbmF0aW9uKTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kTm9kZXM7XG59KEZpbHRlcmFibGVfMS5kZWZhdWx0KSk7XG5Tb3VuZE5vZGVzLkJVRkZFUl9TSVpFID0gMjU2O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmROb2Rlcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kTm9kZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU291bmRTcHJpdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvdW5kU3ByaXRlKHBhcmVudCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IHRoaXMuZW5kIC0gdGhpcy5zdGFydDtcbiAgICAgICAgY29uc29sZS5hc3NlcnQodGhpcy5kdXJhdGlvbiA+IDAsIFwiRW5kIHRpbWUgbXVzdCBiZSBhZnRlciBzdGFydCB0aW1lXCIpO1xuICAgIH1cbiAgICBTb3VuZFNwcml0ZS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uIChjb21wbGV0ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQucGxheShPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcbiAgICAgICAgICAgIHNwZWVkOiB0aGlzLnNwZWVkIHx8IHRoaXMucGFyZW50LnNwZWVkLFxuICAgICAgICAgICAgZW5kOiB0aGlzLmVuZCxcbiAgICAgICAgICAgIHN0YXJ0OiB0aGlzLnN0YXJ0LFxuICAgICAgICB9KSk7XG4gICAgfTtcbiAgICBTb3VuZFNwcml0ZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kU3ByaXRlO1xufSgpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNvdW5kU3ByaXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U291bmRTcHJpdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgdXVpZCA9IHJlcXVpcmUoXCJ1dWlkL3Y0XCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi9pbmRleFwiKTtcbnZhciBTb3VuZF8xID0gcmVxdWlyZShcIi4vU291bmRcIik7XG52YXIgU291bmRVdGlscyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU291bmRVdGlscygpIHtcbiAgICB9XG4gICAgU291bmRVdGlscy5zaW5lVG9uZSA9IGZ1bmN0aW9uIChoZXJ0eiwgc2Vjb25kcykge1xuICAgICAgICBpZiAoaGVydHogPT09IHZvaWQgMCkgeyBoZXJ0eiA9IDIwMDsgfVxuICAgICAgICBpZiAoc2Vjb25kcyA9PT0gdm9pZCAwKSB7IHNlY29uZHMgPSAxOyB9XG4gICAgICAgIHZhciBzb3VuZENvbnRleHQgPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dDtcbiAgICAgICAgdmFyIHNvdW5kSW5zdGFuY2UgPSBuZXcgU291bmRfMS5kZWZhdWx0KHNvdW5kQ29udGV4dCwge1xuICAgICAgICAgICAgc2luZ2xlSW5zdGFuY2U6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgbkNoYW5uZWxzID0gMTtcbiAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSA0ODAwMDtcbiAgICAgICAgdmFyIGFtcGxpdHVkZSA9IDI7XG4gICAgICAgIHZhciBidWZmZXIgPSBzb3VuZENvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlcihuQ2hhbm5lbHMsIHNlY29uZHMgKiBzYW1wbGVSYXRlLCBzYW1wbGVSYXRlKTtcbiAgICAgICAgdmFyIGZBcnJheSA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0aW1lID0gaSAvIGJ1ZmZlci5zYW1wbGVSYXRlO1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gaGVydHogKiB0aW1lICogTWF0aC5QSTtcbiAgICAgICAgICAgIGZBcnJheVtpXSA9IE1hdGguc2luKGFuZ2xlKSAqIGFtcGxpdHVkZTtcbiAgICAgICAgfVxuICAgICAgICBzb3VuZEluc3RhbmNlLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgc291bmRJbnN0YW5jZS5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBzb3VuZEluc3RhbmNlO1xuICAgIH07XG4gICAgU291bmRVdGlscy5yZW5kZXIgPSBmdW5jdGlvbiAoc291bmQsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgd2lkdGg6IDUxMixcbiAgICAgICAgICAgIGhlaWdodDogMTI4LFxuICAgICAgICAgICAgZmlsbDogXCJibGFja1wiLFxuICAgICAgICB9LCBvcHRpb25zIHx8IHt9KTtcbiAgICAgICAgY29uc29sZS5hc3NlcnQoISFzb3VuZC5idWZmZXIsIFwiTm8gYnVmZmVyIGZvdW5kLCBsb2FkIGZpcnN0XCIpO1xuICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgY2FudmFzLndpZHRoID0gb3B0aW9ucy53aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xuICAgICAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gb3B0aW9ucy5maWxsO1xuICAgICAgICB2YXIgZGF0YSA9IHNvdW5kLmJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgICAgdmFyIHN0ZXAgPSBNYXRoLmNlaWwoZGF0YS5sZW5ndGggLyBvcHRpb25zLndpZHRoKTtcbiAgICAgICAgdmFyIGFtcCA9IG9wdGlvbnMuaGVpZ2h0IC8gMjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLndpZHRoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtaW4gPSAxLjA7XG4gICAgICAgICAgICB2YXIgbWF4ID0gLTEuMDtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3RlcDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdHVtID0gZGF0YVsoaSAqIHN0ZXApICsgal07XG4gICAgICAgICAgICAgICAgaWYgKGRhdHVtIDwgbWluKSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IGRhdHVtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZGF0dW0gPiBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gZGF0dW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5maWxsUmVjdChpLCAoMSArIG1pbikgKiBhbXAsIDEsIE1hdGgubWF4KDEsIChtYXggLSBtaW4pICogYW1wKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBJWEkuQmFzZVRleHR1cmUuZnJvbUNhbnZhcyhjYW52YXMpO1xuICAgIH07XG4gICAgU291bmRVdGlscy5wbGF5T25jZSA9IGZ1bmN0aW9uIChzcmMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhbGlhcyA9IHV1aWQoKTtcbiAgICAgICAgaW5kZXhfMS5kZWZhdWx0LmFkZChhbGlhcywge1xuICAgICAgICAgICAgc3JjOiBzcmMsXG4gICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgICAgYXV0b1BsYXk6IHRydWUsXG4gICAgICAgICAgICBsb2FkZWQ6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhfMS5kZWZhdWx0LnJlbW92ZShhbGlhcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGluZGV4XzEuZGVmYXVsdC5yZW1vdmUoYWxpYXMpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFsaWFzO1xuICAgIH07XG4gICAgcmV0dXJuIFNvdW5kVXRpbHM7XG59KCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU291bmRVdGlscztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNvdW5kVXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgU291bmRfMSA9IHJlcXVpcmUoXCIuL1NvdW5kXCIpO1xudmFyIFNvdW5kTGlicmFyeV8xID0gcmVxdWlyZShcIi4vU291bmRMaWJyYXJ5XCIpO1xudmFyIFNvdW5kTGlicmFyeVByb3RvdHlwZSA9IFNvdW5kTGlicmFyeV8xLmRlZmF1bHQucHJvdG90eXBlO1xudmFyIFNvdW5kUHJvdG90eXBlID0gU291bmRfMS5kZWZhdWx0LnByb3RvdHlwZTtcblNvdW5kTGlicmFyeVByb3RvdHlwZS5zb3VuZCA9IGZ1bmN0aW9uIHNvdW5kKGFsaWFzKSB7XG4gICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5zb3VuZCBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC5maW5kXCIpO1xuICAgIHJldHVybiB0aGlzLmZpbmQoYWxpYXMpO1xufTtcblNvdW5kTGlicmFyeVByb3RvdHlwZS5wYW5uaW5nID0gZnVuY3Rpb24gcGFubmluZyhhbGlhcywgcGFubmluZykge1xuICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQucGFubmluZyBpcyBkZXByZWNhdGVkLCB1c2UgUElYSS5zb3VuZC5maWx0ZXJzLlN0ZXJlb1BhblwiKTtcbiAgICByZXR1cm4gMDtcbn07XG5Tb3VuZExpYnJhcnlQcm90b3R5cGUuYWRkTWFwID0gZnVuY3Rpb24gYWRkTWFwKG1hcCwgZ2xvYmFsT3B0aW9ucykge1xuICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQuYWRkTWFwIGlzIGRlcHJlY2F0ZWQsIHVzZSBQSVhJLnNvdW5kLmFkZFwiKTtcbiAgICByZXR1cm4gdGhpcy5hZGQobWFwLCBnbG9iYWxPcHRpb25zKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRMaWJyYXJ5UHJvdG90eXBlLCBcIlNvdW5kVXRpbHNcIiwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLlNvdW5kVXRpbHMgaXMgZGVwcmVjYXRlZCwgdXNlIFBJWEkuc291bmQudXRpbHNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLnV0aWxzO1xuICAgIH0sXG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VuZFByb3RvdHlwZSwgXCJibG9ja1wiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQuU291bmQucHJvdG90eXBlLmJsb2NrIGlzIGRlcHJlY2F0ZWQsIHVzZSBzaW5nbGVJbnN0YW5jZSBpbnN0ZWFkXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5zaW5nbGVJbnN0YW5jZTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQuU291bmQucHJvdG90eXBlLmJsb2NrIGlzIGRlcHJlY2F0ZWQsIHVzZSBzaW5nbGVJbnN0YW5jZSBpbnN0ZWFkXCIpO1xuICAgICAgICB0aGlzLnNpbmdsZUluc3RhbmNlID0gdmFsdWU7XG4gICAgfSxcbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KFNvdW5kUHJvdG90eXBlLCBcImxvYWRlZFwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlBJWEkuc291bmQuU291bmQucHJvdG90eXBlLmxvYWRlZCBpcyBkZXByZWNhdGVkLCB1c2UgY29uc3RydWN0b3Igb3B0aW9uIGluc3RlYWRcIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5Tb3VuZC5wcm90b3R5cGUubG9hZGVkIGlzIGRlcHJlY2F0ZWQsIHVzZSBjb25zdHJ1Y3RvciBvcHRpb24gaW5zdGVhZFwiKTtcbiAgICB9LFxufSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoU291bmRQcm90b3R5cGUsIFwiY29tcGxldGVcIiwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJQSVhJLnNvdW5kLlNvdW5kLnByb3RvdHlwZS5jb21wbGV0ZSBpcyBkZXByZWNhdGVkLCB1c2UgY29uc3RydWN0b3Igb3B0aW9uIGluc3RlYWRcIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiUElYSS5zb3VuZC5Tb3VuZC5wcm90b3R5cGUuY29tcGxldGUgaXMgZGVwcmVjYXRlZCwgdXNlIGNvbnN0cnVjdG9yIG9wdGlvbiBpbnN0ZWFkXCIpO1xuICAgIH0sXG59KTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlcHJlY2F0aW9ucy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIEZpbHRlcl8xID0gcmVxdWlyZShcIi4vRmlsdGVyXCIpO1xudmFyIGluZGV4XzEgPSByZXF1aXJlKFwiLi4vaW5kZXhcIik7XG52YXIgRGlzdG9ydGlvbkZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKERpc3RvcnRpb25GaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRGlzdG9ydGlvbkZpbHRlcihhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gdm9pZCAwKSB7IGFtb3VudCA9IDA7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRpc3RvcnRpb24gPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dC5hdWRpb0NvbnRleHQuY3JlYXRlV2F2ZVNoYXBlcigpO1xuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGRpc3RvcnRpb24pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9kaXN0b3J0aW9uID0gZGlzdG9ydGlvbjtcbiAgICAgICAgX3RoaXMuYW1vdW50ID0gYW1vdW50O1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEaXN0b3J0aW9uRmlsdGVyLnByb3RvdHlwZSwgXCJhbW91bnRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hbW91bnQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSAqPSAxMDAwO1xuICAgICAgICAgICAgdGhpcy5fYW1vdW50ID0gdmFsdWU7XG4gICAgICAgICAgICB2YXIgc2FtcGxlcyA9IDQ0MTAwO1xuICAgICAgICAgICAgdmFyIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheShzYW1wbGVzKTtcbiAgICAgICAgICAgIHZhciBkZWcgPSBNYXRoLlBJIC8gMTgwO1xuICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgdmFyIHg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IHNhbXBsZXM7ICsraSkge1xuICAgICAgICAgICAgICAgIHggPSBpICogMiAvIHNhbXBsZXMgLSAxO1xuICAgICAgICAgICAgICAgIGN1cnZlW2ldID0gKDMgKyB2YWx1ZSkgKiB4ICogMjAgKiBkZWcgLyAoTWF0aC5QSSArIHZhbHVlICogTWF0aC5hYnMoeCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGlzdG9ydGlvbi5jdXJ2ZSA9IGN1cnZlO1xuICAgICAgICAgICAgdGhpcy5fZGlzdG9ydGlvbi5vdmVyc2FtcGxlID0gJzR4JztcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRGlzdG9ydGlvbkZpbHRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fZGlzdG9ydGlvbiA9IG51bGw7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIERpc3RvcnRpb25GaWx0ZXI7XG59KEZpbHRlcl8xLmRlZmF1bHQpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IERpc3RvcnRpb25GaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1EaXN0b3J0aW9uRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBFcXVhbGl6ZXJGaWx0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhFcXVhbGl6ZXJGaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRXF1YWxpemVyRmlsdGVyKGYzMiwgZjY0LCBmMTI1LCBmMjUwLCBmNTAwLCBmMWssIGYyaywgZjRrLCBmOGssIGYxNmspIHtcbiAgICAgICAgaWYgKGYzMiA9PT0gdm9pZCAwKSB7IGYzMiA9IDA7IH1cbiAgICAgICAgaWYgKGY2NCA9PT0gdm9pZCAwKSB7IGY2NCA9IDA7IH1cbiAgICAgICAgaWYgKGYxMjUgPT09IHZvaWQgMCkgeyBmMTI1ID0gMDsgfVxuICAgICAgICBpZiAoZjI1MCA9PT0gdm9pZCAwKSB7IGYyNTAgPSAwOyB9XG4gICAgICAgIGlmIChmNTAwID09PSB2b2lkIDApIHsgZjUwMCA9IDA7IH1cbiAgICAgICAgaWYgKGYxayA9PT0gdm9pZCAwKSB7IGYxayA9IDA7IH1cbiAgICAgICAgaWYgKGYyayA9PT0gdm9pZCAwKSB7IGYyayA9IDA7IH1cbiAgICAgICAgaWYgKGY0ayA9PT0gdm9pZCAwKSB7IGY0ayA9IDA7IH1cbiAgICAgICAgaWYgKGY4ayA9PT0gdm9pZCAwKSB7IGY4ayA9IDA7IH1cbiAgICAgICAgaWYgKGYxNmsgPT09IHZvaWQgMCkgeyBmMTZrID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZXF1YWxpemVyQmFuZHMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYzMixcbiAgICAgICAgICAgICAgICB0eXBlOiAnbG93c2hlbGYnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYzMlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjY0LFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmNjRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxMjUsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYxMjVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYyNTAsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYyNTBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkY1MDAsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGY1MDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkYxSyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjFrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GMkssXG4gICAgICAgICAgICAgICAgdHlwZTogJ3BlYWtpbmcnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYya1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmOiBFcXVhbGl6ZXJGaWx0ZXIuRjRLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdwZWFraW5nJyxcbiAgICAgICAgICAgICAgICBnYWluOiBmNGtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZjogRXF1YWxpemVyRmlsdGVyLkY4SyxcbiAgICAgICAgICAgICAgICB0eXBlOiAncGVha2luZycsXG4gICAgICAgICAgICAgICAgZ2FpbjogZjhrXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGY6IEVxdWFsaXplckZpbHRlci5GMTZLLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdoaWdoc2hlbGYnLFxuICAgICAgICAgICAgICAgIGdhaW46IGYxNmtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICAgICAgdmFyIGJhbmRzID0gZXF1YWxpemVyQmFuZHMubWFwKGZ1bmN0aW9uIChiYW5kKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gaW5kZXhfMS5kZWZhdWx0LmNvbnRleHQuYXVkaW9Db250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICAgICAgICAgICAgZmlsdGVyLnR5cGUgPSBiYW5kLnR5cGU7XG4gICAgICAgICAgICBmaWx0ZXIuZ2Fpbi52YWx1ZSA9IGJhbmQuZ2FpbjtcbiAgICAgICAgICAgIGZpbHRlci5RLnZhbHVlID0gMTtcbiAgICAgICAgICAgIGZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSBiYW5kLmY7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgICAgICB9KTtcbiAgICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBiYW5kc1swXSwgYmFuZHNbYmFuZHMubGVuZ3RoIC0gMV0pIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmJhbmRzID0gYmFuZHM7XG4gICAgICAgIF90aGlzLmJhbmRzTWFwID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX3RoaXMuYmFuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gX3RoaXMuYmFuZHNbaV07XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5iYW5kc1tpIC0gMV0uY29ubmVjdChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmJhbmRzTWFwW25vZGUuZnJlcXVlbmN5LnZhbHVlXSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLnNldEdhaW4gPSBmdW5jdGlvbiAoZnJlcXVlbmN5LCBnYWluKSB7XG4gICAgICAgIGlmIChnYWluID09PSB2b2lkIDApIHsgZ2FpbiA9IDA7IH1cbiAgICAgICAgaWYgKCF0aGlzLmJhbmRzTWFwW2ZyZXF1ZW5jeV0pIHtcbiAgICAgICAgICAgIHRocm93ICdObyBiYW5kIGZvdW5kIGZvciBmcmVxdWVuY3kgJyArIGZyZXF1ZW5jeTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhbmRzTWFwW2ZyZXF1ZW5jeV0uZ2Fpbi52YWx1ZSA9IGdhaW47XG4gICAgfTtcbiAgICBFcXVhbGl6ZXJGaWx0ZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJhbmRzLmZvckVhY2goZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIGJhbmQuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXF1YWxpemVyRmlsdGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJhbmRzLmZvckVhY2goZnVuY3Rpb24gKGJhbmQpIHtcbiAgICAgICAgICAgIGJhbmQuZGlzY29ubmVjdCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5iYW5kcyA9IG51bGw7XG4gICAgICAgIHRoaXMuYmFuZHNNYXAgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIEVxdWFsaXplckZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuRXF1YWxpemVyRmlsdGVyLkYzMiA9IDMyO1xuRXF1YWxpemVyRmlsdGVyLkY2NCA9IDY0O1xuRXF1YWxpemVyRmlsdGVyLkYxMjUgPSAxMjU7XG5FcXVhbGl6ZXJGaWx0ZXIuRjI1MCA9IDI1MDtcbkVxdWFsaXplckZpbHRlci5GNTAwID0gNTAwO1xuRXF1YWxpemVyRmlsdGVyLkYxSyA9IDEwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjJLID0gMjAwMDtcbkVxdWFsaXplckZpbHRlci5GNEsgPSA0MDAwO1xuRXF1YWxpemVyRmlsdGVyLkY4SyA9IDgwMDA7XG5FcXVhbGl6ZXJGaWx0ZXIuRjE2SyA9IDE2MDAwO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRXF1YWxpemVyRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RXF1YWxpemVyRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIEZpbHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsdGVyKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uO1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZSB8fCBkZXN0aW5hdGlvbjtcbiAgICB9XG4gICAgRmlsdGVyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uKSB7XG4gICAgICAgIHRoaXMuc291cmNlLmNvbm5lY3QoZGVzdGluYXRpb24pO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNvdXJjZS5kaXNjb25uZWN0KCk7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5zb3VyY2UgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIEZpbHRlcjtcbn0oKSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBGaWx0ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1GaWx0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xufTtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4uL2luZGV4XCIpO1xudmFyIFJldmVyYkZpbHRlciA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJldmVyYkZpbHRlciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBSZXZlcmJGaWx0ZXIoc2Vjb25kcywgZGVjYXksIHJldmVyc2UpIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPT09IHZvaWQgMCkgeyBzZWNvbmRzID0gMzsgfVxuICAgICAgICBpZiAoZGVjYXkgPT09IHZvaWQgMCkgeyBkZWNheSA9IDI7IH1cbiAgICAgICAgaWYgKHJldmVyc2UgPT09IHZvaWQgMCkgeyByZXZlcnNlID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGNvbnZvbHZlciA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dC5jcmVhdGVDb252b2x2ZXIoKTtcbiAgICAgICAgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCBjb252b2x2ZXIpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLl9jb252b2x2ZXIgPSBjb252b2x2ZXI7XG4gICAgICAgIF90aGlzLl9zZWNvbmRzID0gX3RoaXMuX2NsYW1wKHNlY29uZHMsIDEsIDUwKTtcbiAgICAgICAgX3RoaXMuX2RlY2F5ID0gX3RoaXMuX2NsYW1wKGRlY2F5LCAwLCAxMDApO1xuICAgICAgICBfdGhpcy5fcmV2ZXJzZSA9IHJldmVyc2U7XG4gICAgICAgIF90aGlzLl9yZWJ1aWxkKCk7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgUmV2ZXJiRmlsdGVyLnByb3RvdHlwZS5fY2xhbXAgPSBmdW5jdGlvbiAodmFsdWUsIG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgdmFsdWUpKTtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZXZlcmJGaWx0ZXIucHJvdG90eXBlLCBcInNlY29uZHNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zZWNvbmRzO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChzZWNvbmRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWNvbmRzID0gdGhpcy5fY2xhbXAoc2Vjb25kcywgMSwgNTApO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmV2ZXJiRmlsdGVyLnByb3RvdHlwZSwgXCJkZWNheVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY2F5O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChkZWNheSkge1xuICAgICAgICAgICAgdGhpcy5fZGVjYXkgPSB0aGlzLl9jbGFtcChkZWNheSwgMCwgMTAwKTtcbiAgICAgICAgICAgIHRoaXMuX3JlYnVpbGQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJldmVyYkZpbHRlci5wcm90b3R5cGUsIFwicmV2ZXJzZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JldmVyc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHJldmVyc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3JldmVyc2UgPSByZXZlcnNlO1xuICAgICAgICAgICAgdGhpcy5fcmVidWlsZCgpO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLl9yZWJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29udGV4dCA9IGluZGV4XzEuZGVmYXVsdC5jb250ZXh0LmF1ZGlvQ29udGV4dDtcbiAgICAgICAgdmFyIHJhdGUgPSBjb250ZXh0LnNhbXBsZVJhdGU7XG4gICAgICAgIHZhciBsZW5ndGggPSByYXRlICogdGhpcy5fc2Vjb25kcztcbiAgICAgICAgdmFyIGltcHVsc2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlcigyLCBsZW5ndGgsIHJhdGUpO1xuICAgICAgICB2YXIgaW1wdWxzZUwgPSBpbXB1bHNlLmdldENoYW5uZWxEYXRhKDApO1xuICAgICAgICB2YXIgaW1wdWxzZVIgPSBpbXB1bHNlLmdldENoYW5uZWxEYXRhKDEpO1xuICAgICAgICB2YXIgbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbiA9IHRoaXMuX3JldmVyc2UgPyBsZW5ndGggLSBpIDogaTtcbiAgICAgICAgICAgIGltcHVsc2VMW2ldID0gKE1hdGgucmFuZG9tKCkgKiAyIC0gMSkgKiBNYXRoLnBvdygxIC0gbiAvIGxlbmd0aCwgdGhpcy5fZGVjYXkpO1xuICAgICAgICAgICAgaW1wdWxzZVJbaV0gPSAoTWF0aC5yYW5kb20oKSAqIDIgLSAxKSAqIE1hdGgucG93KDEgLSBuIC8gbGVuZ3RoLCB0aGlzLl9kZWNheSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udm9sdmVyLmJ1ZmZlciA9IGltcHVsc2U7XG4gICAgfTtcbiAgICBSZXZlcmJGaWx0ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX2NvbnZvbHZlciA9IG51bGw7XG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZGVzdHJveS5jYWxsKHRoaXMpO1xuICAgIH07XG4gICAgcmV0dXJuIFJldmVyYkZpbHRlcjtcbn0oRmlsdGVyXzEuZGVmYXVsdCkpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gUmV2ZXJiRmlsdGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmV2ZXJiRmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9GaWx0ZXJcIik7XG52YXIgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKTtcbnZhciBTdGVyZW9GaWx0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhTdGVyZW9GaWx0ZXIsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU3RlcmVvRmlsdGVyKHBhbikge1xuICAgICAgICBpZiAocGFuID09PSB2b2lkIDApIHsgcGFuID0gMDsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgc3RlcmVvO1xuICAgICAgICB2YXIgcGFubmVyO1xuICAgICAgICB2YXIgZGVzdGluYXRpb247XG4gICAgICAgIHZhciBhdWRpb0NvbnRleHQgPSBpbmRleF8xLmRlZmF1bHQuY29udGV4dC5hdWRpb0NvbnRleHQ7XG4gICAgICAgIGlmIChhdWRpb0NvbnRleHQuY3JlYXRlU3RlcmVvUGFubmVyKSB7XG4gICAgICAgICAgICBzdGVyZW8gPSBhdWRpb0NvbnRleHQuY3JlYXRlU3RlcmVvUGFubmVyKCk7XG4gICAgICAgICAgICBkZXN0aW5hdGlvbiA9IHN0ZXJlbztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhbm5lciA9IGF1ZGlvQ29udGV4dC5jcmVhdGVQYW5uZXIoKTtcbiAgICAgICAgICAgIHBhbm5lci5wYW5uaW5nTW9kZWwgPSAnZXF1YWxwb3dlcic7XG4gICAgICAgICAgICBkZXN0aW5hdGlvbiA9IHBhbm5lcjtcbiAgICAgICAgfVxuICAgICAgICBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMsIGRlc3RpbmF0aW9uKSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5fc3RlcmVvID0gc3RlcmVvO1xuICAgICAgICBfdGhpcy5fcGFubmVyID0gcGFubmVyO1xuICAgICAgICBfdGhpcy5wYW4gPSBwYW47XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0ZXJlb0ZpbHRlci5wcm90b3R5cGUsIFwicGFuXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFuO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fcGFuID0gdmFsdWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fc3RlcmVvKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RlcmVvLnBhbi52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFubmVyLnNldFBvc2l0aW9uKHZhbHVlLCAwLCAxIC0gTWF0aC5hYnModmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgU3RlcmVvRmlsdGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBfc3VwZXIucHJvdG90eXBlLmRlc3Ryb3kuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5fc3RlcmVvID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcGFubmVyID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBTdGVyZW9GaWx0ZXI7XG59KEZpbHRlcl8xLmRlZmF1bHQpKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFN0ZXJlb0ZpbHRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN0ZXJlb0ZpbHRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0ZpbHRlclwiKTtcbmV4cG9ydHMuRmlsdGVyID0gRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBFcXVhbGl6ZXJGaWx0ZXJfMSA9IHJlcXVpcmUoXCIuL0VxdWFsaXplckZpbHRlclwiKTtcbmV4cG9ydHMuRXF1YWxpemVyRmlsdGVyID0gRXF1YWxpemVyRmlsdGVyXzEuZGVmYXVsdDtcbnZhciBEaXN0b3J0aW9uRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9EaXN0b3J0aW9uRmlsdGVyXCIpO1xuZXhwb3J0cy5EaXN0b3J0aW9uRmlsdGVyID0gRGlzdG9ydGlvbkZpbHRlcl8xLmRlZmF1bHQ7XG52YXIgU3RlcmVvRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9TdGVyZW9GaWx0ZXJcIik7XG5leHBvcnRzLlN0ZXJlb0ZpbHRlciA9IFN0ZXJlb0ZpbHRlcl8xLmRlZmF1bHQ7XG52YXIgUmV2ZXJiRmlsdGVyXzEgPSByZXF1aXJlKFwiLi9SZXZlcmJGaWx0ZXJcIik7XG5leHBvcnRzLlJldmVyYkZpbHRlciA9IFJldmVyYkZpbHRlcl8xLmRlZmF1bHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBMb2FkZXJNaWRkbGV3YXJlXzEgPSByZXF1aXJlKFwiLi9Mb2FkZXJNaWRkbGV3YXJlXCIpO1xudmFyIFNvdW5kTGlicmFyeV8xID0gcmVxdWlyZShcIi4vU291bmRMaWJyYXJ5XCIpO1xucmVxdWlyZShcIi4vZGVwcmVjYXRpb25zXCIpO1xudmFyIHNvdW5kID0gbmV3IFNvdW5kTGlicmFyeV8xLmRlZmF1bHQoKTtcbmlmIChnbG9iYWwuUElYSSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGl4aS5qcyBpcyByZXF1aXJlZFwiKTtcbn1cbmlmIChQSVhJLmxvYWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIExvYWRlck1pZGRsZXdhcmVfMS5pbnN0YWxsKCk7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUElYSSwgXCJzb3VuZFwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBzb3VuZDsgfSxcbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gc291bmQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIvKipcbiAqIENvbnZlcnQgYXJyYXkgb2YgMTYgYnl0ZSB2YWx1ZXMgdG8gVVVJRCBzdHJpbmcgZm9ybWF0IG9mIHRoZSBmb3JtOlxuICogWFhYWFhYWFgtWFhYWC1YWFhYLVhYWFgtWFhYWC1YWFhYWFhYWFhYWFhcbiAqL1xudmFyIGJ5dGVUb0hleCA9IFtdO1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7ICsraSkge1xuICBieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xufVxuXG5mdW5jdGlvbiBieXRlc1RvVXVpZChidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwO1xuICB2YXIgYnRoID0gYnl0ZVRvSGV4O1xuICByZXR1cm4gIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBieXRlc1RvVXVpZDtcbiIsIi8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBJbiB0aGVcbi8vIGJyb3dzZXIgdGhpcyBpcyBhIGxpdHRsZSBjb21wbGljYXRlZCBkdWUgdG8gdW5rbm93biBxdWFsaXR5IG9mIE1hdGgucmFuZG9tKClcbi8vIGFuZCBpbmNvbnNpc3RlbnQgc3VwcG9ydCBmb3IgdGhlIGBjcnlwdG9gIEFQSS4gIFdlIGRvIHRoZSBiZXN0IHdlIGNhbiB2aWFcbi8vIGZlYXR1cmUtZGV0ZWN0aW9uXG52YXIgcm5nO1xuXG52YXIgY3J5cHRvID0gZ2xvYmFsLmNyeXB0byB8fCBnbG9iYWwubXNDcnlwdG87IC8vIGZvciBJRSAxMVxuaWYgKGNyeXB0byAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gIC8vIFdIQVRXRyBjcnlwdG8gUk5HIC0gaHR0cDovL3dpa2kud2hhdHdnLm9yZy93aWtpL0NyeXB0b1xuICB2YXIgcm5kczggPSBuZXcgVWludDhBcnJheSgxNik7XG4gIHJuZyA9IGZ1bmN0aW9uIHdoYXR3Z1JORygpIHtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKHJuZHM4KTtcbiAgICByZXR1cm4gcm5kczg7XG4gIH07XG59XG5cbmlmICghcm5nKSB7XG4gIC8vIE1hdGgucmFuZG9tKCktYmFzZWQgKFJORylcbiAgLy9cbiAgLy8gSWYgYWxsIGVsc2UgZmFpbHMsIHVzZSBNYXRoLnJhbmRvbSgpLiAgSXQncyBmYXN0LCBidXQgaXMgb2YgdW5zcGVjaWZpZWRcbiAgLy8gcXVhbGl0eS5cbiAgdmFyICBybmRzID0gbmV3IEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIHJuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJuZHM7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcm5nO1xuIiwidmFyIHJuZyA9IHJlcXVpcmUoJy4vbGliL3JuZycpO1xudmFyIGJ5dGVzVG9VdWlkID0gcmVxdWlyZSgnLi9saWIvYnl0ZXNUb1V1aWQnKTtcblxuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgKytpaSkge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IGJ5dGVzVG9VdWlkKHJuZHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHY0O1xuIl19
