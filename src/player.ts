/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AssetContainer, Context, Guid, MediaInstance, User } from "@microsoft/mixed-reality-extension-sdk";
import { playSound } from "./utils";

const DEFAULT_VOLUME = 50;
const DEFAULT_ROLLOFF = 10;

export type MySound = {
	name: string,
	uri: string,
	duration?: number,
	volume?: number,
	rolloff?: number,
}

export interface AudioPlayerOptions {
	parentId?: Guid,
	user?: User,
	volume?: number,
	rolloff?: number,
}

export class AudioPlayer {
	private playing: Map<string, MediaInstance[]>;
	private stopped: Map<Guid, boolean>;
	private _volume: number;
	private _rolloff: number;
	private speaker: Actor;

	set parentId(id: Guid){
		this.speaker.parentId = id;
	}

	set volume(v: number) {
		this.playing.forEach(ml => {
			ml.forEach(mi => {
				if (!this.stopped.get(mi.id)) { mi.setState({ volume: this._volume / 100 }); }
			});
		})
	}
	set rolloff(v: number) {
		this.playing.forEach(ml => {
			ml.forEach(mi => {
				if (!this.stopped.get(mi.id)) { mi.setState({ rolloffStartDistance: this._rolloff }); }
			});
		})
	}

	constructor(protected context: Context, protected assets: AssetContainer, protected options: AudioPlayerOptions) {
		this.playing = new Map<string, MediaInstance[]>();
		this.stopped = new Map<Guid, boolean>();
		this._volume = this.options.volume !== undefined ? this.options.volume : DEFAULT_VOLUME;
		this._rolloff = this.options.rolloff !== undefined ? this.options.rolloff : DEFAULT_ROLLOFF;
		this.init();
	}

	protected init() {
		this.createSpeaker();
	}

	private createSpeaker() {
		if (this.options.user) {
			this.speaker = Actor.Create(this.context, {
				actor: {
					attachment: {
						userId: this.options.user.id,
						attachPoint: 'head'
					},
					exclusiveToUser: this.options.user.id
				}
			});
		} else {
			this.speaker = Actor.Create(this.context);
			this.parentId = this.options.parentId;
		}
	}

	private loadSound(uri: string) {
		let sound = this.assets.sounds.find(m => m.name == uri);
		if (!this.assets.sounds.find(m => m.name == uri)) {
			sound = this.assets.createSound(uri, { uri });
		}
		return sound;
	}

	public playSound(item: MySound) {
		const uri = item.uri;
		const sound = this.loadSound(uri);
		const volume = item.volume !== undefined ? item.volume / 100 : this._volume / 100;
		const rolloff = item.rolloff !== undefined ? item.rolloff : this._rolloff;
		const mediaInstance = playSound(sound, this.speaker, { volume, rolloffStartDistance: rolloff, doppler: 0, spread: 1 });
		if (this.playing.has(uri)) {
			this.playing.get(uri).push(mediaInstance);
		} else {
			this.playing.set(uri, [mediaInstance]);
		}
		this.stopped.set(mediaInstance.id, false);

		setTimeout(() => {
			this.stopped.set(mediaInstance.id, true);
			if (
				this.playing.get(uri).every(mi => this.stopped.get(mi.id))
			) {
				this.playing.get(uri).forEach(mi => this.stopped.delete(mi.id));
				this.playing.delete(uri);
			}
		}, item.duration * 1000);
	}

	public stopSounds() {
		this.playing.forEach(m => { m.forEach(mi => mi.stop()) })
	}

	public remove() {
		this.speaker.destroy();
	}
}