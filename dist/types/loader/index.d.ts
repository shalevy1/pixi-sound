import SoundLibrary from "../SoundLibrary";
export default class LoaderMiddleware {
    static _sound: SoundLibrary;
    static install(sound: SoundLibrary): void;
    static legacy: boolean;
    private static resolve(resource, next);
    private static plugin(resource, next);
}
