import './App.css';
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import kabupatenGeojson from './data/kabupaten.geojson'
import provinsiGeojson from './data/provinsi.geojson'
import dataDownload from './data/data-download.json'

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hvY29vcmVvIiwiYSI6ImNrdDgxZG5ibzB4dGkycGxqZmU0YnNuMzEifQ.smJZQqkcsSI_Su9WCxbQvQ'

export default function MapDataDownload() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(114.2116);
  const [lat, setLat] = useState(-2.5759);
  const [zoom, setZoom] = useState(5);
  const zoomThreshold = 6
  //INIT MAP
  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/light-v10',
    center: [lng, lat],
    zoom: zoom,
    minZoom: 5,
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
  async function mappingDataDownload(){
    const dataprov = []
      const geojson = await (await fetch(kabupatenGeojson)).json();
      geojson.features.forEach((feature) => {
        const dataDownloadKabupaten = dataDownload.find(item => item.location === feature.properties.KABUPATEN); //find data download location matching with feature kabupaten
        //ADD DATA AVG DOWNLOAD
        if (dataDownloadKabupaten === undefined){
          feature.properties.COLOR_FILL = '#999999'
        } else if (dataDownloadKabupaten.avg_download_throughput === null) {
          feature.properties.AVG_DOWNLOAD = null
          dataprov.push({
            download: feature.properties.AVG_DOWNLOAD,
            idProv: feature.properties.ID_PROV
          })
        } else {
          feature.properties.AVG_DOWNLOAD = (Math.round(dataDownloadKabupaten.avg_download_throughput * 100)/100);
          dataprov.push({
            download: feature.properties.AVG_DOWNLOAD,
            idProv: feature.properties.ID_PROV
          })
        }
        //ADD DATA COLOR FILL
        if (feature.properties.AVG_DOWNLOAD === null) {
          feature.properties.COLOR_FILL = '#FFD966'
        } else if (feature.properties.AVG_DOWNLOAD > 15000){
          feature.properties.COLOR_FILL = '#B71C1C'
        } else if (feature.properties.AVG_DOWNLOAD >= 10000){
          feature.properties.COLOR_FILL = '#EF5350'
        } else if (feature.properties.AVG_DOWNLOAD >= 5000){
          feature.properties.COLOR_FILL = '#FFCDD2'
        } else if (feature.properties.AVG_DOWNLOAD >= 0){
          feature.properties.COLOR_FILL = '#FFEBEE'
        }
      });

      //calculate data download provinsi
      const dataDownloadProv=[];
      dataprov.reduce(function(res,value) {
        if (!res[value.idProv]){
          res[value.idProv] = {idProv: value.idProv, download: 0};
          dataDownloadProv.push(res[value.idProv])
        }
        res[value.idProv].download += value.download
        return res;
      }, {})
      return {geojson,dataDownloadProv};
  }
  async function mappingDataDownloadProvinsi(){
      const geojson = await (await fetch(provinsiGeojson)).json();
      const dataProvinsi = (await mappingDataDownload()).dataDownloadProv

      geojson.features.forEach((feature) => {
        const match = dataProvinsi.find(item => item.idProv == feature.properties.id);
        if (match === undefined){
          feature.properties.DOWNLOAD = null
        } else {
          feature.properties.DOWNLOAD = match.download
        }

        if (feature.properties.DOWNLOAD === null) {
          feature.properties.COLOR_FILL = '#FFD966'
        } else if (feature.properties.DOWNLOAD > 150000){
          feature.properties.COLOR_FILL = '#B71C1C'
        } else if (feature.properties.DOWNLOAD >= 100000){
          feature.properties.COLOR_FILL = '#EF5350'
        } else if (feature.properties.DOWNLOAD >= 50000){
          feature.properties.COLOR_FILL = '#FFCDD2'
        } else if (feature.properties.DOWNLOAD >= 0){
          feature.properties.COLOR_FILL = '#FFEBEE'
        }
      });
    
      return {geojson};
  }
  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('load', async () => {
      const dataGeojson = (await mappingDataDownload()).geojson
      const geojsonProvinsi = (await mappingDataDownloadProvinsi()).geojson

      //ADD GEOJSON SOURCE TO MAP
      map.current.addSource('kabupaten', {
        'type': 'geojson',
        'data': dataGeojson,
        'promoteId': 'ID_KAB' //untuk dapat memakai setFeatureState pada hover
      });
      map.current.addSource('provinsi', {
        'type': 'geojson',
        'data': geojsonProvinsi,
        'promoteId': 'id' //untuk dapat memakai setFeatureState pada hover
      });
      //LAYER FILL-CITIES (kabupaten)
      map.current.addLayer({
        'id': 'fill-cities',
        'type': 'fill',
        'source': 'kabupaten',
        'minzoom': zoomThreshold,
        'layout': {},
        'paint': {
          'fill-color': ['get', 'COLOR_FILL'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.7
            ]
        }
      }, 'waterway-label');
      map.current.addLayer({
        'id': 'fill-prov',
        'type': 'fill',
        'source': 'provinsi',
        'maxzoom': zoomThreshold,
        'layout': {},
        'paint': {
          'fill-color': ['get', 'COLOR_FILL'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.7
            ]
        }
      }, 'waterway-label');
      //LAYER OUTLINE-CITIES (kabupaten)
      // map.current.addLayer({
      //   'id': 'outline-cities',
      //   'type': 'line',
      //   'source': 'kabupaten',
      //   'layout': {},
      //   'paint': {
      //   'line-color': '#000',
      //   'line-width': 0.5
      //   }
      // });
      // LEGEND FOR LAYERS COLOR INFORMATION
      const layers = [
        '0 - 5000',
        '5000 - 10000',
        '10000 - 15000',
        '> 15000',
        'Null',
        'No Data'
        ];
        const colors = [
        '#FFEBEE',
        '#FFCDD2',
        '#EF5350',
        '#B71C1C',
        '#FFD966',
        '#999999'
        ];
        // create legend
        const legend = document.getElementById('legend');
        layers.forEach((layer, i) => {
          const color = colors[i];
          const item = document.createElement('div');
          const key = document.createElement('span');
          key.className = 'legend-key';
          key.style.backgroundColor = color;
          
          const value = document.createElement('span');
          value.innerHTML = `${layer}`;
          item.appendChild(key);
          item.appendChild(value);
          legend.appendChild(item);
          legend.style.display = 'none'
        });  

        map.current.on('zoom', () => {
          if(map.current.getZoom() > zoomThreshold){
            legend.style.display = 'block'
            // legend2.style.display = 'none'
          } else {
            legend.style.display = 'none'
            // legend2.style.display = 'block'
          }
        })
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
      var avgDownload = e.features[0].properties.AVG_DOWNLOAD;
      if (avgDownload === undefined){
        avgDownload = "No Data";
      }
      // SET CONTENT POPUP
      popup.setLngLat([lng, lat]).setHTML(
        `
          <h3>REGION <br><b>${region}</b></h3>
          <h3> KABUPATEN <br><b>${kabupaten}</b></h3>
          <h3> AVERAGE DOWNLOAD <br><b>${avgDownload}</b></h3>
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
    <>
    <div>
      <div className="map-info">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      <div ref={mapContainer} className="map-container" />
      <div className="map-overlay" id="legend"></div>
    </div>
    </>
  );
};