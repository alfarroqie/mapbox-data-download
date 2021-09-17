import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

import kabupatenGeojson from '../data/kabupaten.geojson'

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hvY29vcmVvIiwiYSI6ImNrdDgxZG5ibzB4dGkycGxqZmU0YnNuMzEifQ.smJZQqkcsSI_Su9WCxbQvQ'

export default function MapDataDownload() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(117.5780);
  const [lat, setLat] = useState(-4.4580);
  const [zoom, setZoom] = useState(4.0);

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
        'data': kabupatenGeojson
      });
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
        'id': 'fill-cities',
        'type': 'fill',
        'source': 'kabupaten', // reference the data source
        'layout': {},
        'paint': {
          'fill-color': 'red', // red color fill
          'fill-opacity': 0.1
        },
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

  return (
  <div>
    <div className="map-info">
      Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
    </div>
    <div ref={mapContainer} className="map-container" />
  </div>
  );
};