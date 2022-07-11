/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AssetContainer, Context, User } from "@microsoft/mixed-reality-extension-sdk";
import { TTS, TTSOptions } from "./tts";

export interface DoorbellOptions extends TTSOptions {
	url: string,
	duration: number,
	language?: string,
}

export class Doorbell extends TTS {
	private semaphore: boolean = false;
	constructor(context: Context, assets: AssetContainer, options: DoorbellOptions) {
		super(context, assets, options);
	}

	public userjoined(user: any) {
		this.play(user.name);
	}

	private async play(name: string) {
		if (!this.semaphore) {
			this.semaphore = true;
			this.playSound({
				name: 'doorbell',
				uri: (this.options as DoorbellOptions).url,
				duration: (this.options as DoorbellOptions).duration,
			});
			await new Promise(resolve => setTimeout(resolve, (this.options as DoorbellOptions).duration * 1000));
			this.semaphore = false;
		} else {
			await new Promise(resolve => setTimeout(resolve, (this.options as DoorbellOptions).duration * 1000));
		}

		this.speak(`${name} has entered the room.`, (this.options as DoorbellOptions).language);
	}
}