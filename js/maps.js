var map = null;
var marker = null;
var circle = null;
var geoXml = null;

var buildingMap = null;

var finishedLoaded = false;

var loadDelay = 25;

$(window).load(function(){
	window.setTimeout(hideSplashScreen, loadDelay * 100);
	
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

var labels = [];

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
	google.maps.event.addListener(map, "zoom_changed", function() {
		var hide = (map.getZoom() < 16);
		for(var i = 0; i < labels.length; i++) {
			if(hide)
				labels[i].setMap(null);
			else
				labels[i].setMap(map);
		}
	});
	// var kmlLayer = new google.maps.KmlLayer({
		// url: 'http://mapsengine.google.com/map/kml?mid=zrYJFEl6K60k.kzHCyx8rtdfY',
		// preserveViewport: true
	// });
	// kmlLayer.setMap(map);
	
	if(navigator.geolocation) {
		navigator.geolocation.watchPosition(displayPosition);
	}
	
	
	map.setZoom(16);
}

function fetchPolygons(){
	var placemarks = geoXml.docs[0].placemarks;
	placemarks = placemarks.concat(geoXml.docs[1].placemarks);
	placemarks = placemarks.concat(geoXml.docs[2].placemarks);
	buildingMap = {};
	for(var i = 0; i < placemarks.length;i++)
		buildingMap[placemarks[i].id] = placemarks[i];
		
		
	placemarks = geoXml.docs[0].placemarks;
	placemarks = placemarks.concat(geoXml.docs[1].placemarks);
	for(var i = 0; i < placemarks.length;i++){
		var pl = placemarks[i];
		var infoBox = new InfoBox({
			content: pl.name, 
			boxStyle: {
				textAlign: "center",
				fontSize: "8pt",
				width: "50px"
			},
			disableAutoPan: true,
			pixelOffset: new google.maps.Size(-25, -10),
			position: pl.polygon.bounds.getCenter(),
			closeBoxURL: "",
			isHidden: false,
			enableEventPropagation: true
		});
		labels.push(infoBox);
		infoBox.open(map);
	}
		
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