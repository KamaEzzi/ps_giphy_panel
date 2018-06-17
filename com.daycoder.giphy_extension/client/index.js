var API_KEY = ;
var PAGE_SIZE = 30;
var ENTER_KEY = 13;
var OFFSET = 0;
var isLoadingNow = false;


var lightSpinner = new Spinner({ lines: 30, length: 0, width: 2, radius: 8, corners: 0, color: '#fff', speed: 2, trail: 100, hwaccel: true, className: 'spinner', zIndex: 2e9 }).spin();
var darkSpinner  = new Spinner({ lines: 30, length: 0, width: 2, radius: 8, corners: 0, color: '#777', speed: 2, trail: 100, hwaccel: true, className: 'spinner', zIndex: 2e9 }).spin();
var csInterface  = new CSInterface();

function GifResp(id, slug) {
  this.url = 'https://media.giphy.com/media/' + id + '/giphy.gif';
  this.slug = slug;
}

var cleanFileName = function(name) {
  name = name.split(' ').join('-');
  return name.replace(/\W/g, '');
};

var createTempFolder = function() {
  var tempFolderName = 'daycoder.giphy.extension/';
  var tempFolder = '/tmp/' + tempFolderName;
  if (window.navigator.platform.toLowerCase().indexOf('win') > -1) {
    tempFolder = csInterface.getSystemPath(SystemPath.USER_DATA) + '/../Local/Temp/' + tempFolderName;
  }
  window.cep.fs.makedir(tempFolder);
  return tempFolder;
};

var downloadAndOpenInPhotoshop = function(url, name, thumb) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
    if (this.status == 200 || this.status == 304) {
      var uInt8Array = new Uint8Array(this.response);
      var i = uInt8Array.length;
      var binaryString = new Array(i);
      while (i--)
        binaryString[i] = String.fromCharCode(uInt8Array[i]);
      var data = binaryString.join('');
      var base64 = window.btoa(data);

      var downloadedFile = createTempFolder() + name + '.gif';

      window.cep.fs.writeFile(downloadedFile, base64, cep.encoding.Base64);
      csInterface.evalScript('openDocument("' + downloadedFile + '")');
      $('.container').masonry('remove', thumb);
      $('.container').masonry('reload');
    }
  };
  xhr.send();
};


var setupMasonry = function() {
  var gutterWidth = 2;
  $('.container').masonry({
    isAnimated: true,
    itemSelector: '.thumb',
    gutterWidth: gutterWidth,
    columnWidth: function(containerWidth) {
      var boxes = Math.ceil(containerWidth / 150);
      var totalGutterSpace = (boxes - 1) * gutterWidth;
      var boxWidth = Math.floor((containerWidth - totalGutterSpace) / boxes);
      $('.thumb').width(boxWidth);
      return boxWidth;
    }
  });
}

var search = function(query) {
  var url = 'https://api.giphy.com/v1/gifs/search';
  url += '?api_key=' + API_KEY;
  url += '&q=' + query;
  url += '&limit=' + PAGE_SIZE
  url += '&offset=' + OFFSET
  url += '&rating=G&lang=en';

  $.getJSON(url, function (response) {
	  var dataCount = response.data.length;
		$.each(response.data, function(i, row){
				var gr = new GifResp(row.id, row.slug);
				addItem(gr);
				isLoadingNow = (dataCount - 1 > i)
		});
		hideLoading()
    });
  
};

var addItem = function(gr) {
	var itemStr = '<div class="thumb"><div class="overlay"></div><img src="' + gr.url + '" ></img></div>';
	var thumb = $(itemStr).appendTo('.container');
	  thumb.click(function() {
		var overlay = thumb.find('.overlay');
		thumb.addClass('downloading');
		overlay.append($(lightSpinner.el).clone());
		overlay.show();
		downloadAndOpenInPhotoshop(gr.url, cleanFileName(gr.slug), thumb);
  })
}

var showLoading = function() {	
  console.log('show loading');
  $('.loading-spinner').show();
  $('.container').hide();
  $('.container').empty();
}

var hideLoading = function() {
  console.log('hide loading');
  $('.container').imagesLoaded(function() {
      setupMasonry();
      $('.container').fadeIn('slow');
      $('.container').masonry('reload');
      $('.loading-spinner').hide();
    });
}

var main = function() {
  $('.search-box').keypress(function(e) {
	  
    if (e.which == ENTER_KEY && !isLoadingNow) {
		isLoadingNow = true;
		showLoading()
		var query = $('.search-box').val()
		if(query.length > 0) {
			search(query);
		}
	
	  }
  });

  $('.loading-spinner').append(darkSpinner.el);

  search($('.search-box').attr('placeholder'));
  $('.search-box').focus();
};
main();