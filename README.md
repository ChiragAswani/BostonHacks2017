# Developer Link
https://developer.spotify.com/web-api/console/get-playlist-tracks/#complete

# Objective
The problem we saw with many social gatherings is that people want to play their own music, resulting in random people taking the hosts' phone to play music. Also, everyone is too lazy to add music to a collaborative playlist. My solution takes an N number of playlists and an X amount of minutes (party duration) and selects an equal amount of minutes from each playlist to total the party duration. Currently, it selects songs randomly from each playlist; however, I would like to add more data science into it including 
* Song popularity
* Repeated songs
* Cross reference with Global top 100 songs
* Event type - party, gala, etc.

# Screenshot
![My image](https://github.com/ChiragAswani/Mixify/blob/master/Screenshot.png?raw=true)

# Spotify Accounts Authentication Examples

This project contains basic demos showing the different OAuth 2.0 flows for [authenticating against the Spotify Web API](https://developer.spotify.com/web-api/authorization-guide/).

These examples cover:

* Authorization Code flow
* Client Credentials flow
* Implicit Grant flow

## Installation

These examples run on Node.js. On [its website](http://www.nodejs.org/download/) you can find instructions on how to install it. You can also follow [this gist](https://gist.github.com/isaacs/579814) for a quick and easy way to install Node.js and npm.

Once installed, clone the repository and install its dependencies running:

    $ npm install

## Running the examples
In order to run the different examples, open the folder with the name of the flow you want to try out, and run its `app.js` file. For instance, to run the Authorization Code example do:

    $ cd authorization_code
    $ node app.js

Then, open `http://localhost:8888` in a browser.

### Using your own credentials
The examples contains a working client ID and secret key. Note, however, that they might be rate limited if they are used frequently. If you are planning to create an application, we recommend you register your app and get your own credentials instead of using the ones in this project.

Go to [My Applications on Spotify Developer](https://developer.spotify.com/my-applications) and create your application. For the examples, we registered these Redirect URIs:

* http://localhost:8888 (needed for the implicit grant flow)
* http://localhost:8888/callback

Once you have created your app, replace the `client_id`, `redirect_uri` and `client_secret` in the examples with the ones you get from My Applications.
