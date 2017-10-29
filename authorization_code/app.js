var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var async = require('async');
var bodyParser = require('body-parser');
var path = require('path');

var client_id = '7dd4b4ac52fd4780899e7dd4cc3b632a'; // Your client id
var client_secret = '827dfaf9723541d99953b27293ec91ab'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */


var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();
app.use(bodyParser());

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());



app.get('/login', function(req, res) {
  console.log("LOGIN")
  console.log(req.body)
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});



var access_token;
var username; 

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };


    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

            access_token = body.access_token;
            var refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
        request.get(options, function(error, response, body) {
          username = body.id
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

var contains = function(needle) {
    // Per spec, the way to identify NaN is that it is not equal to itself
    var findNaN = needle !== needle;
    var indexOf;

    if(!findNaN && typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                var item = this[i];

                if((findNaN && item !== item) || item === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle) > -1;
};


function remove(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
function convertUserPlaylists(arr) {
       var convertedPlaylists = [];
       for (i = 0; i < arr.length; i++){
          var split = arr[i].split('/');
          convertedPlaylists.push('https://api.spotify.com/v1/users/' + split[4] + '/playlists/' + split[6] + '/tracks');
       }
       return convertedPlaylists;
}

function mergeSort(arr)
{
    if (arr.length < 2)
        return arr;
 
    var middle = parseInt(arr.length / 2);
    var left   = arr.slice(0, middle);
    var right  = arr.slice(middle, arr.length);
 
    return merge(mergeSort(left), mergeSort(right));
}

function merge(left, right)
{
    var result = [];
 
    while (left.length && right.length) {
        if (left[0].track.popularity >= right[0].track.popularity) {
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }
 
    while (left.length)
        result.push(left.shift());
 
    while (right.length)
        result.push(right.shift());
 
    return result;
}

var finalplaylist = [];
var createdplaylistid;

app.post('/mixify', function(req, res) {
  //creates a playlist
  var createdplaylist = {
          url: 'https://api.spotify.com/v1/users/chirag323/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          body: {"description": "Chirag, Tigran, Alex, Patrick",
                 "public": false,
                 "name": "Mixify Playlist"},
          json: true
  };
  request.post(createdplaylist, function(error, response, body) {
    createdplaylistid = body.id;
  })

  //cleans up imported user playlists
  var messyinput = req.body.inputtedplaylists
  var usergenre = req.body.genre
  var userPlaylists = messyinput.split(", ")

  //sets party duration, userplaylists, and playlist duration
  var partyDuration = req.body.slider;
  var playlistDuration = ((partyDuration*60000)/userPlaylists.length);

  //converts userplaylist to api url links
  var convertedPlaylists = convertUserPlaylists(userPlaylists);
  console.log("to be imported: " + convertedPlaylists);
  console.log("each playlist duration: " + playlistDuration);




  var playlists = {
          url: '',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
  };
  var artist = {
                url: '',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
  };
  var currentPlaylist = 0

  for (playlist = 0; playlist < convertedPlaylists.length; playlist++){
    playlists.url = convertedPlaylists[playlist];
    request.get(playlists, function(error, response, body) {
      console.log(body)
      try {
        var error = body.error.status
        console.log("FAILURE")
      }
      catch(err) {
        console.log("SUCCESS")
      }
      var currentDuration = 0
      var sortedplaylist = mergeSort(body.items);
      var i = 0;
      var artistgenres = []
      while (currentDuration <= playlistDuration){
              //NEED TO CHECK DUPLICATED
              
              //artist.url = 'https://api.spotify.com/v1/artists/' + sortedplaylist[i].track.artists[0].id
              //request.get(artist, function(error, response, body) {
                //artistgenres = body.genres
                //if (artistgenres != []){
                  //var genrebool = contains.call(artistgenres, usergenre)
                  //if (genrebool == false){
                    var bool = contains.call(finalplaylist, sortedplaylist[i].track.id)
                    if (bool == false){
                      finalplaylist.push(sortedplaylist[i].track.id)
                    currentDuration += sortedplaylist[i].track.duration_ms 
                    } 
                  //} 
                //} 
                //console.log(artistgenres)
              //})
              i++;
              
            //}
        //}
      }
      console.log(finalplaylist);
      console.log(createdplaylistid);

      var addsongstoplaylist = {
          url: 'https://api.spotify.com/v1/users/' + username + '/playlists/' + createdplaylistid + '/tracks?uris=' + 'spotify%3Atrack%3A6kig1UFggPUyZBCvXD3Wod,spotify%3Atrack%3A6kig1UFggPUyZBCvXD3Wod',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
      };
      for (finalplay = 0; finalplay < finalplaylist.length; finalplay++){
        addsongstoplaylist.url = 'https://api.spotify.com/v1/users/' + username + '/playlists/' + createdplaylistid + '/tracks?uris=' + 'spotify%3Atrack%3A' + finalplaylist[finalplay]
        request.post(addsongstoplaylist, function(error, response, body) {

        })
      }
  })
}
res.sendfile(path.join(__dirname + '/public/mixify.html'));

});


app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };


  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      console.log(access_token);
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);

// use the access token to access the Spotify Web API
        /**
        var finalPlaylistSongs = [];
        var playlists = {
          url: 'https://api.spotify.com/v1/users/12150032742/playlists/2pz1x3ROaCJ9OalZqirkS5/tracks',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
            var currentPlaylist = 0
            var finalPlaylistSongs = []
            while (currentPlaylist < userPlaylists.length){
              playlists.url = convertedPlaylists[currentPlaylist]
              request.get(playlists, function(error, response, body) {
              console.log("Number of Songs in Playlist" + body.total)
              numSongsInPlaylist = body.total;
              var playlistItems = body.items;
              currentDuration =  0
              currentSongs = []
              while (currentDuration < playlistDuration){
              
                var randomNum = Math.floor(Math.random() * 99)
                var songDuration = playlistItems[randomNum].track.duration_ms
                var songUri = playlistItems[randomNum].track.uri
                console.log("Song Duration:" + songDuration);
                if (currentSongs.indexOf(songUri) == -1){
                    currentSongs.push(songUri)
                    currentDuration += songDuration
                }
                console.log("Current Duration:" + currentDuration);
              }
                finalPlaylistSongs = finalPlaylistSongs.concat(currentSongs);
                console.log(finalPlaylistSongs)
              })
            currentPlaylist += 1
            }      
            **/
