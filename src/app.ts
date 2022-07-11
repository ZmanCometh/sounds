/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AssetContainer, Context, Guid, ParameterSet, User } from "@microsoft/mixed-reality-extension-sdk";
import { Button, ButtonOptions } from "./button";
import { Doorbell, DoorbellOptions } from "./doorbell";
import { Soundboard, SoundboardOptions } from "./soundboard";
import { TTS } from "./tts";
import { fetchJSON } from "./utils";

const DEFAULT_SOUNDS_OPTIONS = {
        doorbell: {
                url: 'doorbell.ogg',
                language: 'en-uk',
                duration: 2.5,
                volume: 20,
                rolloff: 100,
        },
}

/**
 * The main class of this app. All the logic goes here.
 */
export default class App {
        private url: string;
        private queue: User[] = [];
        private sounds: Sounds;
        constructor(private context: Context, params: ParameterSet) {
                this.url = params['url'] as string;
                this.context.onStarted(() => this.started());
                this.context.onUserJoined((u: User) => this.userjoined(u));
                this.context.onUserLeft((u: User) => this.userleft(u));
        }

        /**
         * Once the context is "started", initialize the app.
         */
        private async started() {
                this.sounds = new Sounds(this.context, this.url ? await fetchJSON(this.url) : DEFAULT_SOUNDS_OPTIONS);
                this.queue.forEach(user => {
                        this.sounds.userjoined(user);
                })
        }

        private async userjoined(user: User) {
                if (this.sounds) {
                        this.sounds.userjoined(user);
                } else {
                        this.queue.push(user);
                }
        }

        private async userleft(user: User) {
                this.sounds?.userleft(user);
        }
}

const MIN_SYNC_INTERVAL = 1;

export interface SoundsOptions {
        doorbell?: DoorbellOptions,
        buttons?: ButtonOptions[],
        soundboard: SoundboardOptions,
}

export class Sounds {
        private assets: AssetContainer;

        // sync fix
        private syncTimeout: NodeJS.Timeout;

        // players
        private tts: Map<Guid, TTS>;

        // doorbell
        private doorbell: Doorbell;

        // buttons
        private buttons: Button[];

        // soundboard
        private soundboard: Soundboard;

        constructor(private context: Context, private options: SoundsOptions) {
                this.assets = new AssetContainer(context);
                this.tts = new Map<Guid, TTS>();
                this.init();
        }

        private async init() {
                if (this.options.doorbell) {
                        this.doorbell = new Doorbell(this.context, this.assets, Object.assign({ ...this.options.doorbell }, { sequential: true }));
                }

                if (this.options.buttons) {
                        this.buttons = this.options.buttons.map(b => {
                                const button = new Button(this.context, this.assets, b);
                                const options = {
                                        volume: b.audio ? b.audio.volume : undefined,
                                        rolloff: b.audio ? b.audio.rolloff : undefined
                                };
                                button.onAction = (action: string, user: User, params: any) => {
                                        if (action == 'click') {
                                                if (!b.ondemand) {
                                                        if (!this.tts.has(user.id)) {
                                                                const tts = new TTS(this.context, this.assets, {
                                                                        ...options,
                                                                        user,
                                                                });
                                                                this.tts.set(user.id, tts);
                                                        }
                                                        const tts = this.tts.get(user.id);
                                                        tts.speak(b.messages['en-us']);
                                                } else {
                                                        const tts = new TTS(this.context, this.assets, {
                                                                ...options,
                                                                parentId: button.actor.id,
                                                        });
                                                        user.prompt("Text to speech", true).then((dialog) => {
                                                                if (dialog.submitted) {
                                                                        if (!dialog.text) return;
                                                                        tts.speak(dialog.text)
                                                                }
                                                        });
                                                }
                                        }
                                }

                                return button;
                        });
                }

                if (this.options.soundboard) {
                        new Soundboard(this.context, this.assets, this.options.soundboard);
                }
        }

        // sync fix
        private sync() {
                this.syncTimeout = null;
                this.buttons?.forEach(a => a.reattach());
                this.soundboard?.reattach();
        }

        public userjoined = async (user: User) => {
                if (!this.syncTimeout) {
                        this.syncTimeout = setTimeout(() => {
                                this.sync();
                        }, MIN_SYNC_INTERVAL * 1000);
                }

                this.doorbell?.userjoined(user);
        }

        public userleft = (user: User) => {
                if (!this.tts.has(user.id)) { return; }
                this.tts.get(user.id).remove();
                this.tts.delete(user.id);
        }
}