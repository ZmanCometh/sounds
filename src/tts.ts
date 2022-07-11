/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AssetContainer, Context } from "@microsoft/mixed-reality-extension-sdk";
import { AudioPlayer, AudioPlayerOptions } from "./player";

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const gtts = require('node-gtts');
import ffmpeg from 'fluent-ffmpeg';
const sha256 = (x: string) => crypto.createHash('sha256').update(x, 'utf8').digest('hex');

const DEFAULT_LIMIT = 300;

export interface TTSOptions extends AudioPlayerOptions {
	limit?: number,
	sequential?: boolean,
}

export interface TTSItem {
	text: string,
	language?: string,
}

export class TTS extends AudioPlayer {
	private sequential: boolean;

	private queue: TTSItem[] = [];

	constructor(context: Context, assets: AssetContainer, options: TTSOptions) {
		super(context, assets, options);
		this.sequential = options.sequential !== undefined ? options.sequential : false;
	}

	public async speak(text: string, language: string = 'en-us', queue: boolean = true) {
		if (!text) { return; }
		if (text.length > ((this.options as TTSOptions).limit ? (this.options as TTSOptions).limit : DEFAULT_LIMIT)) { return; }

		if (this.sequential) {
			if (queue) {
				this.queue.push({ text, language });
			}
			if (queue && this.queue.length > 1) {
				return;
			}
		}

		const fileName = sha256(`${language}${text}`);
		const filePath = path.join(__dirname, '../public/tts', fileName);

		if (!fs.existsSync(`${filePath}.ogg`)) {
			await new Promise<string>((resolve, reject) => {
				gtts(language).save(`${filePath}.mp3`, text, () => {
					ffmpeg(`${filePath}.mp3`).save(`${filePath}.ogg`).on('end', () => { resolve(filePath) });
				});
			});
		}
		const duration: number = await new Promise((resolve, reject) => {
			ffmpeg.ffprobe(`${filePath}.mp3`, (err, data) => {
				resolve(data ? data.format.duration : 5);
			});
		});
		const uri = `tts/${fileName}.ogg`;
		this.playSound({
			name: fileName,
			uri,
			duration,
		});

		setTimeout(() => {
			this.queue.shift();
                        const next = this.queue[0];
			if (next) this.speak(next.text, next.language, false);
		}, duration * 1000);
	}

}