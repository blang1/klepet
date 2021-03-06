function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').append(dodajSlika(sporocilo));
    $('#sporocila').append(dodajVideo(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);
  
  socket.on('dregljaj', function(rezultat){
    if(rezultat.dregljaj){
      $('#vsebina').jrumble();
      //console.log("DOAGJA");
      $('#vsebina').trigger('startRumble');
      setTimeout(function() {
        $('#vsebina').trigger('stopRumble');
      }, 1500);
    }
  });
  
  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    //$('#sporocila').append(sporocilo.besedilo);
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    var novo = dodajSlika(sporocilo.besedilo);
    $('#sporocila').append(novo);
    var novo1 = dodajVideo(sporocilo.besedilo);
    $('#sporocila').append(novo1);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val('/zasebno "'+$(this).text()+'"');
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function dodajSlika(vhodnoBesedilo){
  var matching = /https?:\/\/.*?\.(jpg|png|gif)/g;
  var images = vhodnoBesedilo.match(matching);
  var n="";
  for(var m in images){
  	if(m==0)
  	  vhodnoBesedilo= vhodnoBesedilo+'<br>';
  	var string = " <img src='"+images[m]+"' class=\"slika\" />";
  	//console.log(string);
  	if(string.indexOf("http://sandbox.lavbic.net/teaching/OIS/gradivo/")==-1)
  	  n=n+string;//vhodnoBesedilo=vhodnoBesedilo+string;

  }
  if(images!=null) {
    //console.log(vhodnoBesedilo);
    return $('<div style="font-weight: bold"></div>').html(n);
  }
   
}

function dodajVideo(vhodnoBesedilo){
  var link = /(?:(?:http|https):\/\/www\.youtube\.com\/watch\?v=)(.{11})/gi;
  var youtube = vhodnoBesedilo.match(link);
  var n="";

  for(var i in youtube){
  	if(i==0)
  	  vhodnoBesedilo= vhodnoBesedilo+'<br>';
  
  	youtube[i] = youtube[i].replace(/(?:(?:http|https):\/\/www\.youtube\.com\/watch\?v=)(.{11})/gi, '$1');
  	var string = "<iframe class=\"video\" src='https://www.youtube.com/embed/"+youtube[i]+"' allowfullscreen></iframe>";
  	n=n+string;//vhodnoBesedilo=vhodnoBesedilo+string;

  }
  if(youtube!=null) {
    //console.log(vhodnoBesedilo);
    return $('<div style="font-weight: bold"></div>').html(n);
  } 
   
}
