/// <reference types="pixi.js" />
import Filterable from "../Filterable";
import { IMediaContext } from "../interfaces/IMediaContext";
export default class WebAudioContext extends Filterable implements IMediaContext {
    compressor: DynamicsCompressorNode;
    analyser: AnalyserNode;
    speed: number;
    muted: boolean;
    volume: number;
    events: PIXI.utils.EventEmitter;
    private _ctx;
    private _offlineCtx;
    private _paused;
    private _unlocked;
    constructor();
    private _unlock();
    playEmptySound(): void;
    static readonly AudioContext: typeof AudioContext;
    static readonly OfflineAudioContext: typeof OfflineAudioContext;
    destroy(): void;
    readonly audioContext: AudioContext;
    readonly offlineContext: OfflineAudioContext;
    paused: boolean;
    refresh(): void;
    refreshPaused(): void;
    toggleMute(): boolean;
    togglePause(): boolean;
    decode(arrayBuffer: ArrayBuffer, callback: (err?: Error, buffer?: AudioBuffer) => void): void;
}
