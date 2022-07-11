![](https://avatars.githubusercontent.com/u/108149048?s=400&u=fabc0cb4719e28dfba35e7fb0e4ffa0c47011917&v=4)
# Features
- Doorbell
- Text to speech
- Soundboard
# Deployment
- How to deploy it to your own server:
```bash
git clone https://github.com/The-Free-MRE-Foundation/sounds
cd sounds/
npm install
npm run build
npm start
```
- How to deploy it to heroku:
	- create a github account if you don't have one
	- go to [this page](https://github.com/The-Free-MRE-Foundation/sounds), and fork the repo
	- create a [heroku](https://heroku.com) account if you don't have one
	- create a new app on heroku
	- go to settings, and remove all buildbacks
	- create two build backs: first [ffmpeg](https://elements.heroku.com/buildpacks/jonathanong/heroku-buildpack-ffmpeg-latest), next nodejs
	- go to deploy, and connect the new app to github
	- search "doorbell" and choose the repo you've just forked
	- wait for the deployment process to finish
	- click the "view app" button and copy the url of the new webpage, e.g.  
	`https://mydoorbell.herokuapp.com/`
	- replace "https" in the copied url to "ws" or "wss" and remove the trailing slash, e.g.  
	`wss://mydoorbell.herokuapp.com`

# Usage
- go to [this page](https://account.altvr.com/content_packs/new), and create your own content pack
- copy the url to the raw content of the content pack you've created, e.g.  
`https://account.altvr.com/api/content_packs/2043495985698571086/raw`
- pass the url of the content pack as a query parameter, e.g.  
`wss://mydoorbell.herokuapp.com/?url=https://account.altvr.com/api/content_packs/2043495985698571086/raw`

# Customization
## How to customize your doorbell
- example conten pack
```json
{
	"doorbell": {
		"url": "https://cdn-content-ingress.altvr.com/uploads/audio_clip/audio/2043487303556399713/public_doorbell.ogg",
		"duration": 3,
		"language": "en-us",
		"volume": 15,
		"rolloff": 100
	}
}
```
- definitions
	- "url" is the url to the doorbell sound, you can upload your own sound clip to [altspace](https://account.altvr.com/audio_clips/new)
	- "duration" is duration of the doorbell sound
	- "language" is the accent you want the annoucer to speak in,  
	go to [this page](https://github.com/thiennq/node-gtts/blob/master/index.js) to see available languages
	- "volume" should be within range [0, 100]
	- "rolloff" should be greater than 0

## How to use the text to speech buttons
- this MRE also has the ability to add TTS buttons.
- There are two types of text to speech (TTS) buttons:
	- Buttons with a pre-defined message, can be used as automatic commentators for galleries, exmaple content pack
	```json
	{
		"buttons": [
			{
				"name": "artifact1",
				"resourceId": "artifact:1579238678213952234",
				"transform": {
					"position": {
						"x": 0, "y": 0, "z": 0
					},
					"rotation": {
						"x": 0, "y": 0, "z": 0
					}
				},
				"dimensions": {
					"width": 0.1, "height": 0.1, "depth": 0.1
				},
				"messages": {
					"en-us": "Hi, this is the message for artifact 1"
				}
			}
		]
	}
	```
	- On-demand TTS, it will read out the message you typed
	```json
	{
		"buttons": [
			{
				"name": "ondemand",
				"ondemand": true,
				"resourceId": "artifact:1579238678213952234",
				"transform": {
					"position": {
						"x": -1, "y": 0, "z": 0
					},
					"rotation": {
						"x": 0, "y": 0, "z": 0
					}
				},
				"dimensions": {
					"width": 0.1, "height": 0.1, "depth": 0.1
				}
			}
		]
	}
	```

	- definitions:
		- "resourceId" is the artifactId of kit object the button
		- "transform" is the unity transform of the button including position, rotation and scale
		- "dimensions" is the dimensions of the collider of the button
		- if "ondemand" is true, the button is a On-demand TTS button

## How to customize your own soundboard
- example content pack:
```json
{
        "soundboard": {
                "transform": {
                        "position": { "x": 0, "y": 0, "z": 0 }
                },
                "sounds": [
                        {
                                "name": "Okay",
                                "uri": "https://github.com/illuminati360/alt-memes-data/raw/master/sounds/my-song-2_2.ogg",
                                "duration": 0.816979,
                                "volume": 10,
				"rolloff": 10
                        },
                        {
                                "name": "BRUH",
                                "uri": "https://github.com/illuminati360/alt-memes-data/raw/master/sounds/movie_1.ogg",
                                "duration": 0.816979,
                                "volume": 10
                        },
                        {
                                "name": "MLG",
                                "uri": "https://github.com/illuminati360/alt-memes-data/raw/master/sounds/mlg-airhorn.ogg",
                                "duration": 2.965986,
                                "volume": 10
                        }
                ],
                "layout": {
                        "rows": 3,
                        "columns": 3
                }
        }
}
```
- definition
	- "layout" defines the number of rows and columns of the soundboard
	- "sounds" includes information of the sound clips
		- "uri" is the url to the sound clip
		- "name" is the text displayed on sound board button
		- "duration" is the duration of the sound clip
		- "volume" should be within range [0, 100]
		- "rolloff" should be greater than 0
