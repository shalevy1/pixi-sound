/// <reference types="pixi.js" />
import HTMLAudioMedia from "./HTMLAudioMedia";
import { IMediaInstance } from "../interfaces/IMediaInstance";
import { PlayOptions } from "../Sound";
export default class HTMLAudioInstance extends PIXI.utils.EventEmitter implements IMediaInstance {
    static PADDING: number;
    id: number;
    private _source;
    private _media;
    private _end;
    private _paused;
    private _muted;
    private _pausedReal;
    private _duration;
    private _start;
    private _playing;
    private _volume;
    private _speed;
    private _loop;
    constructor(parent: HTMLAudioMedia);
    readonly progress: number;
    paused: boolean;
    private _onPlay();
    private _onPause();
    init(media: HTMLAudioMedia): void;
    private _internalStop();
    stop(): void;
    speed: number;
    volume: number;
    loop: boolean;
    muted: boolean;
    refresh(): void;
    refreshPaused(): void;
    play(options: PlayOptions): void;
    private _onUpdate();
    private _onComplete();
    destroy(): void;
    toString(): string;
}
