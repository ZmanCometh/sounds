/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AlphaMode, AssetContainer, ButtonBehavior, ColliderType, CollisionLayer, Color3, Color4, Context, ScaledTransformLike, User } from "@microsoft/mixed-reality-extension-sdk";
import { translate } from "./utils";

export interface ButtonOptions {
	name: string,
	resourceId: string,
	ondemand?: boolean,
	transform: Partial<ScaledTransformLike>,
	dimensions: {
		width: number,
		height: number,
		depth: number,
	},
	messages?: {
		[language: string]: string
	},
	audio?: {
		volume?: number,
		rolloff?: number,
	}
}

export class Button {
	private model: Actor;
	private button: Actor;

	get actor() {
		return this.model;
	}

	public onAction: (act: string, user: User, params?: any) => void;

	constructor(private context: Context, private assets: AssetContainer, private options: ButtonOptions) {
		this.init();
	}

	private init() {
		this.createModel();
		this.createButton();
	}

	private createModel() {
		const local = translate(this.options.transform).toJSON();
		this.model = Actor.CreateFromLibrary(this.context, {
			resourceId: this.options.resourceId,
			actor: {
				transform: { local }
			}
		});
	}

	private createButton() {
		// button
		const dim = this.options.dimensions;
		let mesh = this.assets.meshes.find(m => m.name === 'mesh_button');
		if (!mesh) {
			mesh = this.assets.createBoxMesh('mesh_button', dim.width, dim.height, dim.depth);
		}
		let material = this.assets.materials.find(m => m.name === 'invisible');
		if (!material) {
			material = this.assets.createMaterial('invisible', { color: Color4.FromColor3(Color3.Red(), 0.0), alphaMode: AlphaMode.Blend });
		}
		this.button = Actor.Create(this.context, {
			actor: {
				parentId: this.model.id,
				appearance: {
					meshId: mesh.id,
					materialId: material.id,
				},
				collider: {
					geometry: {
						shape: ColliderType.Box
					},
					layer: CollisionLayer.Hologram
				}
			}
		});

		this.setButtonBehavior();
	}

	private setButtonBehavior() {
		this.button.setBehavior(ButtonBehavior).onClick((user, _) => {
			this.onAction('click', user, { name: this.options.name });
		});
	}

	public reattach() {
		this.setButtonBehavior();
	}

	public remove(user: User) {
	}
}