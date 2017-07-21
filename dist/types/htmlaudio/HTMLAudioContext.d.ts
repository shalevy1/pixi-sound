/// <reference types="pixi.js" />
import { IMediaContext } from "../interfaces/IMediaContext";
import Filter from "../filters/Filter";
export default class HTMLAudioContext extends PIXI.utils.EventEmitter implements IMediaContext {
    speed: number;
    muted: boolean;
    volume: number;
    paused: boolean;
    constructor();
    refresh(): void;
    refreshPaused(): void;
    filters: Filter[];
    readonly audioContext: AudioContext;
    toggleMute(): boolean;
    togglePause(): boolean;
    destroy(): void;
}
