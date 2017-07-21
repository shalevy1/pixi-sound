import Filterable from "../Filterable";
import WebAudioContext from "./WebAudioContext";
export interface SourceClone {
    source: AudioBufferSourceNode;
    gain: GainNode;
}
export default class WebAudioNodes extends Filterable {
    static BUFFER_SIZE: number;
    bufferSource: AudioBufferSourceNode;
    script: ScriptProcessorNode;
    gain: GainNode;
    analyser: AnalyserNode;
    context: WebAudioContext;
    constructor(context: WebAudioContext);
    destroy(): void;
    cloneBufferSource(): SourceClone;
}
