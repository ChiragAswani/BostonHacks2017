var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var async = require('async');
var bodyParser = require('body-parser');
var path = require('path');

var client_id = '7dd4b4ac52fd4780899e7dd4cc3b632a'; // Your client id
var client_secret = '827dfaf9723541d99953b27293ec91ab'; // Your secret
var redirect_uri = 'http://localhost:8080/callback'; 
//var redirect_uri = 'ec2-52-207-214-118.compute-1.amazonaws.com:8080/callback';
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
var access_token;
var username; 
var usernames;

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());


app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});


app.post('/usernames', function(req, res) {
	if (req.body.count[0].length == 1){
		usernames = [req.body.count]
	}
	else{
		usernames = req.body.count
	}

})




app.get('/callback', function(req, res) {
  console.log("Users you are collaborating with: " + usernames)
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
          console.log("Display Name: " + body.display_name)
          console.log("User ID: " + body.id)
          console.log("User URI: " + body.uri)
        });

        var importedUserPlaylists = {
          url: '',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        
		var dict = [];
        for (usrname = 0; usrname < usernames.length; usrname++){
        	var temp = [];
        	importedUserPlaylists.url = 'https://api.spotify.com/v1/users/' + usernames[usrname] +'/playlists';
        	request.get(importedUserPlaylists, function(error, response, body) {
        		for (item = 0; item < (body.items).length; item++){
        			var playlistset = body.items[item]
        			temp.push({
    					playlistname: playlistset.name,
    					playlistimage: playlistset.images,
    					playlisturl: playlistset.href
					});
					
        		}
          		dict = dict.concat(temp)
          		console.log(dict)	
        	});

        }

        
        



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
	   if (arr.length > 50){
	   		arr = [arr]
	   }
       var convertedPlaylists = [];
       	for (i = 0; i < arr.length; i++){
          var split = arr[i].split("/");
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
        if (sorttype == "popularity"){
          if (left[0].track.popularity >= right[0].track.popularity) { 
            result.push(left.shift());
          } else {
            result.push(right.shift());
         }
        }
        if (sorttype == "danceability"){
          if (left[0].danceability >= right[0].danceability) {   
            result.push(left.shift());
          } else {
            result.push(right.shift());
         }
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


var errors = 0;
var sorttype = '';
app.post('/mixify', function(req, res) {
  //creates a playlist
  var createdplaylist = {
          url: 'https://api.spotify.com/v1/users/' + username + '/playlists',
          headers: { 'Authorization': 'Bearer ' + access_token },
          body: {"description": "Private playlist created by mixifyapp",
                 "public": false,
                 "name": "Mixify Playlist"},
          json: true
  };
  request.post(createdplaylist, function(error, response, body) {
    createdplaylistid = body.id;
    //console.log("User Created Playlist Information")
    //console.log(body)
  })

  //cleans up imported user playlists
  var usergenre = req.body.genre
  var userPlaylists = req.body.count
  sorttype = req.body.sorttype

  //converts userplaylist to api url links
  var convertedPlaylists = convertUserPlaylists(userPlaylists);
  console.log("List of Playlists to send to API:")
  console.log(convertedPlaylists)
  console.log("Sorting Type:")
  console.log(sorttype)


  //sets party duration, userplaylists, and playlist duration
  var partyDuration = req.body.slider;
  var playlistDuration = ((partyDuration*60000)/convertedPlaylists.length);
  console.log("Party Duration: " + partyDuration + " Each playlist duration: " + playlistDuration)

  var playlists = {
          url: '',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
  };
  var currentPlaylist = 0
  var totalSongs = [] //used to test for duplicates
  var error = false;
  for (playlist = 0; playlist < convertedPlaylists.length; playlist++){
    playlists.url = convertedPlaylists[playlist];
    console.log("Fetching data from playlist: " + playlists.url)
    //request.get(playlists, function(error, response, body) {
    	//console.log(body.error.status == 404)
    //})
    request.get(playlists, function(error, response, body) {
        var currentDuration = 0;
        //console.log(body.items)
        try{
          if (sorttype == "popularity"){
              var sortedplaylist = mergeSort(body.items);
              var song = 0;
        	  while (currentDuration <= playlistDuration){
        		if (totalSongs.indexOf(sortedplaylist[song].track.id) == -1){
        			finalplaylist.push(sortedplaylist[song].track.id)
        			totalSongs.push(sortedplaylist[song].track.id) //used to test for duplicates
                	currentDuration += sortedplaylist[song].track.duration_ms
                	console.log("Current Duration: " + currentDuration + " Iteration: " + song)
        		}    
        		song++;
       		  }
           }
          if (sorttype == "danceability"){
            var trackids = ""
              for (trackid = 0; trackid < body.items.length; trackid++){
                trackids = trackids + body.items[trackid].track.id + ','

              }              
              var danceability = {
                url: 'https://api.spotify.com/v1/audio-features?ids=' + trackids,
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
              };
              request.get(danceability, function(error, response, body) {
                var sortedplaylist = mergeSort(body.audio_features) 
                console.log(sortedplaylist)
              })



           }
        /**
          TODO: Make sorted playlists global
                Do while loop for danceability
                Rest of the code should be the same
        **/
        
    	console.log("Songs to add to playlist: ")
    	console.log(finalplaylist)
    	var addSongsToPlaylist = {
        	url: 'https://api.spotify.com/v1/users/' + username + '/playlists/' + createdplaylistid + '/tracks?uris=',
        	headers: { 'Authorization': 'Bearer ' + access_token },
        	json: true
    	};
    	for (songID = 0; songID < finalplaylist.length; songID++){
        	addSongsToPlaylist.url += 'spotify%3Atrack%3A'+ finalplaylist[songID] + ','
    	} 
    	console.log("Number of snapshots should be equal to number of playlists")
    	request.post(addSongsToPlaylist, function(error, response, body) {
        		console.log(body)
       	})
    	finalplaylist = [];
        }
        catch(err){
          console.log("Error in Fetching Playlist")  
          error = true;
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
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8080');
app.listen(8080);

//console.log('Listening on 80');
//app.listen(80);

