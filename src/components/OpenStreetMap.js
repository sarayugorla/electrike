import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * OpenStreetMap interactive viewer using Leaflet.js
 * Requires ZERO Google Maps API keys or paid services.
 * Renders on Android & iOS via react-native-webview, and falls back cleanly on Web.
 */
export default function OpenStreetMap({
  source,
  destination,
  currentLocation,
  routeCoordinates = [],
  stations = [],
  onStationPress,
  style,
}) {
  const webViewRef = useRef(null);

  // Generate self-contained HTML for Leaflet + OpenStreetMap
  const mapHtml = useMemo(() => {
    const coordsJson = JSON.stringify(routeCoordinates || []);
    const stationsJson = JSON.stringify(stations || []);
    const sourceJson = JSON.stringify(source || { name: 'Source', latitude: 12.8452, longitude: 77.6602 });
    const destJson = JSON.stringify(destination || { name: 'Destination', latitude: 12.3052, longitude: 76.6552 });
    const currentLocJson = JSON.stringify(currentLocation || { latitude: 12.8452, longitude: 77.6602 });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    .station-pin {
      width: 38px;
      height: 38px;
      background: #0F172A;
      border: 2.5px solid #10B981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10B981;
      font-size: 18px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .station-pin:hover {
      transform: scale(1.15);
    }
    .start-pin {
      width: 32px;
      height: 32px;
      background: #10B981;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 15px;
      box-shadow: 0 4px 10px rgba(16,185,129,0.4);
    }
    .dest-pin {
      width: 32px;
      height: 32px;
      background: #EF4444;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 15px;
      box-shadow: 0 4px 10px rgba(239,68,68,0.4);
    }
    .user-pin {
      width: 22px;
      height: 22px;
      background: #2563EB;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(37,99,235,0.3), 0 3px 6px rgba(0,0,0,0.25);
    }

    .leaflet-popup-content-wrapper {
      background: #FFFFFF;
      border-radius: 14px;
      padding: 6px;
      box-shadow: 0 6px 18px rgba(15,23,42,0.2);
    }
    .leaflet-popup-content {
      margin: 8px 10px;
      line-height: 1.3;
    }
    .popup-title {
      font-weight: 800;
      font-size: 13px;
      color: #0F172A;
      margin-bottom: 2px;
    }
    .popup-meta {
      font-size: 11px;
      color: #64748B;
      margin-bottom: 6px;
    }
    .popup-btn {
      display: block;
      width: 100%;
      background: #10B981;
      color: #0F172A;
      font-weight: 800;
      font-size: 11px;
      padding: 6px 8px;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      text-decoration: none;
    }
    .osm-attribution {
      position: absolute;
      bottom: 4px;
      right: 6px;
      font-size: 10px;
      color: #64748B;
      background: rgba(255,255,255,0.7);
      padding: 1px 5px;
      border-radius: 4px;
      z-index: 999;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="osm-attribution">© OpenStreetMap contributors</div>

  <script>
    var routeCoords = ${coordsJson};
    var stations = ${stationsJson};
    var source = ${sourceJson};
    var destination = ${destJson};
    var currentLoc = ${currentLocJson};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([12.58, 77.16], 9);

    // Official OpenStreetMap Tile Server (Free, No API Key)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Helpers to notify React Native
    function sendStationEvent(stationId) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'STATION_CLICK',
          stationId: stationId
        }));
      }
    }

    var allBounds = [];

    // 1. Render Single Route Polyline
    if (routeCoords && routeCoords.length > 0) {
      var latlngs = routeCoords.map(function(c) { return [c.latitude, c.longitude]; });
      
      // Shadow halo
      L.polyline(latlngs, {
        color: '#065F46',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Main EV corridor line
      var routeLine = L.polyline(latlngs, {
        color: '#10B981',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      latlngs.forEach(function(ll) { allBounds.push(ll); });
    }

    // 2. Source Marker (Start)
    if (source && (source.latitude || (routeCoords && routeCoords[0]))) {
      var sLat = source.latitude || routeCoords[0].latitude;
      var sLng = source.longitude || routeCoords[0].longitude;
      var sIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="start-pin">A</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });
      L.marker([sLat, sLng], { icon: sIcon })
        .bindPopup('<div class="popup-title">Start Location</div><div class="popup-meta">' + (source.name || 'Origin') + '</div>')
        .addTo(map);
      allBounds.push([sLat, sLng]);
    }

    // 3. Destination Marker (End)
    if (destination && (destination.latitude || (routeCoords && routeCoords[routeCoords.length - 1]))) {
      var dLat = destination.latitude || routeCoords[routeCoords.length - 1].latitude;
      var dLng = destination.longitude || routeCoords[routeCoords.length - 1].longitude;
      var dIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="dest-pin">B</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });
      L.marker([dLat, dLng], { icon: dIcon })
        .bindPopup('<div class="popup-title">Destination</div><div class="popup-meta">' + (destination.name || 'End') + '</div>')
        .addTo(map);
      allBounds.push([dLat, dLng]);
    }

    // 4. Current User Location Marker
    if (currentLoc && currentLoc.latitude) {
      var uIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="user-pin"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      L.marker([currentLoc.latitude, currentLoc.longitude], { icon: uIcon })
        .bindPopup('<div class="popup-title">Current EV Position</div><div class="popup-meta">GPS Active • Telemetry Linked</div>')
        .addTo(map);
      allBounds.push([currentLoc.latitude, currentLoc.longitude]);
    }

    // 5. Charging Station Markers
    if (stations && stations.length > 0) {
      stations.forEach(function(st) {
        if (!st.coordinate) return;
        var cIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div class="station-pin">⚡</div>',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -20]
        });

        var marker = L.marker([st.coordinate.latitude, st.coordinate.longitude], { icon: cIcon });
        
        var popupHtml = '<div class="popup-title">' + st.name + '</div>' +
          '<div class="popup-meta">' + st.chargingPower + ' • ' + (st.estimatedPrice || '') + '</div>' +
          '<div class="popup-meta">★ ' + st.rating + ' (' + (st.reviews ? st.reviews.length : 0) + ' reviews)</div>' +
          '<div class="popup-btn" onclick="sendStationEvent(\\'' + st.id + '\\')">View Details & Reviews</div>';

        marker.bindPopup(popupHtml);

        marker.on('click', function() {
          sendStationEvent(st.id);
        });

        marker.addTo(map);
        allBounds.push([st.coordinate.latitude, st.coordinate.longitude]);
      });
    }

    // Auto-fit route and markers into view
    if (allBounds.length > 0) {
      map.fitBounds(allBounds, {
        padding: [60, 60],
        maxZoom: 14
      });
    }
  </script>
</body>
</html>
    `;
  }, [source, destination, currentLocation, routeCoordinates, stations]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'STATION_CLICK' && data.stationId) {
        const found = stations.find((s) => s.id === data.stationId);
        if (found && onStationPress) {
          onStationPress(found);
        }
      }
    } catch (e) {
      console.error('Error handling map message:', e);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="OpenStreetMap View"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scalesPageToFit={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
});
