var height = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;
var width = isNaN(window.innerWidth) ? window.clientWidth : window.innerWidth;

var movies = [];
var movie = {};
var movieTorrents = [];

var series = [];
var serie = {};

var episodesId = "";
var episodes = [];

var episode = {};

var seriesPage = 0;
var moviesPage = 0;

var seriesSearchPage = 0;
var moviesSearchPage = 0;

var searchSeriesString = "";
var searchMoviesString = "";

var moviesSearch = [];
var seriesSearch = [];

$(window).scroll(function() {
  if ($(window).scrollTop() >= $(document).height() - $(window).height()) {
    if ($('#loadingRemote').css('display') === 'none' || $('#loadingRemote').css('display') === 'hidden') {
      loadMore();
    }
  }
});

$('#searchMovies input').keypress(function(e) {
  if (e.which == 13) {
    $('#searchMovies').submit();
    return false;
  }
});

$('#searchSeries input').keypress(function(e) {
  if (e.which == 13) {
    $('#searchSeries').submit();
    return false;
  }
});

$('#searchSeries').submit(function(e) {
  e.preventDefault();
  if ($('#loadingRemote').css('display') === 'none' || $('#loadingRemote').css('display') === 'hidden') {
    searchSeriesString = $('#searchSeries input').val();
    $('#seriesList').html('');
    if (searchSeriesString === "") {
      loadSeries();
    } else {
      seriesSearchPage = 0;
      seriesSearch = [];
      $('#loadingRemote').show();
      socket.emit('searchSeries', {
        query: searchSeriesString,
        page: (seriesSearchPage + 1)
      }, function(result) {
        $('#loadingRemote').hide();
        if (result.success) {
          seriesSearchPage = 1;
          seriesSearch = result.series;
          for(var i = 0; i < searchSeries.length; i++) {
            if (seriesSearch[i].images.fanart != null) {
              $('#seriesList').append('<li>' +
                '<div class="card" onclick="openSeries(\'' + seriesSearch[i].imdb_id + '\')" style="background-image:url(\'' + seriesSearch[i].images.fanart + '\')">' +
                '<span>' + seriesSearch[i].title + '</span>' +
                '</div></li>');
            }
          }
        }
      });
    }
  }
});

function loadSeries() {
  for(var i = 0; i < series.length; i++) {
    if (series[i].images.fanart != null) {
      $('#seriesList').append('<li>' +
        '<div class="card" onclick="openSeries(\'' + series[i].imdb_id + '\')" style="background-image:url(\'' + series[i].images.fanart + '\')">' +
        '<span>' + series[i].title + '</span>' +
        '</div></li>');
    }
  }
}

function getSerie(imdb_id, cb) {
  socket.emit('getSerie', imdb_id, function(result) {
    if (result.success) {
      serie = result.serie;
      cb();
    }
  });
}

function fetchSeries(cb) {
  socket.emit('getPopularSeries', (seriesPage + 1), function(result) {
    if (result.success) {
      seriesPage++;
      for(var i = 0; i < result.series.length; i++) {
        series.push(result.series[i]);
        if (result.series[i].images.fanart != null) {
          $('#seriesList').append('<li>' +
            '<div class="card" onclick="openSeries(\'' + result.series[i].imdb_id + '\')" style="background-image:url(\'' + result.series[i].images.fanart + '\')">' +
            '<span>' + result.series[i].title + '</span>' +
            '</div></li>');
        }
      }
      $('#loadingRemote').hide();
    }
  });
}

function buildSerie() {
  $('#serieTitle').html(serie.title);
  $('#serieDescription').html(serie.synopsis);
  $('#seriePoster').attr('src', serie.images.fanart);
  $('#serieStatus').html('');
  $('#serieStatus').append('<i class="stamp">' + serie.status + '</i>');
  for (var i = 0; i < serie.genres.length; i++) {
    $('#serieStatus').append('<i class="stamp">' + serie.genres[i] + '</i>');
  }
  var serieSeasonButtons = '';
  for(var i = 0; i < serie.num_seasons; i++) {
    serieSeasonButtons += '<a href="javascript:openSeason(\'' + serie.imdb_id + '\', ' + (i + 1).toString() + ')">Season ' + (i + 1).toString() + '</a>';
  }
  $('#serieSeasonButtons').html(serieSeasonButtons);
  $('#loadingRemote').hide();
  $('#serie').show();
}

function compareEpisode(a,b) {
  if (a.episode < b.episode)
     return -1;
  if (a.episode > b.episode)
    return 1;
  return 0;
}

function getSeason(seasonNumber) {
  episodes = [];
  for(var i = 0; i < serie.episodes.length; i++) {
    if (serie.episodes[i].season === seasonNumber) {
      episodes.push(serie.episodes[i]);
    }
  }
  episodes.sort(compareEpisode);
  episodesId = series.imdb_id;
}

function buildSeason(seasonNumber) {
  $('#episodesList').html('');
  var episodesList = '';
  for (var i = 0; i < episodes.length; i++) {
    episodesList += '<li>' +
      '<div class="card" onclick="openEpisode(\'' + serie.imdb_id + '\', ' + seasonNumber + ', ' + episodes[i].episode + ')">' +
      '<span>' + episodes[i].title + '</span>' +
      '</div></li>';
  }
  $('#episodesList').html(episodesList);
  $('#season').show();
  $('#loadingRemote').hide();
}

function buildEpisode(seasonNumber, episodeNumber) {
  episode = episodes[episodeNumber - 1];
  $('#episodeTitle').html(episode.title);
  $('#episodeDescription').html(episode.overview);
  // $('#episodePoster').attr('src', serie.images.fanart);
  $('#episodeCode').html('S' + seasonNumber + ' E' + episodeNumber);
  var episodePlayButtons = '';
  if (episode.torrents['480p'] != null) {
    episodePlayButtons += '<a href="javascript:playEpisodeTorrent(\''+ serie.title +'\', \''+ seasonNumber + '\', \''+ episodeNumber +'\',\'' + episode.torrents['480p'].url + '\')">Play Episode in 480p</a>';
  }
  if (episode.torrents['720p'] != null) {
    episodePlayButtons += '<a href="javascript:playEpisodeTorrent(\''+ serie.title +'\', \''+ seasonNumber + '\', \''+ episodeNumber +'\',\'' + episode.torrents['720p'].url + '\')">Play Episode in 720p</a>';
  }
  if (episode.torrents['1080p'] != null) {
    episodePlayButtons += '<a href="javascript:playEpisodeTorrent(\''+ serie.title +'\', \''+ seasonNumber + '\', \''+ episodeNumber +'\',\'' + episode.torrents['1080p'].url + '\')">Play Episode in 1080p</a>';
  }
  $('#episodePlayButtons').html(episodePlayButtons);
  $('#episode').show();
  $('#loadingRemote').hide();
}

$('#searchMovies').submit(function (e) {
  e.preventDefault();
  if ($('#loadingRemote').css('display') === 'none' || $('#loadingRemote').css('display') === 'hidden') {
    searchMoviesString = $('#searchMovies input').val();
    $('#moviesList').html('');
    if (searchMoviesString === "") {
      for(var i = 0; i < movies.length; i++) {
        if (movies[i].backdrop_path != null) {
          $('#moviesList').append('<li>' +
            '<div class="card" onclick="openSeries(' + movies[i].id.toString() + ')" style="background-image:url(\'http://image.tmdb.org/t/p/w500' + movies[i].backdrop_path + '\')">' +
            '<span>' + movies[i].original_title + '</span>' +
            '</div></li>');
        }
      }
    } else {
      moviesSearchPage = 0;
      moviesSearch = [];
      $('#loadingRemote').show();
      socket.emit('searchMovies', {
        query: searchMoviesString,
        page: (moviesSearchPage + 1)
      }, function(result) {
        $('#loadingRemote').hide();
        if (result.success) {
          moviesSearchPage = 1;
          moviesSearch = result.movies;
          for(var i = 0; i < searchMovies.length; i++) {
            if (moviesSearch[i].backdrop_path != null) {
              $('#moviesList').append('<li>' +
                '<div class="card" onclick="openMovies(' + moviesSearch[i].id.toString() + ')" style="background-image:url(\'http://image.tmdb.org/t/p/w500' + moviesSearch[i].backdrop_path + '\')">' +
                '<span>' + moviesSearch[i].original_title + '</span>' +
                '</div></li>');
            }
          }
        }
      });
    }
  }
});

function loadMore() {
  var hash = window.location.hash.split('/');
  if (hash[1] === 'movies' && hash.length == 2) {
    if (searchMoviesString === "") {
      $('#loadingRemote').show();
      socket.emit('getPopularMovies', (moviesPage + 1), function(result) {
        $('#loadingRemote').hide();
        if (result.success) {
          moviesPage++;
          for(var i = 0; i < result.movies.length; i++) {
            movies.push(result.movies[i]);
            if (result.movies[i].backdrop_path != null) {
              $('#moviesList').append('<li>' +
                '<div class="card" onclick="openMovies(' + result.movies[i].id.toString() + ')" style="background-image:url(\'http://image.tmdb.org/t/p/w500' + result.movies[i].backdrop_path + '\')">' +
                '<span>' + result.movies[i].original_title + '</span>' +
                '</div></li>');
            }
          }
        }
      });
    } else {
      $('#loadingRemote').show();
      socket.emit('searchMovies', {
        query: searchMoviesString,
        page: (moviesSearchPage + 1)
      }, function(result) {
        $('#loadingRemote').hide();
        if (result.success) {
          moviesSearchPage++;
          for(var i = 0; i < result.movies.length; i++) {
            moviesSearch.push(result.movies[i]);
            if (result.movies[i].backdrop_path != null) {
              $('#moviesList').append('<li>' +
                '<div class="card" onclick="openMovies(' + result.movies[i].id.toString() + ')" style="background-image:url(\'http://image.tmdb.org/t/p/w500' + result.movies[i].backdrop_path + '\')">' +
                '<span>' + result.movies[i].original_title + '</span>' +
                '</div></li>');
            }
          }
        }
      });
    }
  } else if (hash[1] === 'series' && hash.length == 2) {
    if (searchSeriesString === "") {
      $('#loadingRemote').show();
      fetchSeries();
    } else {
      $('#loadingRemote').show();
      socket.emit('searchSeries', {
        query: searchSeriesString,
        page: (seriesSearchPage + 1)
      }, function(result) {
        $('#loadingRemote').hide();
        if (result.success) {
          seriesSearchPage++;
          for(var i = 0; i < result.series.length; i++) {
            seriesSearch.push(result.series[i]);
            if (result.series[i].backdrop_path != null) {
              $('#seriesList').append('<li>' +
                '<div class="card" onclick="openSeries(' + result.series[i].id.toString() + ')" style="background-image:url(\'http://image.tmdb.org/t/p/w500' + result.series[i].backdrop_path + '\')">' +
                '<span>' + result.series[i].name + '</span>' +
                '</div></li>');
            }
          }
        }
      });
    }
  }
}

function toggleNavigation() {
  $('#navigation').toggle();
}

function stop() {
  socket.emit('stopMedia');
  $('#media-title').html('');
}

function play() {
  socket.emit('pauseplayMedia');
}

function forward() {
  socket.emit('forwardMedia');
}

function backward() {
  socket.emit('backwardMedia');
}

function openMovies(id) {
  window.location.hash = '#/movies/' + id;
}

function openSeries(id) {
  window.location.hash = '#/series/' + id;
}

function openSeason(serieId, seasonNumber) {
  window.location.hash = '#/series/' + serieId + '/' + seasonNumber;
}

function openEpisode(serieId, seasonNumber, episodeNumber) {
  window.location.hash = '#/series/' + serieId + '/' + seasonNumber + '/' + episodeNumber;
}

function playMovieTorrent(i) {
  var options = {
    magnet: movieTorrents[i].TorrentMagnetUrl,
    title: movie.original_title
  };
  socket.emit('playTorrent', options, function(result) {});
}

function playEpisodeTorrent(serieName, seasonNumber, episodeNumber, magnet) {
  var options = {
    magnet: magnet,
    title: (serieName + ' S' + seasonNumber + ' E' + episodeNumber)
  };
  socket.emit('playTorrent', options, function(result) {});
}

riot.route(function(hash) {
  hash = hash.split('/');
  $('article').hide();
  $('form').hide();
  $('#loadingRemote').hide();

  if (hash[1] !== 'movies') {
    moviesSearchPage = "";
  }

  if (hash[1] !== 'series') {
    seriesSearchPage = "";
  }

  if (hash[1] === 'movies') {
    if (hash.length == 2) {
      $('#searchMovies').show();
    }
    if (hash[2] != null) {
      var id = parseInt(hash[2]);
      $('#loadingRemote').show();
      socket.emit('getMovie', id, function(result) {
        movie = result.movie;
        if (result.success) {
          $('#movieTitle').html(movie.original_title);
          $('#movieDescription').html(movie.overview);
          $('#moviePoster').attr('src', 'http://image.tmdb.org/t/p/w780' + movie.backdrop_path);
          $('#movieStatus').html('');
          $('#movieStatus').append('<i class="stamp">' + movie.runtime + ' min' + '</i>');
          for (var i = 0; i < movie.genres.length; i++) {
            $('#movieStatus').append('<i class="stamp">' + movie.genres[i].name + '</i>');
          }
          $('#moviePlayButtons').html('');
          $('#movie').show();
          $('#loadingRemote').hide();
          socket.emit('searchMovieTorrents', movie.imdb_id, function(result) {
            movieTorrents = result.torrents;
            if (result.success) {
              for(var i = 0; i < movieTorrents.length; i++) {
                var torrent = movieTorrents[i];
                $('#moviePlayButtons').append('<a href="javascript:playMovieTorrent(' + i + ')">Play in ' + torrent.Quality + '</a>');
              }
            }
          });
        }
      });
    } else {
      if (movies.length > 0) {
        $('#movies').show();
      } else {
        $('#moviesList').html('');
        $('#movies').show();
        $('#loadingRemote').show();
        moviesPage = 0;
        socket.emit('getPopularMovies', (moviesPage + 1), function(result) {
          $('#loadingRemote').hide();
          if (result.success) {
            moviesPage = 1;
            movies = result.movies;
            $('#movies').show();
            for(var i = 0; i < movies.length; i++) {
              if (movies[i].backdrop_path != null) {
                $('#moviesList').append('<li>' +
                  '<div class="card" onclick="openMovies(' + movies[i].id.toString() + ')" style="background-image:url(\'http://image.tmdb.org/t/p/w500' + movies[i].backdrop_path + '\')">' +
                  '<span>' + movies[i].original_title + '</span>' +
                  '</div></li>');
              }
            }
          }
        });
      }
    }
  } else if (hash[1] === 'series') {
    if (hash.length == 2) {
      $('#searchSeries').show();
    }
    if (hash[2] != null) {
      if (hash[3] != null) {
        if (hash[4] != null) {
          var imdb_id = hash[2];
          var seasonNumber = parseInt(hash[3]);
          var episodeNumber = parseInt(hash[4]);
          $('#loadingRemote').show();
          if (serie == null || serie.imdb_id !== imdb_id) {
            getSerie(imdb_id, function() {
              if (episodes.length == 0 || episodesId !== imdb_id) {
                getSeason(seasonNumber);
              }
              buildEpisode(seasonNumber, episodeNumber);
            });
          } else {
            if (episodes.length == 0 || episodesId !== imdb_id) {
              getSeason(seasonNumber);
            }
            buildEpisode(seasonNumber, episodeNumber);
          }
        } else {
          var imdb_id = hash[2];
          var seasonNumber = parseInt(hash[3]);
          $('#loadingRemote').show();
          if (serie == null || serie.imdb_id !== imdb_id) {
            $('#loadingRemote').show();
            getSerie(imdb_id, function() {
              if (episodes.length == 0 || episodesId !== imdb_id) {
                getSeason(seasonNumber);
              }
              buildSeason(seasonNumber);
            });
          } else {
            $('#loadingRemote').show();
            if (episodes.length == 0 || episodesId !== imdb_id) {
              getSeason(seasonNumber);
            }
            buildSeason(seasonNumber);
          }
        }
      } else {
        var imdb_id = hash[2];
        $('#loadingRemote').show();
        if (serie == null || serie.imdb_id !== imdb_id) {
          getSerie(imdb_id, function() {
            buildSerie();
          });
        } else {
          buildSerie();
        }
      }
    } else {
      serie = {};
      if (series.length > 0) {
        $('#series').show();
      } else {
        $('#seriesList').html('');
        $('#series').show();
        $('#loadingRemote').show();
        seriesPage = 0;
        series = [];
        fetchSeries();
      }
    }
  } else if (hash[1] === 'youtube') {

  } else if (hash[1] === 'gaming') {

  } else if (hash[1] === 'homecontrol') {

  } else {
    $('#start').show();
  }
  $('#navigation').hide();
});

var socket = io('/ioremote');
socket.on('statePlay', function(title) {
  $('#media-title').html(title);
});
socket.on('stateStop', function() {
  $('#media-title').html('');
});
socket.on('connect', function() {
  socket.emit('getState', function(result) {
    if (result.playing) {
      $('#media-title').html(result.title);
    }
  });
});
