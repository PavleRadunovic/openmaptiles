/**
 * loading the necessary methods from the 'ol' library to create an OpenLayers interactive map
 */
import { applyStyle } from 'ol-mapbox-style';
import 'ol/ol.css';
import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import { Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { VectorTile, Vector as VectorLayer } from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke } from 'ol/style'


/**
 * Load the necessary modules to create a Leaflet interactive map
 */
import "mapbox-gl-leaflet";
const L = require('leaflet');

/**
 * the variable 'chooseMap' is initialized to the value 'openlayers', which indicates that the openlayers map will be rendered initially. The variable changes value when the user selects the Leaflet map view and vice versa.
 */
let chooseMap = 'openlayers';

/**
 * Assign a callback function to an event click and bind to a button that has a specific id value. When the user selects a different folder view (using the openlayers or leaflet library), the two callback functions are activated.
 */
document.querySelector('#openlayers').addEventListener('click', () => {
    chooseMap = 'openlayers';
    changeMap(chooseMap);
});

document.querySelector('#leaflet').addEventListener('click', () => {
    chooseMap = 'leaflet';
    changeMap(chooseMap);
});



/**
 * Initialization of certain variables
 */

// openlayers
let lineSource;
let vectorLayerOpenLayers;
let vectorLayerLeaflet;
let fetchStreet = [];
let timer;
// leaflet
let extent;
let point1;
let point2;


/**
 * Creating variables that point to specific html tags
 */
const streets = document.getElementById('streets');
const mapOpenLayersDiv = document.getElementById('mapOpenLayers');
const mapLeafletDiv = document.getElementById('mapLeaflet');


/*******************************************************
 *********************  OpenLayers  ********************
 *******************************************************/

/**
 * creating a vector tile and assigning source
 */
const layer = new VectorTile({
    declutter: true,
    minZoom: 6
});
applyStyle(layer, 'http://localhost:6002/basicStyle');

/**
 * create a style for the selected street for full text search streets
 */
const styleFoundedStret = new Style({
    stroke: new Stroke({
        color: 'red',
        width: 3
    })
});

/**
 * creating a raster layer
 */
const raster = new TileLayer({
    minZoom: 6,
    source: new XYZ({
        url: 'http://localhost:8201/styles/basic-preview/{z}/{x}/{y}.png',
    }),
    visible: false
});

/**
 * creating an instance of the OpenLayers map
 */
const mapOpenLayers = new Map({
    target: 'mapOpenLayers',
    layers: [],
    view: new View({
        /**
         * center of the map corresponds to longitude and latitude (Serbia: 21, 44, Switzerland: 7, 47)
         */
        center: fromLonLat([21, 44]),
        zoom: 7,
    }),
});

/**
 * Add created layers to the map
 */
mapOpenLayers.addLayer(raster);
mapOpenLayers.addLayer(layer);



/*******************************************************
 *********************  Leaflet  ***********************
 *******************************************************/

/**
 * Creating vector layers and raster layer
 */
const baseLayerLeaflet = L.mapboxGL({
    /**
     * public token on MapBoxGL
     */
    accessToken: 'pk.eyJ1Ijoic3RlZmFuOTk1IiwiYSI6ImNremNnZzFuZjAwNTIyb3A4ZDZ5YTMzYzYifQ.Eciu6UOyaPNQsBJJyRJrNQ',
    style: 'http://localhost:6002/basicStyle'
});

const rasterLayerLeaflet = L.tileLayer('http://localhost:8201/styles/basic-preview/{z}/{x}/{y}.png');

const placeLayerLeaflet = L.mapboxGL({
    accessToken: 'pk.eyJ1Ijoic3RlZmFuOTk1IiwiYSI6ImNremNnZzFuZjAwNTIyb3A4ZDZ5YTMzYzYifQ.Eciu6UOyaPNQsBJJyRJrNQ',
    style: 'http://localhost:6002/placesStyle'
});

/**
 * Create a Leaflet map and assign an initial view
 */
const mapLeaflet = L.map('mapLeaflet');
mapLeaflet.setView(new L.LatLng(47, 7), 7);
mapLeaflet.options.minZoom = 7;

/**
 * Assign the created layer to the map
 */
baseLayerLeaflet.addTo(mapLeaflet);


/**
 * 
 * @param {string} chMap
 * 
 * cMap contains the following values: openlayers or leaflet
 * 
 * The function checks the user's selection of the map type and depending on the selection, displays or does not display the selected map view
 */
function changeMap(chMap) {
    if (chMap === 'openlayers') {
        mapLeafletDiv.style.display = 'none';
        mapOpenLayersDiv.style.display = 'block';
    } else if (chMap === 'leaflet') {
        mapOpenLayersDiv.style.display = 'none';
        mapLeafletDiv.style.display = 'block';
    }
}


/**
 * 
 * @param {json} el 
 * 
 * A function that takes a JSON element at the input and forms a div element from it which contains information about certain streets obtained as a result of a full text search
 */
function createDivStreet(el) {
    const div_tag = document.createElement('div');
    div_tag.className = 'selectedStreet';
    const p1_tag = document.createElement('p');
    p1_tag.style.color = '#5e5a5a';
    p1_tag.style.fontWeight = 'bold';
    const p2_tag = document.createElement('p');
    p2_tag.style.color = '#8d9191'
    div_tag.dataset.osm_id = el.osm_id;
    if (el.street_name_en === null && el.street_name === null) {
        p1_tag.innerHTML = '-';
    } else if (el.street_name_en === null && el.street_name != null) {
        p1_tag.innerHTML = el.street_name;
    } else {
        p1_tag.innerHTML = el.street_name_en;
    }

    p2_tag.innerHTML = el.name;
    div_tag.appendChild(p1_tag);
    div_tag.appendChild(p2_tag);
    streets.append(div_tag);
}

/**
 * 
 * @returns 
 * 
 * A function that takes a user input to search the streets and send request to the backend. The response that comes is iteratted and create separate div element with the contents of the printout.
 * a click event is added to each div element (zoomToStreet function)
 */
function searchStreet() {
    streets.innerHTML = '';
    const search = document.querySelector('input').value;
    if (search === '' || search === ' ') {
        streets.style.display = 'none';
        return;
    }

    clearTimeout(timer);

    timer = setTimeout(() => {
        fetch(`http://localhost:6002/street?search_text=${search}`)
            .then(res => {
                return res.json();
            })
            .then(data => {
                if (data.length === 0) {
                    streets.style.display = 'none';
                } else {
                    streets.style.display = 'block';
                }
                fetchStreet = data
                poz = 0;
                for (const el of data) {
                    poz++;
                    createDivStreet(el);
                    if (poz === 10) {
                        break;
                    }
                }
                $('#streets').on('click', 'div', zoomToStreet);
            });
    }, 500);
}

/**
 * 
 * @param {*} event 
 * 
 * Function that zooms to its extent (minimum rectangle) for the selected street
 * Forms a GeoJSON object based on the coordinates of the selected street and assigns it a different style (the street turns red)
 */
function zoomToStreet(event) {
    const osm_id = event.currentTarget.dataset.osm_id;
    $.each(fetchStreet, function (key, value) {
        if (parseInt(value.osm_id) === parseInt(osm_id)) {

            if (chooseMap === 'openlayers') {
                mapOpenLayers.removeLayer(vectorLayerOpenLayers);

                lineSource = new VectorSource({
                    features: new GeoJSON().readFeatures(JSON.parse(value.geom_json))
                });

                vectorLayerOpenLayers = new VectorLayer({
                    source: lineSource,
                    style: styleFoundedStret
                });

                mapOpenLayers.addLayer(vectorLayerOpenLayers);

                xmin = value.x_min;
                ymin = value.y_min;
                xmax = value.x_max;
                ymax = value.y_max;
                var myExtent = [xmin, ymin, xmax, ymax];
                mapOpenLayers.getView().fit(myExtent, mapOpenLayers.getSize());
            } else if (chooseMap === 'leaflet') {
                try {
                    mapLeaflet.removeLayer(vectorLayerLeaflet);
                } catch (error) { }

                vectorLayerLeaflet = L.geoJSON(JSON.parse(value.geom_latlng_json), {
                    style: {
                        color: '#FF0000',
                        weight: 5
                    }
                }).bindPopup(function (layer) {
                    return layer.feature.properties.description;
                });
                vectorLayerLeaflet.addTo(mapLeaflet);

                existsExtent = vectorLayerLeaflet.getBounds();
                point1 = L.latLng(value.lat_min, value.lng_min);
                point2 = L.latLng(value.lat_max, value.lng_max);
                extent = L.latLngBounds(point1, point2);
                mapLeaflet.fitBounds(extent);
            }

            return;
        }
    });
    document.getElementById('streets').style.display = 'none';
}


/**
 * Assigning certain callback functions to certain div elements where some of them change the display of raster or vector tiles, change the visual style
 */
document.querySelector('input').addEventListener('keyup', searchStreet);

document.querySelector('#raster').addEventListener('click', () => {
    if (chooseMap === 'openlayers') {
        mapOpenLayers.getAllLayers()[0].setVisible(true);
        mapOpenLayers.getAllLayers()[1].setVisible(false);
    } else if (chooseMap === 'leaflet') {
        mapLeaflet.removeLayer(baseLayerLeaflet);
        mapLeaflet.removeLayer(placeLayerLeaflet);
        rasterLayerLeaflet.addTo(mapLeaflet);
    }
});
document.querySelector('#vector').addEventListener('click', () => {
    if (chooseMap === 'openlayers') {
        mapOpenLayers.getAllLayers()[0].setVisible(false);
        mapOpenLayers.getAllLayers()[1].setVisible(true);
    } else if (chooseMap === 'leaflet') {
        mapLeaflet.removeLayer(rasterLayerLeaflet);
        baseLayerLeaflet.addTo(mapLeaflet);
    }

});

document.querySelector('#basic-style').addEventListener('click', () => {
    if (chooseMap === 'openlayers') {
        applyStyle(layer, 'http://localhost:6002/basicStyle');
    } else if (chooseMap === 'leaflet') {
        mapLeaflet.removeLayer(placeLayerLeaflet);
        baseLayerLeaflet.addTo(mapLeaflet);
    }

});

document.querySelector('#places-style').addEventListener('click', () => {
    if (chooseMap === 'openlayers') {
        applyStyle(layer, 'http://localhost:6002/placesStyle');
    } else if (chooseMap === 'leaflet') {
        mapLeaflet.removeLayer(baseLayerLeaflet);
        placeLayerLeaflet.addTo(mapLeaflet);
    }

});

changeMap(chooseMap);
