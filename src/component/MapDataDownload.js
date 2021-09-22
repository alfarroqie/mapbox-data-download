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
  //INIT MAP
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
  //POLYGON
  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('load', async () => {
      //MAPPING DATA DOWNLOAD TO FEATURE GEOJSON
      const dataGeojson = await (await fetch(kabupatenGeojson)).json();
      dataGeojson.features.forEach((feature) => {
        const dataDownloadKabupaten = dataDownload.find(item => item.location === feature.properties.KABUPATEN); //find data download location matching with feature kabupaten
        if (dataDownloadKabupaten === undefined || dataDownloadKabupaten.avg_download_throughput === null){ //handle null and not found data avg download
          feature.properties.AVG_DOWNLOAD = 0;
        } else {
          feature.properties.AVG_DOWNLOAD = (Math.round(dataDownloadKabupaten.avg_download_throughput * 100)/100);
        }
      });
      // // MAPPING DATA DOWNLOAD (namun karena tidak semua data di geojson terdapat data downloadnya, maka terdapat warning ketika nampilkan warna polygonnya)
      // dataDownload.forEach((data) => {
      //   let index = dataGeojson.features.findIndex(f => f.properties.KABUPATEN === data.location);  //find index in features geojson with data download location
      //   if (data.avg_download_throughput === null){
      //     dataGeojson.features[index].properties.AVG_DOWNLOAD = 0; //added avg download properties  
      //   } else {
      //     dataGeojson.features[index].properties.AVG_DOWNLOAD = (Math.round(data.avg_download_throughput * 100)/100); //added avg download properties after rounded 2 decimal
      //   }
      // })

      //ADD GEOJSON SOURCE TO MAP
      map.current.addSource('kabupaten', {
        'type': 'geojson',
        'data': dataGeojson,
        'promoteId': 'ID_KAB' //untuk dapat memakai setFeatureState pada hover
      });
      //LAYER FILL-CITIES (kabupaten)
      map.current.addLayer({
        'id': 'fill-cities',
        'type': 'fill',
        'source': 'kabupaten',
        'layout': {},
        'paint': {
          'fill-color': [
            'case',
            ['>', ['get', 'AVG_DOWNLOAD'], 15000],
            '#B71C1C',
            ['>=', ['get', 'AVG_DOWNLOAD'], 10000],
            '#EF5350',
            ['>=', ['get', 'AVG_DOWNLOAD'], 5000],
            '#FFCDD2',
            ['>=', ['get', 'AVG_DOWNLOAD'], 0],
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
      //LAYER OUTLINE-CITIES (kabupaten)
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
      //LAYER NAME-CITIES (KABUPATEN)
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
  //HOVER  AND POPUP
  useEffect(() => {
    if(!map.current) return;
    //INIT POPUP
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    var hoverKabId = null;
    map.current.on('mousemove', 'fill-cities', (e) => {
      //HOVER EFFECT
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
      //POPUP EFFECT
      map.current.getCanvas().style.cursor = 'pointer';
      const { lat, lng } = e.lngLat;
      const region = e.features[0].properties.REGION;
      const kabupaten = e.features[0].properties.KABUPATEN;
      const avgDownload = e.features[0].properties.AVG_DOWNLOAD;
      // SET CONTENT POPUP
      popup.setLngLat([lng, lat]).setHTML(
        `
          <h1>REGION <br><b>${region}</b></h1>
          <h1> KABUPATEN <br><b>${kabupaten}</b></h1>
          <h1> AVERAGE DOWNLOAD <br><b>${avgDownload}</b></h1>
        `
        ).addTo(map.current);
    });
    map.current.on('mouseleave', 'fill-cities', () => {
      //HOVER EFFECT
      if (hoverKabId !== null) {
        map.current.setFeatureState(
        { source: 'kabupaten', id: hoverKabId },
        { hover: false }
        );
      }
      hoverKabId = null;
      //POPUP EFFECT
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