/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AlphaMode, AssetContainer, BoxAlignment, ButtonBehavior, ColliderType, CollisionLayer, Color3, Color4, Context, PlanarGridLayout, ScaledTransformLike, TextAnchorLocation } from "@microsoft/mixed-reality-extension-sdk";
import { AudioPlayer, AudioPlayerOptions, MySound } from "./player";
import { translate } from "./utils";

const SOUNDBOARD_BUTTON_DIMENSIONS = {
	width: 0.08, height: 0.08, depth: 0.005, margin: 0.004
}

export interface SoundboardOptions extends AudioPlayerOptions {
	transform: Partial<ScaledTransformLike>,
	sounds: MySound[],
	layout: {
		rows: number,
		columns: number
	}
}

export class Soundboard extends AudioPlayer {
	private anchor: Actor;
	private grid: PlanarGridLayout;
	private buttons: Actor[];
	constructor(context: Context, assets: AssetContainer, options: SoundboardOptions) {
		super(context, assets, options);
		this.init();
		this.parentId = this.anchor.id;
	}

	init() {
		super.init();
		const local = translate((this.options as SoundboardOptions).transform).toJSON();
		this.anchor = Actor.Create(this.context, {
			actor: {
				transform: {
					local
				}
			}
		});
		this.grid = new PlanarGridLayout(this.anchor);
		this.createButtons();
	}

	private createButtons() {
		const layout = (this.options as SoundboardOptions).layout;
		const sounds = (this.options as SoundboardOptions).sounds;
		let mesh = this.assets.meshes.find(m => m.name == 'button');
		if (!mesh) {
			mesh = this.assets.createBoxMesh('button', SOUNDBOARD_BUTTON_DIMENSIONS.width, SOUNDBOARD_BUTTON_DIMENSIONS.height, SOUNDBOARD_BUTTON_DIMENSIONS.depth);
		}
		let material = this.assets.materials.find(m => m.name == 'soundboard');
		if (!material) {
			material = this.assets.createMaterial('soundboard', { color: Color3.White() });
		}

		this.buttons = [];
		[...Array(layout.rows).keys()].forEach(r => {
			[...Array(layout.columns).keys()].forEach(c => {
				const index = r * layout.columns + c;
				if (index >= sounds.length) return;
				const button = Actor.Create(this.context, {
					actor: {
						parentId: this.anchor.id,
						appearance: {
							meshId: mesh.id,
							materialId: material.id,
						},
						collider: {
							geometry: { shape: ColliderType.Box },
							layer: CollisionLayer.Hologram
						}
					}
				});
				Actor.Create(this.context, {
					actor: {
						parentId: button.id,
						transform: {
							local: {
								position: {
									x: 0, y: 0, z: -SOUNDBOARD_BUTTON_DIMENSIONS.depth
								}
							}
						},
						text: {
							contents: sounds[index].name,
							height: 0.011,
							color: Color3.Black(),
							anchor: TextAnchorLocation.MiddleCenter
						}
					}
				});
				this.grid.addCell({
					row: r,
					column: c,
					width: SOUNDBOARD_BUTTON_DIMENSIONS.width + SOUNDBOARD_BUTTON_DIMENSIONS.margin,
					height: SOUNDBOARD_BUTTON_DIMENSIONS.height + SOUNDBOARD_BUTTON_DIMENSIONS.margin,
					contents: button
				});
				this.buttons.push(button);
			});
		});

		this.grid.gridAlignment = BoxAlignment.MiddleCenter;
		this.grid.applyLayout();
		this.setButtonBehavior();
	}

	private setButtonBehavior() {
		this.buttons.forEach((button, index) => {
			button.setBehavior(ButtonBehavior).onClick((user, _) => {
				const sounds = (this.options as SoundboardOptions).sounds;
				const sound = sounds[index];
				if (sound) this.playSound(sound);
			});
		});
	}

	public reattach() {
		this.setButtonBehavior();
	}
}