var userMarker;
var map;

var zoomed = false;

var programmaticMove = false;

var search = false;

var requestNumber = 1;


var venues = undefined;
var reports = undefined;
var locationReports = undefined;

$(document).ready(() => {
    $("#map").height(window.innerHeight);
    $("#search-area").height(window.innerHeight);
    $("#search-area").hide();

    $("#quickSearch").css("marginTop", $("#search-div").height() + 15 + 25); // 15 + 25 = paddingBottom + paddingTop of search-div

    map = L.map("map", {
        zoomControl: false
    }).setView([37, -122], 5);

    createLocateButton();
    setupAnimateCSS();

    map.addControl(L.control.zoom({position: "bottomright"}));

    L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYXNpbmdoYW5pIiwiYSI6ImNpaDV0cXpzajAzcmN0Z20yNzZ2OGtpM3cifQ.RZcxkKjXBBwsXP-BrUjaiQ", {
        maxZoom: 18
    }).addTo(map);

    if (navigator.geolocation) {
        options = {
            enableHighAccuracy: true,
            timeout: 1000,
            maximumAge: 0
        };

        navigator.geolocation.watchPosition(showLocation, console.error, options);
    }

    L.control.locate({position: "bottomleft"}).addTo(map);


    map.on("zoomstart", () => {
        if(!programmaticMove) {
            zoomed = false;
        }
    });

    map.on("dragstart", () => {
        if(!programmaticMove) {
            zoomed = false;
        }
    });


    $("#quick-food").click($("#search-box").val.bind($("#search-box"), "Food"));
    $("#quick-gas").click($("#search-box").val.bind($("#search-box"), "Gas Station"));
    $("#quick-coffee").click($("#search-box").val.bind($("#search-box"), "Coffee"));
    $("#quick-grocery").click($("#search-box").val.bind($("#search-box"), "Grocery"));
    $("#quick-hospital").click($("#search-box").val.bind($("#search-box"), "Hospital"));
    $("#quick-lodging").click($("#search-box").val.bind($("#search-box"), "Lodging"));

    $(".quick-icon").click(setTimeout.bind(undefined, () => {
        $("#search-box").triggerHandler("paste");
    }, 500));

    $("#search-box").on("input propertychange paste", () => {
        let search = $("#search-box").val();
        console.log(search);
        requestNumber++;
        venues = undefined;
        reports = undefined;
        locationReports = undefined;

        $.post("/api/venues/search", {lat: userMarker.getLatLng().lat, long: userMarker.getLatLng().lng, searchstring: search}, ((reqNumber, body) => {
            if(reqNumber === requestNumber) { // Check if latest request
                venues = body;
                if(venues && reports && locationReports) updateSearchResults();
            }
        }).bind(undefined, requestNumber));

        $.get("/api/Reports", ((reqNumber, body) => {
            if(reqNumber === requestNumber) { // Check if latest request
                reports = body;
                if(venues && reports && locationReports) updateSearchResults();
            }
        }).bind(undefined, requestNumber));

        $.get("/api/LocationReports", ((reqNumber, body) => {
            if(reqNumber === requestNumber) { // Check if latest request
                locationReports = body;
                if(venues && reports && locationReports) updateSearchResults();
            }
        }).bind(undefined, requestNumber));
    });

    $("#search-box").focus(() => {
        if(!search) {
            search = true;
            $("#back-button").css("left", "0%").animate({"left": "5%"}, 200);
            $("#search-box").animate({width: "74%"}, 400);
            $("#search-area").show("blind", {direction: "down"}, 400);
            $("#search-div").css("background-color", "#F6F6F6");

            let startTime = 300;
            let seperationTime = 50;
            setTimeout(() => $("#quick-food").css("visibility", "visible").animateCss("bounceIn"), startTime + 0);
            setTimeout(() => $("#quick-gas").css("visibility", "visible").animateCss("bounceIn"), startTime + 1 * seperationTime);
            setTimeout(() => $("#quick-coffee").css("visibility", "visible").animateCss("bounceIn"), startTime + 2 * seperationTime);
            setTimeout(() => $("#quick-grocery").css("visibility", "visible").animateCss("bounceIn"), startTime + 3 * seperationTime);
            setTimeout(() => $("#quick-hospital").css("visibility", "visible").animateCss("bounceIn"), startTime + 4 * seperationTime);
            setTimeout(() => $("#quick-lodging").css("visibility", "visible").animateCss("bounceIn"), startTime + 5 * seperationTime);

            // Incase functions are out of order
            setTimeout(() => $(".quick-icon").css("visibility", "visible"), startTime + 600);
            setTimeout(() => $(".quick-icon").css("visibility", "visible"), startTime + 700);
        }
    });

    $("#back-button").click(() => {
        if(search) {
            search = false;
            $("#back-button").animate({"left": "0%"}, 100, () => {
                $("#back-button").css("left", "-15%");
            });
            $("#search-box").animate({width: "90%"}, 400);
            $("#search-area").hide("blind", {direction: "down"}, 400);
            $("#search-div").css("background-color", "transparent");

            setTimeout(() => $(".quick-icon").css("visibility", "hidden"), 1000)

            $("#search-box").val("");
        }
    })
});

function showLocation(location) {
    console.log(location.coords);
    let coords = [location.coords.latitude, location.coords.longitude];
    if(!userMarker) {
        userMarker = L.marker(coords).addTo(map);
        programmaticMove = true;
        map.setZoom(16);
        map.panTo(coords);
        programmaticMove = false;
        zoomed = true;
    } else {
        userMarker.setLatLng(coords);
        if(zoomed) {
            programmaticMove = true;
            map.flyTo(coords);
            programmaticMove = false;
        }
    }
}

function createLocateButton() {
    L.Control.Locate = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");

            container.style.backgroundColor = "white";
            container.style.width = "40px";
            container.style.height = "40px";
            container.style.marginBottom = "20px";

            // TODO Make locate & zoom buttons rounded

            container.style.backgroundImage = "url(my_location.svg)";
            container.style.backgroundSize = "25px 25px";
            container.style.backgroundRepeat = "no-repeat";
            container.style.backgroundPosition = "center center";

            container.onclick = function() {
                zoomed = true;

                programmaticMove = true;
                map.flyTo(userMarker.getLatLng(), 16);
                programmaticMove = false;
            };

            return container;
        }
    });

    L.control.locate = (opts) => new L.Control.Locate(opts);
}

function setupAnimateCSS() {
    $.fn.extend({
        animateCss: function (animationName) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            this.addClass('animated ' + animationName).on(animationEnd, function() {
                $(this).removeClass('animated ' + animationName);
            });
            return this;
        }
    });
}

function updateSearchResults() {
    console.log(venues);
    console.log(reports);
    console.log(locationReports);
}












