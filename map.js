// array of locations
var fallMarkers = [{
    name: 'Benham Falls',
    lat: 43.5616,
    lng: -121.2442
}, {
    name: 'Bridal Veil Falls',
    lat: 45.3316,
    lng: -122.1049
}, {
    name: 'Celilo Falls',
    lat: 45.3859,
    lng: -120.5844
}, {
    name: 'Metlako Falls',
    lat: 45.6284506,
    lng: -121.898969
}, {
    name: 'Multnomah Falls',
    lat: 45.5762,
    lng: -122.1158
}, {
    name: 'Rainbow Falls',
    lat: 44.0753,
    lng: -122.0000
}, {
    name: 'Salt Creek Falls',
    lat: 43.61194,
    lng: -122.12861
}, {
    name: 'South Falls',
    lat: 44.8787331,
    lng: -122.65842
}, {
    name: 'White River Falls',
    lat: 45.2439,
    lng: -121.0972
}];
// declaring a variable that refer to the div that the map will be loaded into.
var mapCanvas = document.getElementById('map');

// initialize the map
var map;

function initMap() {

    // Creating an object that contains the properties we want our map to have.
    var mapOptions = {

        center: new google.maps.LatLng(44.6335, -121.1295),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        // disable zoom control
        disableDefaultUI: true,
        scrollwheel: false

    };

    //Calling the Google Map constructor, thereby initializing the map
    map = new google.maps.Map(mapCanvas, mapOptions);

    // activating viewModel 
    ko.applyBindings(new viewModel());
}

// Create alert if google maps failes to load
function googleError() {
    mapCanvas.innerHTML = '<div class="alert alert-danger" role="alert">Google Maps is not loading. Please refresh the page.</div>';
}

// model - place constructor
var place = function(data) {
    this.name = ko.observable(data.name);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.url = ko.observable();
    this.marker = ko.observable();
};

// ViewModel
var viewModel = function() {
    // refer to ViewModel scope/binding context
    var self = this;
    // Create an array of all places
    self.placeList = ko.observableArray([]);
    //Store each location data in the placeList array
    fallMarkers.forEach(function(placeItem) {
        self.placeList.push(new place(placeItem));
    });

    // Craete a global InfoWindow object that will be reused for all markers
    var infoWindow = new google.maps.InfoWindow({
        maxWidth: 200,
    });

    // Initialize marker
    var marker;
    self.placeList().forEach(function(placeItem) {

        // Create markers for each place and place them on map
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(placeItem.lat(), placeItem.lng()),
            map: map,
            animation: google.maps.Animation.DROP
        });

        // assigning marker value to its property
        placeItem.marker = marker;

        // Make AJAX request to Wikipedia
        var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + placeItem.name() + '&format=json';
        var wikiRequestTimeout = setTimeout(function() {
            $('.show-error').html('ERROR: Unable to obtain description from Wikipedia.');
        }, 1500);
        $.ajax({
            url: wikiUrl,
            dataType: 'jsonp',
            success: function(data) {
                placeItem.url(data[2][0]);
                clearTimeout(wikiRequestTimeout);
                var contentString = '<p><strong>' + placeItem.name() + '</p></strong><p>' + placeItem.url() + '</p>';
                // Bounce the marker when clicked and stop bounce if marker is bouncing when clicked
                function toggleBounce() {
                    if (placeItem.marker.getAnimation() !== null) {
                        placeItem.marker.setAnimation(null);
                    } else {
                        placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
                    }
                }

                // Bounce marker and show infoWindow when marker is clicked
                google.maps.event.addListener(placeItem.marker, 'click', function() {
                    toggleBounce();
                    // stop bouncing
                    setTimeout(toggleBounce, 1250);
                    // insert content into infoWindow
                    infoWindow.setContent(contentString);
                    infoWindow.open(map, this);
                    // center marker on map canvas
                    map.panTo(placeItem.marker.getPosition());
                });
            }
        });

    });

    // Activate the appropriate marker when the user clicks a list item
    self.showInfo = function(placeItem) {
        google.maps.event.trigger(placeItem.marker, 'click');
    };

    // Combine showInfo and selectedPlace function
    self.onClick = function(placeItem) {
        self.showInfo(placeItem);
        self.selectedPlace(placeItem);
    };

    // highlight selected place on click
    self.selectedPlace = ko.observable();
    self.select = function(placeItem) {
        // The event receives the current data as parameter
        self.selectedPlace(placeItem);
    };

    // *** Filter markers and key location list based on search input
    // Track and store user input in search form
    self.userInput = ko.observable('');
    self.visibleMarkers = ko.computed(function() {
        // close infoWindow if it is open before searching
        if (infoWindow) {
            infoWindow.close();
        }
        // Compare user input and marker names.
        // If user input can be found in the place name, place item remains visible
        // Remove all other markers not macthing user input.
        // change user input to lower case
        var searchInput = self.userInput().toLowerCase();
        return ko.utils.arrayFilter(self.placeList(), function(place) {
            if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
                place.marker.setVisible(true);
                return true;
            } else {
                place.marker.setVisible(false);
                return false;
            }
        });
    }, self);

}; // ViewModel