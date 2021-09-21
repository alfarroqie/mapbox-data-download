import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import kabupatenGeojson from '../data/kabupaten.geojson'
import dataDownload from '../data/data-download.json'

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hvY29vcmVvIiwiYSI6ImNrdDgxZG5ibzB4dGkycGxqZmU0YnNuMzEifQ.smJZQqkcsSI_Su9WCxbQvQ'

export default function MapDataDownload() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(110.7043);
  const [lat, setLat] = useState(-7.0525);
  const [zoom, setZoom] = useState(6.18);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/light-v10',
    center: [lng, lat],
    zoom: zoom
    });
  });

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('move', () => {
    setLng(map.current.getCenter().lng.toFixed(4));
    setLat(map.current.getCenter().lat.toFixed(4));
    setZoom(map.current.getZoom().toFixed(2));
    });
  });
  //polygon
  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('load', () => {
      map.current.addSource('kabupaten', {
        'type': 'geojson',
        'data': kabupatenGeojson,
        'promoteId': 'KABUPATEN'
      });
      //mapping data download to feature state
      dataDownload.forEach((data) => {
        map.current.setFeatureState({
          source: 'kabupaten',
          id: data.location,
        },
        {
          AVG_DOWNLOAD: data.avg_download_throughput
        })
      });
      //fill cities layer
      map.current.addLayer({
        'id': 'fill-cities',
        'type': 'fill',
        'source': 'kabupaten', // reference the data source
        'layout': {},
        'paint': {
          'fill-color': [
            'case',
            ['>', ['feature-state', 'AVG_DOWNLOAD'], 15000],
            '#B71C1C',
            ['>=', ['feature-state', 'AVG_DOWNLOAD'], 10000],
            '#EF5350',
            ['>=', ['feature-state', 'AVG_DOWNLOAD'], 5000],
            '#FFCDD2',
            ['>=', ['feature-state', 'AVG_DOWNLOAD'], 0],
            '#FFEBEE',
            '#FFFFFF'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.7
            ]
        }
      });
      //outline cities layer
      map.current.addLayer({
        'id': 'outline-cities',
        'type': 'line',
        'source': 'kabupaten',
        'layout': {},
        'paint': {
        'line-color': '#000',
        'line-width': 0.5
        }
      });
      map.current.addLayer({
        'id': 'name-of-cities',
        'type': 'symbol',
        'source': 'kabupaten',
        'layout': {
          'text-field': [
            'format',
            ['upcase', ['get', 'KABUPATEN']],
            { 'font-scale': 0.7 },
          ],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold']
          }
        });
    });
  });
  //HOVER
  useEffect(() => {
    if(!map.current) return;
     var hoverKabId = null;
     map.current.on('mousemove', 'fill-cities', (e) => {
       if (e.features.length > 0) {
         if (hoverKabId !== null) {
           map.current.setFeatureState(
           { source: 'kabupaten', id: hoverKabId },
           { hover: false }
           );
         }
         hoverKabId = e.features[0].id;
         map.current.setFeatureState(
         { source: 'kabupaten', id: hoverKabId },
         { hover: true }
         );
       }
     });
     // When the mouse leaves the state-fill layer, update the feature state of the
     // previously hovered feature.
     map.current.on('mouseleave', 'fill-cities', () => {
       if (hoverKabId !== null) {
         map.current.setFeatureState(
         { source: 'kabupaten', id: hoverKabId },
         { hover: false }
         );
       }
       hoverKabId = null;
     });
  })
  //POPUP
  useEffect(() => {
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    //hover for popup
    map.current.on('mousemove', 'fill-cities', (e) => {
      // Change the cursor style as a UI indicator.
      map.current.getCanvas().style.cursor = 'pointer';
      
      // Copy coordinates array.
      const { lat, lng } = e.lngLat;
      // const coordinates = e.features[0].geometry.coordinates.slice();
      const region = e.features[0].properties.REGION;
      const kabupaten = e.features[0].properties.KABUPATEN;
      const avgDownload = e.features[0].state.AVG_DOWNLOAD;
      // // Ensure that if the map is zoomed out such that multiple
      // // copies of the feature are visible, the popup appears
      // // over the copy being pointed to.
      // while (Math.abs(e.lngLat.lng - coordinates) > 180) {
      //   coordinates += e.lngLat.lng > coordinates ? 360 : -360;
      // }
      
      // Populate the popup and set its coordinates
      // based on the feature found.
      popup.setLngLat([lng, lat]).setHTML(
        `
          <h1>REGION: <b>${region} </b></h1>
          <h1> KABUPATEN: <b>${kabupaten}</b></h1>
          <h1> AVERAGE DOWNLOAD: <b>${avgDownload}</b></h1>
        `
        ).addTo(map.current);
    });
    map.current.on('mouseleave', 'fill-cities', () => {
      map.current.getCanvas().style.cursor = '';
      popup.remove();
    });
  })
  

  return (
  <div>
    <div className="map-info">
      Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
    </div>
    <div ref={mapContainer} className="map-container" />
  </div>
  );
};