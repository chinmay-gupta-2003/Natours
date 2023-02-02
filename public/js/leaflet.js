export const displayMap = (locations) => {
  const greenIcon = L.icon({
    iconUrl: '/img/pin.png',
    iconSize: [32, 40], // size of the icon
    iconAnchor: [18, 40],
  });

  let map = L.map('map', {
    zoomControl: false,
    dragging: false,
  });

  L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/osmfr/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(map);

  const points = [];

  locations.forEach((loc) => {
    const marker = document.createElement('div');
    marker.className = 'marker';

    points.push([loc.coordinates[1], loc.coordinates[0]]);

    L.marker([loc.coordinates[1], loc.coordinates[0]], { icon: greenIcon })
      .addTo(map)
      .bindPopup(
        L.popup({
          maxWidth: 240,
          minWidth: 120,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent(`Day ${loc.day}: ${loc.description}`)
      .openPopup();
  });

  const bounds = L.latLngBounds(points);
  map.fitBounds(bounds, {
    padding: [100, 200],
  });

  map.scrollWheelZoom.disable();
};
