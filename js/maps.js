var map = null;
var marker = null;
var circle = null;
var geoXml = null;

var buildingMap = null;

var finishedLoaded = false;

$(window).load(function(){
	window.setTimeout(hideSplashScreen, 2500);
	
	$("#checkbox-v-2a").click(function(){
		if(finishedLoaded){
			if(!$("#checkbox-v-2a").is(":checked"))
				geoXml.hideDocument(geoXml.docs[0]);
			else
				geoXml.showDocument(geoXml.docs[0]);
		}
	});
	
	$("#checkbox-v-2b").click(function(){
		if(finishedLoaded){
			if(!$("#checkbox-v-2b").is(":checked"))
				geoXml.hideDocument(geoXml.docs[1]);
			else
				geoXml.showDocument(geoXml.docs[1]);
		}
	});
	
	$("#checkbox-v-2c").click(function(){
		if(finishedLoaded){
			if(!$("#checkbox-v-2c").is(":checked"))
				geoXml.hideDocument(geoXml.docs[2]);
			else
				geoXml.showDocument(geoXml.docs[2]);
		}
	});
	
	$("#checkbox-v-2d").click(function(){
		if(finishedLoaded){
			if(!$("#checkbox-v-2d").is(":checked"))
				geoXml.hideDocument(geoXml.docs[3]);
			else
				geoXml.showDocument(geoXml.docs[3]);
		}
	});
	
	$("#checkbox-v-2e").click(function(){
		if(finishedLoaded){
			if(!$("#checkbox-v-2e").is(":checked"))
				geoXml.hideDocument(geoXml.docs[4]);
			else
				geoXml.showDocument(geoXml.docs[4]);
		}
	});
	
	var tabImages = ['images/batiment/Carmes-A17.JPG', 'images/batiment/Carmes-Forum.JPG', 'images/batiment/Carmes-O10.JPG', 'images/batiment/Carmes-O12.JPG', 'images/batiment/Carmes-T15.JPG'];
	for(img in tabImages){
		$('<img>')[0].src = img;
	}
	
});

function hideSplashScreen(){
	$("#splashScreen").fadeOut();
}

function initializeMap(){
	var mapCanvas = document.getElementById('map');
    var mapOptions = {
		center: new google.maps.LatLng(45.783763, 3.091382),
		zoom: 16,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		streetViewControl: false,
		mapTypeControl: false,
		panControl: false,
		zoomControl: false
    };
    map = new google.maps.Map(mapCanvas, mapOptions);
	google.maps.event.addListener(map, 'click', function(){
		$('#searchbar').blur();
	});
	geoXml = new geoXML3.parser({
		map: map,
		singleInfoWindow: true,
		processStyles: true,
		zoom: false
	});
	geoXml.parse(['kml/buildings.kml', 'kml/parkings.kml', 'kml/POI.kml', 'kml/buildingEntrance.kml', 'kml/siteEntrance.kml']);
	google.maps.event.addListener(geoXml, 'parsed', fetchPolygons);
	
	// var kmlLayer = new google.maps.KmlLayer({
		// url: 'http://mapsengine.google.com/map/kml?mid=zrYJFEl6K60k.kzHCyx8rtdfY',
		// preserveViewport: true
	// });
	// kmlLayer.setMap(map);
	
	if(navigator.geolocation) {
		navigator.geolocation.watchPosition(displayPosition);
	}
	
	addOverlay();
	
	map.setZoom(16);
}

function fetchPolygons(){
	var placemarks = geoXml.docs[0].placemarks;
	placemarks = placemarks.concat(geoXml.docs[1].placemarks);
	placemarks = placemarks.concat(geoXml.docs[2].placemarks);
	buildingMap = {};
	for(var i = 0; i < placemarks.length;i++)
		buildingMap[placemarks[i].name] = placemarks[i];
		
	geoXml.hideDocument(geoXml.docs[3]);
	geoXml.hideDocument(geoXml.docs[4]);
	
		
	initializeSearchBar();
	map.setZoom(16);
		
	finishedLoaded = true;
}

function initializeSearchBar(){
	var states = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		// `states` is an array of state names defined in "The Basics"
		local: $.map(buildingMap, function(building) { return { value: building.name, site: building.site, type: building.type, polygon: ('polygon' in  building) ? building.polygon : building.marker}; })
	});

    states.initialize();

    $('#searchbar').typeahead({
		hint: true,
		highlight: true,
		minLength: 1, 
		autoselect: true
    },
    {
		name: 'states',
		displayKey: 'value',
		// `ttAdapter` wraps the suggestion engine in an adapter that
		// is compatible with the typeahead jQuery plugin
		source: states.ttAdapter(),
		templates: {
		empty: [
		'<div class="empty-message">',
		'Unable to find any location that match the current query',
		'</div>'
		].join('\n'),
		suggestion: Handlebars.compile('<p><strong>{{value}}</strong> - {{site}}</p>')
	}
    });
	$('#searchbar').bind('typeahead:selected', function(obj, datum, name) {
		var center = null;
		if('position' in datum.polygon)//If it's a point
			center = datum.polygon.position;
		else{
			var bounds = new google.maps.LatLngBounds();
			for (i = 0; i < datum.polygon.getPath().length; i++) {
				bounds.extend(datum.polygon.getPath().getAt(i));
			}

			center = bounds.getCenter();
		}
		google.maps.event.trigger(datum.polygon, 'click', {
			latLng: center
		});
		map.setZoom(17);
		map.panTo(center);
		$('#searchbar').blur();
	});
}

function displayPosition(position){
			var lat = position.coords.latitude;
			var lont = position.coords.longitude;
			var pos = new google.maps.LatLng(lat, lont);
			if(marker == null){
				marker = new google.maps.Marker({
					clickable: false,
					icon: new google.maps.MarkerImage('http://maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
																	new google.maps.Size(22,22),
																	new google.maps.Point(0,18),
																	new google.maps.Point(11,11)),
					shadow: null,
					zIndex: 1,
					map: map
				});
				marker.setPosition(pos);
				map.setCenter(pos);
				circle = new google.maps.Circle({
					clickable: false,
					center: pos,
					radius: position.coords.accuracy,
					map: map,
					fillColor: '#00DBFF',
					fillOpacity: 0.2,
					strokeColor: '#00DBFF',
					strokeOpacity: 1.0,
					zIndex: -1
				});
			}
			else{
				marker.setPosition(pos);
				circle.setRadius(position.coords.accuracy);
				circle.setCenter(pos);
			}
}

var overlay;
ImageOverlay.prototype = new google.maps.OverlayView();

// Initialize the map and the custom overlay.

function addOverlay() {
  var swBound = new google.maps.LatLng(45.78145162312724,3.083603252050807);
  var neBound = new google.maps.LatLng(45.78790843933599,3.09990035402529);
  var bounds = new google.maps.LatLngBounds(swBound, neBound);

  var srcImage = 'images/overlay-carmes.png';
  overlay = new ImageOverlay(bounds, srcImage, map);
}

/** @constructor */
function ImageOverlay(bounds, image, map) {

  // Initialize all properties.
  this.bounds_ = bounds;
  this.image_ = image;
  this.map_ = map;

  // Define a property to hold the image's div. We'll
  // actually create this div upon receipt of the onAdd()
  // method so we'll leave it null for now.
  this.div_ = null;

  // Explicitly call setMap on this overlay.
  this.setMap(map);
}

/**
 * onAdd is called when the map's panes are ready and the overlay has been
 * added to the map.
 */
ImageOverlay.prototype.onAdd = function() {

  var div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';

  // Create the img element and attach it to the div.
  var img = document.createElement('img');
  img.src = this.image_;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.position = 'absolute';
  div.appendChild(img);

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.overlayLayer.appendChild(div);
};

ImageOverlay.prototype.draw = function() {

  // We use the south-west and north-east
  // coordinates of the overlay to peg it to the correct position and size.
  // To do this, we need to retrieve the projection from the overlay.
  var overlayProjection = this.getProjection();

  // Retrieve the south-west and north-east coordinates of this overlay
  // in LatLngs and convert them to pixel coordinates.
  // We'll use these coordinates to resize the div.
  var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
  var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

  // Resize the image's div to fit the indicated dimensions.
  var div = this.div_;
  div.style.left = sw.x + 'px';
  div.style.top = ne.y + 'px';
  div.style.width = (ne.x - sw.x) + 'px';
  div.style.height = (sw.y - ne.y) + 'px';
};

function relocate() {
	if (navigator.geolocation) {
		 navigator.geolocation.getCurrentPosition(function (position) {
			 initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			 map.setCenter(initialLocation);
			 $.mobile.loading( "hide" );
		 });
	}
}

$( document ).on( "click", "#findmyposition", function() {
    var $this = $( this ),
        theme = $this.jqmData( "theme" ) || $.mobile.loader.prototype.options.theme,
        msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
        textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
        textonly = !!$this.jqmData( "textonly" );
        html = $this.jqmData( "html" ) || "";
    $.mobile.loading( "show", {
            text: msgText,
            textVisible: textVisible,
            theme: theme,
            textonly: textonly,
            html: html
    });
});

google.maps.event.addDomListener(window, 'load', initializeMap);